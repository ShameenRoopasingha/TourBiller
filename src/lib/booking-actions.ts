'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
    BookingSchema, 
    type ActionResult, 
    type BookingWithDriver, 
    type EmergencyVehicleSwapOptions, 
    EmergencyVehicleSwapSchema,
    type DriverHandoverOptions,
    DriverHandoverOptionsSchema
} from '@/lib/validations';
import { type Booking } from '@prisma/client';
import { revalidateFor } from '@/lib/revalidation';
import { revalidatePath } from 'next/cache';
import { requireAuth, requireAdmin } from '@/lib/auth-guard';
import { checkVehicleAvailability } from '@/lib/vehicle-actions';
import { checkDriverAvailability } from '@/lib/user-actions';


/**
 * Generate a quotation from tour schedule and customer data
 */
export async function createBooking(formData: FormData): Promise<ActionResult<string>> {
    try {
        const authCheck = await requireAdmin();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }

        const rawData = {
            vehicleNo: formData.get('vehicleNo') as string,
            customerName: formData.get('customerName') as string,
            startDate: formData.get('startDate') as string,
            endDate: formData.get('endDate') ? formData.get('endDate') as string : undefined,
            destination: (formData.get('destination') as string) || undefined,
            notes: (formData.get('notes') as string) || undefined,
            advanceAmount: parseFloat(formData.get('advanceAmount') as string) || 0,
            driverId: (formData.get('driverId') as string) || undefined,
            status: 'CONFIRMED',
        };

        const validatedData = BookingSchema.parse(rawData);

        // Check vehicle availability
        if (validatedData.vehicleNo && validatedData.startDate) {
            const endDate = validatedData.endDate || validatedData.startDate;
            const availability = await checkVehicleAvailability(
                validatedData.vehicleNo,
                validatedData.startDate,
                endDate,
                undefined,
                'Booking'
            );
            
            if (availability.success && availability.data && !availability.data.available) {
                const conflict = availability.data.conflicts[0];
                return { 
                    success: false, 
                    error: `Vehicle is already occupied by ${conflict.customer} (${conflict.type}: ${conflict.reference}) until ${new Date(conflict.end).toLocaleDateString('en-GB')}` 
                };
            }
        }

        // Check driver availability
        if (validatedData.driverId && validatedData.startDate) {
            const endDate = validatedData.endDate || validatedData.startDate;
            const driverAvailability = await checkDriverAvailability(
                validatedData.driverId,
                validatedData.startDate,
                endDate,
                undefined,
                'Booking'
            );
            
            if (driverAvailability.success && driverAvailability.data && !driverAvailability.data.available) {
                const conflict = driverAvailability.data.conflicts[0];
                return { 
                    success: false, 
                    error: `Driver is already assigned to a tour for ${conflict.customer} (${conflict.type}) until ${new Date(conflict.end).toLocaleDateString('en-GB')}` 
                };
            }
        }

        const booking = await prisma.booking.create({
            data: { companyId: authCheck.companyId!, ...validatedData },
        });

        revalidateFor('booking');

        return {
            success: true,
            data: booking.id,
        };
    } catch (error) {
        console.error('Error creating booking:', error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Failed to create booking' };
    }
}

/**
 * Get all bookings
 */
