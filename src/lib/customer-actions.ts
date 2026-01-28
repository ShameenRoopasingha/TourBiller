'use server';

import { prisma } from '@/lib/prisma';
import { CustomerSchema, type ActionResult, type Customer } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

/**
 * Create a new customer
 */
export async function createCustomer(formData: FormData): Promise<ActionResult<string>> {
    try {
        const rawData = {
            name: formData.get('name') as string,
            mobile: formData.get('mobile') as string,
            email: formData.get('email') as string,
            address: formData.get('address') as string,
        };

        const validatedData = CustomerSchema.parse(rawData);

        const customer = await prisma.customer.create({
            data: validatedData,
        });

        revalidatePath('/customers');

        return {
            success: true,
            data: customer.id,
        };
    } catch (error) {
        console.error('Error creating customer:', error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Failed to create customer' };
    }
}

/**
 * Get all customers
 */
export async function getCustomers(searchQuery?: string): Promise<ActionResult<Customer[]>> {
    try {
        const customers = await prisma.customer.findMany({
            where: searchQuery ? {
                OR: [
                    { name: { contains: searchQuery, mode: 'insensitive' } },
                    { mobile: { contains: searchQuery, mode: 'insensitive' } },
                    { email: { contains: searchQuery, mode: 'insensitive' } },
                ],
            } : undefined,
            orderBy: { updatedAt: 'desc' },
        });

        return { success: true, data: customers as Customer[] };
    } catch (error) {
        console.error('Error fetching customers:', error);
        return { success: false, error: 'Failed to fetch customers' };
    }
}

/**
 * Update a customer
 */
export async function updateCustomer(id: string, formData: FormData): Promise<ActionResult<string>> {
    try {
        const rawData = {
            name: formData.get('name') as string,
            mobile: formData.get('mobile') as string,
            email: formData.get('email') as string,
            address: formData.get('address') as string,
        };

        const validatedData = CustomerSchema.parse(rawData);

        await prisma.customer.update({
            where: { id },
            data: validatedData,
        });

        revalidatePath('/customers');

        return { success: true, data: id };
    } catch (error) {
        console.error('Error updating customer:', error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Failed to update customer' };
    }
}

/**
 * Delete a customer
 */
export async function deleteCustomer(id: string): Promise<ActionResult<void>> {
    try {
        await prisma.customer.delete({
            where: { id },
        });

        revalidatePath('/customers');

        return { success: true };
    } catch (error) {
        console.error('Error deleting customer:', error);
        return { success: false, error: 'Failed to delete customer' };
    }
}
