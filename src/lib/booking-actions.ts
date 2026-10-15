'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BookingSchema, type ActionResult, type BookingWithDriver } from '@/lib/validations';
import { type Booking } from '@prisma/client';
import { revalidateFor } from '@/lib/revalidation';
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

export interface DriverHandoverOptions {
    reason?: string;
    handoverMeterReading?: string;
    notes?: string;
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
                const notesText = handoverOptions?.notes ? `Notes: ${handoverOptions.notes}` : null;
                
                const details = [meterText, reasonText, notesText].filter(Boolean).join(' | ');
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