export async function getBookings(searchQuery?: string): Promise<ActionResult<BookingWithDriver[]>> {
    try {
        const authCheck = await requireAuth();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }

        const bookings = await prisma.booking.findMany({
            where: {
                companyId: authCheck.companyId,
                ...(searchQuery ? {
                    OR: [
                        { vehicleNo: { contains: searchQuery, mode: 'insensitive' } },
                        { customerName: { contains: searchQuery, mode: 'insensitive' } },
                        { destination: { contains: searchQuery, mode: 'insensitive' } },
                    ],
                } : {}),
            },
            include: {
                driver: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                tripActivities: {
                    where: {
                        type: { in: ['HANDOVER_REQUESTED', 'HANDOVER', 'BREAKDOWN_REPORTED', 'VEHICLE_SWAPPED'] }
                    },
                    select: {
                        id: true,
                        type: true,
                        note: true,
                        timestamp: true,
                    },
                    orderBy: { timestamp: 'desc' },
                    take: 4,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return { success: true, data: bookings as unknown as BookingWithDriver[] };
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return { success: false, error: 'Failed to fetch bookings' };
    }
}

/**
 * Cancel a booking
 */
export async function cancelBooking(id: string): Promise<ActionResult<void>> {
    try {
        const authCheck = await requireAdmin();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }

        // 1. Fetch booking to check date
        const booking = await prisma.booking.findFirst({
            where: { id, companyId: authCheck.companyId },
        });

        if (!booking) {
            return { success: false, error: 'Booking not found' };
        }

        // 2. Calculate Refund Status
        let refundStatus = null;
        if (booking.advanceAmount > 0) {
            const now = new Date();
            const tripDate = new Date(booking.startDate);
            const diffTime = tripDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Refund Policy: > 7 days = REFUNDED, <= 7 days = FORFEITED
            refundStatus = (diffDays > 7) ? 'REFUNDED' : 'FORFEITED';
        }

        // 3. Update Booking
        const _res = await prisma.booking.updateMany({
            where: { id, companyId: authCheck.companyId },
            data: {
                status: 'CANCELLED',
                refundStatus: refundStatus,
            },
        });
        if (_res.count === 0) return { success: false, error: 'Record not found or unauthorized' };

        revalidateFor('booking');

        return { success: true };
    } catch (error) {
        console.error('Error cancelling booking:', error);
        return { success: false, error: 'Failed to cancel booking' };
    }
}

/**
 * Get a single booking by ID
 */
export async function getBookingById(id: string): Promise<ActionResult<BookingWithDriver>> {
    try {
        const authCheck = await requireAuth();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }

        const booking = await prisma.booking.findFirst({
            where: { id, companyId: authCheck.companyId },
            include: {
                driver: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                tripActivities: {
                    orderBy: { timestamp: 'desc' },
                    include: {
                        driver: {
                            select: { name: true }
                        }
                    }
                }
            },
        });

        if (!booking) {
            return { success: false, error: 'Booking not found' };
        }

        return { success: true, data: booking as unknown as BookingWithDriver };
    } catch (error) {
        console.error('Error fetching booking:', error);
        return { success: false, error: 'Failed to fetch booking' };
    }
}

/**
 * Assign, change, or handover a driver for an existing booking
 */
export async function assignDriverToBooking(
    bookingId: string, 
    driverId: string | null,
    handoverOptions?: DriverHandoverOptions
): Promise<ActionResult<void>> {
    try {
        const authCheck = await requireAdmin();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }

        const booking = await prisma.booking.findFirst({
            where: { id: bookingId, companyId: authCheck.companyId },
            include: {
                driver: {
                    select: { id: true, name: true }
                }
            }
        });
        if (!booking) return { success: false, error: 'Booking not found' };

        const previousDriverId = booking.driverId;
        const previousDriverName = booking.driver?.name || 'Previous Driver';

        if (driverId) {
            const endDate = booking.endDate || booking.startDate;
            const driverAvailability = await checkDriverAvailability(
                driverId,
                booking.startDate,
                endDate,
                bookingId,
                'Booking'
            );
            if (driverAvailability.success && driverAvailability.data && !driverAvailability.data.available) {
                const conflict = driverAvailability.data.conflicts[0];
                return {
                    success: false,
                    error: `Driver is already assigned to a tour for ${conflict.customer} (${conflict.type}) until ${new Date(conflict.end).toLocaleDateString('en-GB')}`
                };
            }
        }

        // Fetch new driver name if assigned
        let newDriverName = 'Unassigned';
        if (driverId) {
            const newDriver = await prisma.user.findUnique({
                where: { id: driverId },
                select: { name: true }
            });
            if (newDriver) newDriverName = newDriver.name;
        }

        if (handoverOptions) {
            const parsedHandover = DriverHandoverOptionsSchema.safeParse(handoverOptions);
            if (!parsedHandover.success) {
                return { success: false, error: parsedHandover.error.issues[0]?.message || 'Invalid handover options' };
            }
        }

        // Validate mandatory handover meter reading for ONGOING tours
        if (booking.status === 'ONGOING' && previousDriverId && previousDriverId !== driverId) {
            if (!handoverOptions?.handoverMeterReading?.trim()) {
                return { 
                    success: false, 
                    error: 'Handover Odometer / Meter Reading is strictly required for a mid-tour driver handover.' 
                };
            }
        }

        // Execute update in transaction
        await prisma.$transaction(async (tx) => {
            // 1. Update booking driver
            await tx.booking.update({
                where: { id: bookingId },
                data: { driverId: driverId || null },
            });

            // 2. If tour is ONGOING and driver is changing, record HANDOVER TripActivity
            if (booking.status === 'ONGOING' && previousDriverId && previousDriverId !== driverId) {
                const meterText = handoverOptions?.handoverMeterReading ? `Meter: ${handoverOptions.handoverMeterReading} km` : null;
                const reasonText = handoverOptions?.reason ? `Reason: ${handoverOptions.reason}` : null;
                const locText = handoverOptions?.location ? `Location: ${handoverOptions.location}` : null;
                const notesText = handoverOptions?.notes ? `Notes: ${handoverOptions.notes}` : null;
                
                const details = [meterText, reasonText, locText, notesText].filter(Boolean).join(' | ');
                const handoverNote = `Mid-Tour Handover: Reassigned from ${previousDriverName} to ${newDriverName}.${details ? ` (${details})` : ''}`;

                await tx.tripActivity.create({
                    data: {
                        companyId: authCheck.companyId!,
                        bookingId,
                        driverId: previousDriverId,
                        type: 'HANDOVER',
                        note: handoverNote,
                    }
                });

                // Check if previous driver has any other ONGOING bookings
                const otherOngoing = await tx.booking.count({
                    where: {
                        driverId: previousDriverId,
                        status: 'ONGOING',
                        id: { not: bookingId }
                    }
                });
                if (otherOngoing === 0) {
                    await tx.user.update({
                        where: { id: previousDriverId },
                        data: { isLiveTracking: false }
                    });
                }
            }
        });

        revalidateFor('booking');
        return { success: true };
    } catch (error) {
        console.error('Error assigning driver to booking:', error);
        return { success: false, error: 'Failed to assign driver' };
    }
}

