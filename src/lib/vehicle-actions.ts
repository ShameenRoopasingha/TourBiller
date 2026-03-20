'use server';

import { prisma } from '@/lib/prisma';
import { VehicleSchema, type ActionResult, type Vehicle } from '@/lib/validations';
import { revalidateFor } from '@/lib/revalidation';
import { requireAdmin } from '@/lib/auth-guard';

/**
 * Create a new vehicle
 */
export async function createVehicle(formData: FormData): Promise<ActionResult<string>> {
    try {
        const authCheck = await requireAdmin();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }

        const rawData = {
            vehicleNo: formData.get('vehicleNo') as string,
            model: (formData.get('model') as string) || undefined,
            category: formData.get('category') as string,
            status: formData.get('status') as string,
            ratePerDay: parseFloat(formData.get('ratePerDay') as string) || 0,
            kmPerDay: parseFloat(formData.get('kmPerDay') as string) || 0,
            excessKmRate: parseFloat(formData.get('excessKmRate') as string) || 0,
            extraHourRate: parseFloat(formData.get('extraHourRate') as string) || 0,
            seats: formData.get('seats') ? parseInt(formData.get('seats') as string) : undefined,
            acType: (formData.get('acType') as string) || undefined,
            features: (formData.get('features') as string) || undefined,
            insuranceCoverage: (formData.get('insuranceCoverage') as string) || undefined,
        };

        const validatedData = VehicleSchema.parse(rawData);

        const vehicle = await prisma.vehicle.create({
            data: validatedData,
        });

        revalidateFor('vehicle');

        return {
            success: true,
            data: vehicle.id,
        };
    } catch (error) {
        console.error('Error creating vehicle:', error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Failed to create vehicle' };
    }
}

/**
 * Get all vehicles
 */
export async function getVehicles(searchQuery?: string): Promise<ActionResult<Vehicle[]>> {
    try {
        const vehicles = await prisma.vehicle.findMany({
            where: searchQuery ? {
                OR: [
                    { vehicleNo: { contains: searchQuery, mode: 'insensitive' } },
                    { model: { contains: searchQuery, mode: 'insensitive' } },
                ],
            } : undefined,
            orderBy: { updatedAt: 'desc' },
        });

        return { success: true, data: vehicles as Vehicle[] };
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        return { success: false, error: 'Failed to fetch vehicles' };
    }
}

/**
 * Update a vehicle
 */
export async function updateVehicle(id: string, formData: FormData): Promise<ActionResult<string>> {
    try {
        const authCheck = await requireAdmin();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }

        const rawData = {
            vehicleNo: formData.get('vehicleNo') as string,
            model: (formData.get('model') as string) || undefined,
            category: formData.get('category') as string,
            status: formData.get('status') as string,
            ratePerDay: parseFloat(formData.get('ratePerDay') as string) || 0,
            kmPerDay: parseFloat(formData.get('kmPerDay') as string) || 0,
            excessKmRate: parseFloat(formData.get('excessKmRate') as string) || 0,
            extraHourRate: parseFloat(formData.get('extraHourRate') as string) || 0,
            seats: formData.get('seats') ? parseInt(formData.get('seats') as string) : undefined,
            acType: (formData.get('acType') as string) || undefined,
            features: (formData.get('features') as string) || undefined,
            insuranceCoverage: (formData.get('insuranceCoverage') as string) || undefined,
        };

        const validatedData = VehicleSchema.parse(rawData);

        await prisma.vehicle.update({
            where: { id },
            data: validatedData,
        });

        revalidateFor('vehicle');

        return { success: true, data: id };
    } catch (error) {
        console.error('Error updating vehicle:', error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Failed to update vehicle' };
    }
}

/**
 * Delete a vehicle
 */
export async function deleteVehicle(id: string): Promise<ActionResult<void>> {
    try {
        const authCheck = await requireAdmin();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }

        await prisma.vehicle.delete({
            where: { id },
        });

        revalidateFor('vehicle');

        return { success: true };
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        return { success: false, error: 'Failed to delete vehicle' };
    }
}

/**
 * Check vehicle availability for a given date range.
 * Checks against Bills, Confirmed Bookings, and Accepted Quotations.
 */
export async function checkVehicleAvailability(
    vehicleNo: string,
    startDate: Date | string,
    endDate: Date | string,
    currentId?: string, // Optional: exclude current record (Bill/Booking/Quotation) from check
    currentType?: 'Bill' | 'Booking' | 'Quotation'
): Promise<ActionResult<{ available: boolean; conflicts: any[] }>> {
    try {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return { success: false, error: 'Invalid dates provided' };
        }

        // 1. Check Bills (Active/Passive usage)
        const billConflicts = await prisma.bill.findMany({
            where: {
                vehicleNo,
                id: (currentType === 'Bill' && currentId) ? { not: currentId } : undefined,
                OR: [
                    {
                        startDate: { lte: end },
                        endDate: { gte: start }
                    }
                ]
            },
            select: { 
                id: true, 
                billNumber: true, 
                startDate: true, 
                endDate: true, 
                customerName: true 
            }
        });

        // 2. Check Bookings (Future confirmed usage)
        // Handle null endDate by treating as single-day booking
        const bookingConflicts = await prisma.booking.findMany({
            where: {
                vehicleNo,
                status: 'CONFIRMED',
                id: (currentType === 'Booking' && currentId) ? { not: currentId } : undefined,
                OR: [
                    {
                        // Explicit range overlap
                        startDate: { lte: end },
                        endDate: { gte: start, not: null }
                    },
                    {
                        // Single day (null endDate) overlap
                        endDate: null,
                        startDate: { gte: start, lte: end }
                    }
                ]
            },
            select: { 
                id: true, 
                customerName: true, 
                startDate: true, 
                endDate: true, 
                status: true 
            }
        });

        // 3. Check other Accepted Quotations
        const quotationConflicts = await prisma.quotation.findMany({
            where: {
                vehicleNo,
                status: 'ACCEPTED',
                id: (currentType === 'Quotation' && currentId) ? { not: currentId } : undefined,
                OR: [
                    {
                        startDate: { lte: end, not: null },
                        endDate: { gte: start, not: null }
                    }
                ]
            },
            select: {
                id: true,
                quotationNumber: true,
                customerName: true,
                startDate: true,
                endDate: true
            }
        });

        const conflicts = [
            ...billConflicts.map(b => ({ 
                type: 'Bill', 
                id: b.id, 
                reference: `#${b.billNumber}`,
                customer: b.customerName,
                start: b.startDate,
                end: b.endDate
            })),
            ...bookingConflicts.map(b => ({ 
                type: 'Booking', 
                id: b.id, 
                reference: 'Confirmed Booking',
                customer: b.customerName,
                start: b.startDate,
                end: b.endDate || b.startDate
            })),
            ...quotationConflicts.map(q => ({
                type: 'Quotation',
                id: q.id,
                reference: `Quote #${q.quotationNumber}`,
                customer: q.customerName,
                start: q.startDate!,
                end: q.endDate!
            }))
        ];

        return {
            success: true,
            data: {
                available: conflicts.length === 0,
                conflicts
            }
        };
    } catch (error) {
        console.error('Error checking vehicle availability:', error);
        return { success: false, error: 'Failed to check availability' };
    }
}
