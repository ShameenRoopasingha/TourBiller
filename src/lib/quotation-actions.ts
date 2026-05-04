'use server';

import { prisma } from '@/lib/prisma';
import { QuotationSchema, type ActionResult, type QuotationWithSchedule } from '@/lib/validations';
import { revalidateFor } from '@/lib/revalidation';
import { requireAdmin, requireAuth } from '@/lib/auth-guard';
import { checkVehicleAvailability } from '@/lib/vehicle-actions';

// Types for server responses


/**
 * Generate a quotation from tour schedule and customer data
 * Auto-calculates totals from the schedule's day items.
 */
export async function generateQuotation(
    tourScheduleId: string,
    formData: FormData
): Promise<ActionResult<string>> {
    try {
        const authCheck = await requireAdmin();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }

        const rawData = {
            tourScheduleId,
            customerName: formData.get('customerName') as string,
            customerEmail: formData.get('customerEmail') as string || undefined,
            customerPhone: formData.get('customerPhone') as string || undefined,
            vehicleNo: formData.get('vehicleNo') as string || undefined,
            numberOfPersons: parseInt(formData.get('numberOfPersons') as string) || 1,
            startDate: formData.get('startDate') ? new Date(formData.get('startDate') as string) : undefined,
            endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string) : undefined,
            pickupLocation: formData.get('pickupLocation') as string || undefined,
            dropLocation: formData.get('dropLocation') as string || undefined,
            hireRatePerDay: parseFloat(formData.get('hireRatePerDay') as string) || 0,
            kmPerDay: parseFloat(formData.get('kmPerDay') as string) || 0,
            excessKmRate: parseFloat(formData.get('excessKmRate') as string) || 0,
            extraHourRate: parseFloat(formData.get('extraHourRate') as string) || 0,
            markup: parseFloat(formData.get('markup') as string) || 0,
            discount: parseFloat(formData.get('discount') as string) || 0,
            driverCostPerDay: parseFloat(formData.get('driverCostPerDay') as string) || 0,
            advanceAmount: parseFloat(formData.get('advanceAmount') as string) || 0,
            excludedItems: formData.get('excludedItems') as string || undefined,
            notes: formData.get('notes') as string || undefined,
            status: formData.get('status') as string || 'DRAFT',
            validUntil: formData.get('validUntil') ? new Date(formData.get('validUntil') as string) : undefined,
            driverId: (formData.get('driverId') as string) || undefined,
        };

        const validated = QuotationSchema.parse(rawData);

        // Fetch the tour schedule with items to calculate totals
        const schedule = await prisma.tourSchedule.findUnique({
            where: { id: validated.tourScheduleId },
            include: { items: true },
        });

        if (!schedule) {
            throw new Error('Tour schedule not found');
        }

        // Check vehicle availability if both vehicle and dates are provided
        if (validated.vehicleNo && validated.startDate && validated.endDate) {
            const availability = await checkVehicleAvailability(
                validated.vehicleNo,
                validated.startDate,
                validated.endDate!,
                undefined,
                'Quotation'
            );
            if (availability.success && availability.data && !availability.data.available) {
                const conflict = availability.data.conflicts[0];
                throw new Error(`Vehicle ${validated.vehicleNo} is already occupied by ${conflict.customer} (${conflict.type}: ${conflict.reference}) from ${new Date(conflict.start).toLocaleDateString()} to ${new Date(conflict.end).toLocaleDateString()}`);
            }
        }

        // Calculate totals from day items in a single pass
        const itemTotals = schedule.items.reduce(
            (acc, item) => ({
                distance: acc.distance + item.distanceKm,
                accommodation: acc.accommodation + item.accommodation,
                meals: acc.meals + item.meals,
                activities: acc.activities + item.activities,
                other: acc.other + item.otherCosts,
            }),
            { distance: 0, accommodation: 0, meals: 0, activities: 0, other: 0 }
        );

        const transportCost = schedule.days * (validated.hireRatePerDay || 0);
        const driverTotal = schedule.days * (validated.driverCostPerDay || 0);
        const subtotal = transportCost + driverTotal + itemTotals.accommodation + itemTotals.meals + itemTotals.activities + itemTotals.other;
        const markupAmount = subtotal * ((validated.markup || 0) / 100);
        const totalAmount = subtotal + markupAmount - (validated.discount || 0);

        const quotation = await prisma.quotation.create({
            data: {
                tourScheduleId: validated.tourScheduleId,
                customerName: validated.customerName,
                customerEmail: validated.customerEmail || null,
                customerPhone: validated.customerPhone || null,
                vehicleNo: validated.vehicleNo || null,
                numberOfPersons: validated.numberOfPersons || 1,
                startDate: validated.startDate || null,
                endDate: validated.endDate || null,
                pickupLocation: validated.pickupLocation || null,
                dropLocation: validated.dropLocation || null,
                hireRatePerDay: validated.hireRatePerDay || 0,
                kmPerDay: validated.kmPerDay || 0,
                excessKmRate: validated.excessKmRate || 0,
                extraHourRate: validated.extraHourRate || 0,
                totalDistance: itemTotals.distance,
                transportCost,
                accommodationTotal: itemTotals.accommodation,
                mealsTotal: itemTotals.meals,
                activitiesTotal: itemTotals.activities,
                otherCostsTotal: itemTotals.other,
                markup: validated.markup || 0,
                discount: validated.discount || 0,
                driverCostPerDay: validated.driverCostPerDay || 0,
                advanceAmount: validated.advanceAmount || 0,
                excludedItems: validated.excludedItems || null,
                totalAmount: Math.max(0, totalAmount),
                notes: validated.notes || null,
                validUntil: validated.validUntil || null,
                status: 'DRAFT',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
        });

        revalidateFor('quotation');
        return { success: true, data: quotation.id };
    } catch (error) {
        console.error('Error generating quotation:', error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Failed to generate quotation' };
    }
}