/**
 * Perform an emergency vehicle swap for an active or confirmed booking
 * Supports both Company Fleet Vehicles and Third-Party / External Hire Vehicles
 */
export async function swapBookingVehicle(
    bookingId: string,
    options: EmergencyVehicleSwapOptions
): Promise<ActionResult<void>> {
    try {
        const authCheck = await requireAdmin();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }

        const companyId = authCheck.companyId!;
        const booking = await prisma.booking.findFirst({
            where: { id: bookingId, companyId },
            include: { driver: true }
        });

        if (!booking) {
            return { success: false, error: 'Booking not found' };
        }

        const parsedOptions = EmergencyVehicleSwapSchema.safeParse(options);
        if (!parsedOptions.success) {
            return { success: false, error: parsedOptions.error.issues[0]?.message || 'Invalid swap options' };
        }
        const validOptions = parsedOptions.data;

        const oldVehicleNo = booking.vehicleNo.trim().toUpperCase();
        const newVehicleNo = validOptions.newVehicleNo.trim().toUpperCase();

        if (newVehicleNo === oldVehicleNo) {
            return { success: false, error: 'Replacement vehicle number must be different from current vehicle.' };
        }

        // Validate Fleet vehicle availability if choosing company vehicle
        if (validOptions.swapType === 'FLEET') {
            const fleetVehicle = await prisma.vehicle.findUnique({
                where: {
                    companyId_vehicleNo: {
                        companyId,
                        vehicleNo: newVehicleNo
                    }
                }
            });

            if (!fleetVehicle) {
                return { success: false, error: `Vehicle ${newVehicleNo} not found in company fleet.` };
            }

            if (fleetVehicle.status === 'RETIRED') {
                return { success: false, error: `Vehicle ${newVehicleNo} is retired and cannot be assigned.` };
            }

            const endDate = booking.endDate || booking.startDate;
            const availability = await checkVehicleAvailability(
                newVehicleNo,
                booking.startDate,
                endDate,
                bookingId,
                'Booking'
            );

            if (availability.success && availability.data && !availability.data.available) {
                const conflict = availability.data.conflicts[0];
                return {
                    success: false,
                    error: `Fleet vehicle ${newVehicleNo} is already occupied by ${conflict.customer} (${conflict.type}) until ${new Date(conflict.end).toLocaleDateString('en-GB')}`
                };
            }
        }

        const oldMeterNum = parseFloat(validOptions.breakdownMeterReading);
        const newMeterNum = parseFloat(validOptions.newVehicleStartMeter);

        // Execute transaction
        await prisma.$transaction(async (tx) => {
            // 1. Update booking vehicle number
            await tx.booking.update({
                where: { id: bookingId },
                data: { vehicleNo: newVehicleNo }
            });

            // 2. If external hire and cost provided, create VehicleExpense
            if (validOptions.swapType === 'EXTERNAL' && validOptions.hireCost && validOptions.hireCost > 0) {
                await tx.vehicleExpense.create({
                    data: {
                        companyId,
                        vehicleNo: newVehicleNo,
                        amount: validOptions.hireCost,
                        category: 'BREAKDOWN',
                        expenseType: validOptions.expenseType || 'COMPANY',
                        bookingId,
                        driverId: booking.driverId || undefined,
                        description: `Emergency replacement vehicle hired from ${validOptions.supplierName || 'External Supplier'}${validOptions.supplierPhone ? ` (Contact: ${validOptions.supplierPhone})` : ''} due to breakdown of ${oldVehicleNo}. Reason: ${validOptions.reason}`,
                    }
                });
            }

            // 3. Mark old fleet vehicle as MAINTENANCE and update its mileage
            if (validOptions.markOldVehicleMaintenance !== false) {
                const oldFleetVehicle = await tx.vehicle.findUnique({
                    where: {
                        companyId_vehicleNo: {
                            companyId,
                            vehicleNo: oldVehicleNo
                        }
                    }
                });

                if (oldFleetVehicle) {
                    await tx.vehicle.update({
                        where: { id: oldFleetVehicle.id },
                        data: {
                            status: 'MAINTENANCE',
                            ...(isNaN(oldMeterNum) ? {} : {
                                currentMileage: Math.max(oldFleetVehicle.currentMileage, oldMeterNum)
                            })
                        }
                    });
                }
            }

            // 4. Update new fleet vehicle's mileage if applicable
            if (validOptions.swapType === 'FLEET' && !isNaN(newMeterNum)) {
                const newFleetVehicle = await tx.vehicle.findUnique({
                    where: {
                        companyId_vehicleNo: {
                            companyId,
                            vehicleNo: newVehicleNo
                        }
                    }
                });

                if (newFleetVehicle && newMeterNum > newFleetVehicle.currentMileage) {
                    await tx.vehicle.update({
                        where: { id: newFleetVehicle.id },
                        data: { currentMileage: newMeterNum }
                    });
                }
            }

            // 5. Record TripActivity audit record
            const swapTypeLabel = validOptions.swapType === 'FLEET' ? 'Company Fleet Vehicle' : 'External Third-Party Hire';
            const supplierInfo = validOptions.supplierName ? ` | Supplier: ${validOptions.supplierName}${validOptions.hireCost ? ` (Rs. ${validOptions.hireCost.toLocaleString()})` : ''}` : '';
            const noteText = `Emergency Vehicle Swap: ${oldVehicleNo} (Breakdown Meter: ${validOptions.breakdownMeterReading} km) ➔ ${newVehicleNo} (Start Meter: ${validOptions.newVehicleStartMeter} km) | Type: ${swapTypeLabel} | Location: ${validOptions.location} | Issue: ${validOptions.reason}${supplierInfo}${validOptions.notes ? ` | Notes: ${validOptions.notes}` : ''}`;

            await tx.tripActivity.create({
                data: {
                    companyId,
                    bookingId,
                    driverId: booking.driverId || authCheck.userId!,
                    type: 'VEHICLE_SWAPPED',
                    note: noteText,
                }
            });
        });

        revalidateFor('booking');
        revalidateFor('vehicle');
        revalidatePath(`/bookings/${bookingId}`);

        return { success: true };
    } catch (error) {
        console.error('Error swapping booking vehicle:', error);
        return { success: false, error: 'Failed to complete emergency vehicle swap' };
    }
}


