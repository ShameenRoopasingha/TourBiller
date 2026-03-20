'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-guard';
import { revalidateFor } from '@/lib/revalidation';
import { type ActionResult, VehicleExpenseSchema, type VehicleExpense, type VehicleExpenseFormData, type VehicleExpenseCategory, type Vehicle } from '@/lib/validations';

export type { VehicleExpense, VehicleExpenseCategory };

/**
 * Add a new vehicle expense
 */
export async function addVehicleExpense(data: VehicleExpenseFormData): Promise<ActionResult<string>> {
    const validated = VehicleExpenseSchema.safeParse(data);
    if (!validated.success) {
        return { success: false, error: validated.error.issues[0].message };
    }
    const validatedData = validated.data;

    try {
        const authCheck = await requireAdmin();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }

        const expense = await prisma.$transaction(async (tx) => {
            // @ts-expect-error - Prisma type sync
            const created = await tx.vehicleExpense.create({
                data: {
                    vehicleNo: validatedData.vehicleNo,
                    amount: validatedData.amount,
                    category: validatedData.category,
                    description: validatedData.description || null,
                    date: validatedData.date || new Date(),
                    bookingId: validatedData.bookingId || null,
                },
            });

            // Update vehicle last service mileage if applicable
            // @ts-expect-error - Prisma currentMileage type
            const mileage = validatedData.date ? undefined : (await tx.vehicle.findUnique({ where: { vehicleNo: validatedData.vehicleNo } }))?.currentMileage;
            
            if (mileage !== undefined) {
                const updateData: Partial<Vehicle> = {};
                if (validatedData.category === 'OIL_CHANGE') updateData.lastOilChangeMileage = mileage;
                if (validatedData.category === 'FILTER_CHANGE') updateData.lastFilterChangeMileage = mileage;
                if (validatedData.category === 'BODY_WASH') updateData.lastWashMileage = mileage;
                if (validatedData.category === 'SERVICE') {
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
        // @ts-expect-error - Prisma vehicleExpense type
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

        // @ts-expect-error - Prisma vehicleExpense type
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