/**
 * Get all quotations with optional search
 */
export async function getQuotations(
    searchQuery?: string
): Promise<ActionResult<QuotationWithSchedule[]>> {
    try {
        const quotations = await prisma.quotation.findMany({
            where: searchQuery
                ? {
                    OR: [
                        { customerName: { contains: searchQuery, mode: 'insensitive' } },
                        { tourSchedule: { name: { contains: searchQuery, mode: 'insensitive' } } },
                        ...(Number.isFinite(Number(searchQuery))
                            ? [{ quotationNumber: { equals: Number(searchQuery) } }]
                            : []),
                    ],
                }
                : undefined,
            include: {
                tourSchedule: {
                    include: { items: { orderBy: { dayNumber: 'asc' } } },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return { success: true, data: quotations as unknown as QuotationWithSchedule[] };
    } catch (error) {
        console.error('Error fetching quotations:', error);
        return { success: false, error: 'Failed to fetch quotations' };
    }
}

/**
 * Get a single quotation by ID with full tour schedule details
 */
export async function getQuotationById(
    id: string
): Promise<ActionResult<QuotationWithSchedule>> {
    try {
        const quotation = await prisma.quotation.findUnique({
            where: { id },
            include: {
                tourSchedule: {
                    include: { items: { orderBy: { dayNumber: 'asc' } } },
                },
            },
        });

        if (!quotation) {
            return { success: false, error: 'Quotation not found' };
        }

        return { success: true, data: quotation as unknown as QuotationWithSchedule };
    } catch (error) {
        console.error('Error fetching quotation:', error);
        return { success: false, error: 'Failed to fetch quotation' };
    }
}

/**
 * Update an existing quotation
 */
export async function updateQuotation(
    id: string,
    tourScheduleId: string,
    formData: FormData
): Promise<ActionResult<string>> {
    try {
        const authCheck = await requireAuth();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }

        const rawData = {
            id,
            tourScheduleId,
            customerName: formData.get('customerName') as string,
            customerEmail: formData.get('customerEmail') as string || undefined,
            customerPhone: formData.get('customerPhone') as string || undefined,
            vehicleNo: formData.get('vehicleNo') as string || undefined,
            numberOfPersons: parseInt(formData.get('numberOfPersons') as string) || 1,
            startDate: formData.get('startDate') ? new Date(formData.get('startDate') as string) : undefined,
            endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string) : undefined,
            pickupLocation: formData.get('pickupLocation') as string || undefined,
            dropLocation: formData.get('dropLocation') as string || undefined,
            hireRatePerDay: parseFloat(formData.get('hireRatePerDay') as string) || 0,
            kmPerDay: parseFloat(formData.get('kmPerDay') as string) || 0,
            excessKmRate: parseFloat(formData.get('excessKmRate') as string) || 0,
            extraHourRate: parseFloat(formData.get('extraHourRate') as string) || 0,
            markup: parseFloat(formData.get('markup') as string) || 0,
            discount: parseFloat(formData.get('discount') as string) || 0,
            driverCostPerDay: parseFloat(formData.get('driverCostPerDay') as string) || 0,
            advanceAmount: parseFloat(formData.get('advanceAmount') as string) || 0,
            excludedItems: formData.get('excludedItems') as string || undefined,
            notes: formData.get('notes') as string || undefined,
            status: formData.get('status') as string || 'DRAFT',
            validUntil: formData.get('validUntil') ? new Date(formData.get('validUntil') as string) : undefined,
            driverId: (formData.get('driverId') as string) || undefined,
        };

        const validated = QuotationSchema.parse(rawData);

        // Check vehicle availability (excluding this quotation)
        if (validated.vehicleNo && validated.startDate && validated.endDate) {
            const availability = await checkVehicleAvailability(
                validated.vehicleNo,
                validated.startDate,
                validated.endDate,
                id,
                'Quotation'
            );
            if (availability.success && availability.data && !availability.data.available) {
                const conflict = availability.data.conflicts[0];
                return { 
                    success: false, 
                    error: `Vehicle ${validated.vehicleNo} is already occupied by ${conflict.customer} (${conflict.type}: ${conflict.reference}) until ${new Date(conflict.end).toLocaleDateString()}` 
                };
            }
        }

        // Get schedule details for calculations
        const schedule = await prisma.tourSchedule.findUnique({
            where: { id: tourScheduleId },
            include: { items: true },
        });

        if (!schedule) {
            return { success: false, error: 'Tour schedule not found' };
        }

        // Calculate totals
        const itemTotals = schedule.items.reduce(
            (acc, item) => ({
                distance: acc.distance + item.distanceKm,
                accommodation: acc.accommodation + item.accommodation,
                meals: acc.meals + item.meals,
                activities: acc.activities + item.activities,
                other: acc.other + item.otherCosts,
            }),
            { distance: 0, accommodation: 0, meals: 0, activities: 0, other: 0 }
        );

        const transportCost = validated.hireRatePerDay * schedule.days;
        const driverTotal = schedule.days * (validated.driverCostPerDay || 0);
        const subtotal = transportCost + driverTotal + itemTotals.accommodation + itemTotals.meals + itemTotals.activities + itemTotals.other;
        const markupAmount = subtotal * ((validated.markup || 0) / 100);
        const totalAmount = subtotal + markupAmount - (validated.discount || 0);

        const quotation = await prisma.quotation.update({
            where: { id },
            data: {
                ...validated,
                tourScheduleId,
                totalDistance: itemTotals.distance,
                transportCost,
                accommodationTotal: itemTotals.accommodation,
                mealsTotal: itemTotals.meals,
                activitiesTotal: itemTotals.activities,
                otherCostsTotal: itemTotals.other,
                totalAmount,
            },
        });

        revalidateFor('quotation');
        return { success: true, data: quotation.id };
    } catch (error) {
        console.error('Error updating quotation:', error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Failed to update quotation' };
    }
}

/**
 * Update quotation status
 */
export async function updateQuotationStatus(
    id: string,
    status: string
): Promise<ActionResult<void>> {
    try {
        const validStatuses = ['DRAFT', 'SENT', 'ACCEPTED', 'EXPIRED'];
        if (!validStatuses.includes(status)) {
            return { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` };
        }

        if (status === 'ACCEPTED') {
            const quotation = await prisma.quotation.findUnique({
                where: { id },
                select: { vehicleNo: true, startDate: true, endDate: true }
            });

            if (quotation?.vehicleNo && quotation?.startDate && quotation?.endDate) {
                const availability = await checkVehicleAvailability(
                    quotation.vehicleNo,
                    quotation.startDate,
                    quotation.endDate,
                    id, // Exclude current quotation
                    'Quotation'
                );
                if (availability.success && availability.data && !availability.data.available) {
                    const conflict = availability.data.conflicts[0];
                    return { 
                        success: false, 
                        error: `Cannot accept quotation. Vehicle ${quotation.vehicleNo} is already occupied by ${conflict.customer} (${conflict.type}: ${conflict.reference}) until ${new Date(conflict.end).toLocaleDateString()}` 
                    };
                }
            }
        }

        await prisma.quotation.update({
            where: { id },
            data: { status },
        });

        revalidateFor('quotation');
        return { success: true };
    } catch (error) {
        console.error('Error updating quotation status:', error);
        return { success: false, error: 'Failed to update quotation status' };
    }
}

/**
 * Delete a quotation
 */
export async function deleteQuotation(id: string): Promise<ActionResult<void>> {
    try {
        const authCheck = await requireAdmin();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }

        await prisma.quotation.delete({
            where: { id },
        });

        revalidateFor('quotation');
        return { success: true };
    } catch (error) {
        console.error('Error deleting quotation:', error);
        return { success: false, error: 'Failed to delete quotation' };
    }
}

/**
 * Convert a quotation into a booking
 */
export async function convertQuotationToBooking(quotationId: string): Promise<ActionResult<string>> {
    try {
        const authCheck = await requireAdmin();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }

        const newBookingId = await prisma.$transaction(async (tx) => {
            const quotation = await tx.quotation.findUnique({
                where: { id: quotationId },
            });

            if (!quotation) {
                throw new Error('Quotation not found');
            }
            if (!quotation.startDate) {
                throw new Error('Quotation must have a start date to become a booking');
            }
            if (!quotation.vehicleNo) {
                throw new Error('Quotation must have a vehicle assigned to become a booking');
            }
            if (quotation.status === 'ACCEPTED') {
                throw new Error('Quotation is already accepted');
            }

            // Check availability one last time before converting
            if (quotation.vehicleNo && quotation.startDate && quotation.endDate) {
                const availability = await checkVehicleAvailability(
                    quotation.vehicleNo,
                    quotation.startDate,
                    quotation.endDate as Date,
                    quotationId, // Exclude the current quotation from the availability check
                    'Quotation'
                );
                if (availability.success && availability.data && !availability.data.available) {
                    const conflict = availability.data.conflicts[0];
                    throw new Error(`Cannot convert to booking. Vehicle ${quotation.vehicleNo} is already occupied by ${conflict.customer} (${conflict.type}: ${conflict.reference}) until ${new Date(conflict.end).toLocaleDateString()}`);
                }
            }

            // Create booking
            let destination = 'Various locations (Tour)';
            const q = quotation as Record<string, unknown>; // Bypass stale IDE Prisma type cache
            if (q.pickupLocation || q.dropLocation) {
                destination = `${(q.pickupLocation as string) || 'Not specified'} to ${(q.dropLocation as string) || 'Not specified'}`;
            }

            const booking = await tx.booking.create({
                data: {
                    vehicleNo: quotation.vehicleNo!,
                    customerName: quotation.customerName,
                    startDate: quotation.startDate!,
                    endDate: q.endDate as Date | null,
                    destination: destination,
                    notes: `Autogenerated from Quotation #${quotation.quotationNumber}. ${quotation.notes || ''}`.trim(),
                    advanceAmount: quotation.advanceAmount,
                    status: 'CONFIRMED',
                },
            });

            // Update quotation status
            await tx.quotation.update({
                where: { id: quotationId },
                data: { status: 'ACCEPTED' },
            });

            return booking.id;
        });

        revalidateFor('booking');
        revalidateFor('quotation');

        return { success: true, data: newBookingId };
    } catch (error) {
        console.error('Error converting quotation to booking:', error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Failed to convert quotation to booking' };
    }
}
