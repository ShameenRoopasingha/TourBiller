'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-guard';
import { revalidateFor } from '@/lib/revalidation';
import { type ActionResult } from '@/lib/validations';

export type VehicleExpenseCategory = 'REPAIR' | 'BREAKDOWN' | 'FUEL' | 'SERVICE' | 'OIL_CHANGE' | 'FILTER_CHANGE' | 'BODY_WASH' | 'OTHER';

export interface VehicleExpense {
    id: string;
    vehicleNo: string;
    amount: number;
    category: VehicleExpenseCategory;
    description: string | null;
    date: Date;
    bookingId: string | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Add a new vehicle expense
 */
export async function addVehicleExpense(data: {
    vehicleNo: string;
    amount: number;
    category: VehicleExpenseCategory;
    description?: string;
    date?: Date;
    bookingId?: string;
}): Promise<ActionResult<string>> {
    try {
        const authCheck = await requireAdmin();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }

        const expense = await prisma.$transaction(async (tx) => {
            // @ts-ignore
            const created = await tx.vehicleExpense.create({
                data: {
                    vehicleNo: data.vehicleNo,
                    amount: data.amount,
                    category: data.category,
                    description: data.description || null,
                    date: data.date || new Date(),
                    bookingId: data.bookingId || null,
                },
            });

            // Update vehicle last service mileage if applicable
            const mileage = data.date ? undefined : (await tx.vehicle.findUnique({ where: { vehicleNo: data.vehicleNo } }))?.currentMileage;
            
            if (mileage !== undefined) {
                const updateData: any = {};
                if (data.category === 'OIL_CHANGE') updateData.lastOilChangeMileage = mileage;
                if (data.category === 'FILTER_CHANGE') updateData.lastFilterChangeMileage = mileage;
                if (data.category === 'BODY_WASH') updateData.lastWashMileage = mileage;
                if (data.category === 'SERVICE') {
                    // Default to updating both if generic service
                    updateData.lastOilChangeMileage = mileage;
                    updateData.lastFilterChangeMileage = mileage;
                }

                if (Object.keys(updateData).length > 0) {
                    await tx.vehicle.update({
                        where: { vehicleNo: data.vehicleNo },
                        data: updateData,
                    });
                }
            }

            return created;
        });

        revalidateFor('vehicle-expenses');
        return { success: true, data: expense.id };
    } catch (error) {
        console.error('Error adding vehicle expense:', error);
        return { success: false, error: 'Failed to add vehicle expense' };
    }
}

/**
 * Get expenses for a vehicle
 */
export async function getVehicleExpenses(vehicleNo?: string): Promise<ActionResult<VehicleExpense[]>> {
    try {
        const expenses = await prisma.vehicleExpense.findMany({
            where: vehicleNo ? { vehicleNo } : undefined,
            orderBy: { date: 'desc' },
        });

        return { success: true, data: expenses as VehicleExpense[] };
    } catch (error) {
        console.error('Error fetching vehicle expenses:', error);
        return { success: false, error: 'Failed to fetch vehicle expenses' };
    }
}

/**
 * Delete a vehicle expense
 */
export async function deleteVehicleExpense(id: string): Promise<ActionResult<boolean>> {
    try {
        const authCheck = await requireAdmin();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }

        await prisma.vehicleExpense.delete({
            where: { id },
        });

        revalidateFor('vehicle-expenses');
        return { success: true, data: true };
    } catch (error) {
        console.error('Error deleting vehicle expense:', error);
        return { success: false, error: 'Failed to delete vehicle expense' };
    }
}
