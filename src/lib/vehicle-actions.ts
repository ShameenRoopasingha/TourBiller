'use server';

import { prisma } from '@/lib/prisma';
import { VehicleSchema, type ActionResult, type Vehicle } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

/**
 * Create a new vehicle
 */
export async function createVehicle(formData: FormData): Promise<ActionResult<string>> {
    try {
        const rawData = {
            vehicleNo: formData.get('vehicleNo') as string,
            model: formData.get('model') as string,
            category: formData.get('category') as string,
            status: formData.get('status') as string,
            defaultRate: parseFloat(formData.get('defaultRate') as string) || 0,
            excessKmRate: parseFloat(formData.get('excessKmRate') as string) || 0,
        };

        const validatedData = VehicleSchema.parse(rawData);

        const vehicle = await prisma.vehicle.create({
            data: validatedData,
        });

        revalidatePath('/vehicles');
        revalidatePath('/quotations/new');
        revalidatePath('/bills/new');
        revalidatePath('/bookings/new');
        revalidatePath('/'); // Dashboard

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
        const rawData = {
            vehicleNo: formData.get('vehicleNo') as string,
            model: formData.get('model') as string,
            category: formData.get('category') as string,
            status: formData.get('status') as string,
            defaultRate: parseFloat(formData.get('defaultRate') as string) || 0,
            excessKmRate: parseFloat(formData.get('excessKmRate') as string) || 0,
        };

        const validatedData = VehicleSchema.parse(rawData);

        await prisma.vehicle.update({
            where: { id },
            data: validatedData,
        });

        revalidatePath('/vehicles');
        revalidatePath('/quotations/new');
        revalidatePath('/bills/new');
        revalidatePath('/bookings/new');
        revalidatePath('/'); // Dashboard

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
        await prisma.vehicle.delete({
            where: { id },
        });

        revalidatePath('/vehicles');
        revalidatePath('/quotations/new');
        revalidatePath('/bills/new');
        revalidatePath('/bookings/new');
        revalidatePath('/'); // Dashboard

        return { success: true };
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        return { success: false, error: 'Failed to delete vehicle' };
    }
}
