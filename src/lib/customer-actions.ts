'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CustomerSchema, type ActionResult, type Customer } from '@/lib/validations';
import { revalidateFor } from '@/lib/revalidation';
import { requireAdmin, requireAuth } from '@/lib/auth-guard';

/**
 * Create a new customer
 */
export async function createCustomer(formData: FormData): Promise<ActionResult<string>> {
    try {
        const authCheck = await requireAdmin();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }
        const companyId = authCheck.companyId;

        const rawData = {
            name: formData.get('name') as string,
            mobile: formData.get('mobile') as string,
            email: (formData.get('email') as string) || undefined,
            address: (formData.get('address') as string) || undefined,
        };

        const validatedData = CustomerSchema.parse(rawData);

        const customer = await prisma.customer.create({
            data: { companyId, ...validatedData },
        });

        revalidateFor('customer');

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
        const authCheck = await requireAuth();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }
        const companyId = authCheck.companyId;
    const customers = await prisma.customer.findMany({
            where: searchQuery ? {
            companyId,
                OR: [
                    { name: { contains: searchQuery, mode: 'insensitive' } },
                    { mobile: { contains: searchQuery, mode: 'insensitive' } },
                    { email: { contains: searchQuery, mode: 'insensitive' } },
                ],
            } : { companyId },
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
        const authCheck = await requireAdmin();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }
        const companyId = authCheck.companyId;

        const rawData = {
            name: formData.get('name') as string,
            mobile: formData.get('mobile') as string,
            email: (formData.get('email') as string) || undefined,
            address: (formData.get('address') as string) || undefined,
        };

        const validatedData = CustomerSchema.parse(rawData);

        const _res = await prisma.customer.updateMany({
            where: { id, companyId },
            data: { ...validatedData },
        });
        if (_res.count === 0) return { success: false, error: 'Record not found or unauthorized' };

        revalidateFor('customer');

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
        const authCheck = await requireAdmin();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }
        const companyId = authCheck.companyId;

        // Look up the customer name first for FK checks
        const customer = await prisma.customer.findFirst({ where: { id, companyId }, select: { name: true } });
        if (!customer) {
            return { success: false, error: 'Customer not found' };
        }

        // Check for related records that reference this customer by name
        const [billCount, bookingCount, quotationCount] = await Promise.all([
            prisma.bill.count({ where: { customerName: customer.name, companyId } }),
            prisma.booking.count({ where: { customerName: customer.name, companyId } }),
            prisma.quotation.count({ where: { customerName: customer.name, companyId } }),
        ]);

        const relatedItems: string[] = [];
        if (billCount > 0) relatedItems.push(`${billCount} bill(s)`);
        if (bookingCount > 0) relatedItems.push(`${bookingCount} booking(s)`);
        if (quotationCount > 0) relatedItems.push(`${quotationCount} quotation(s)`);

        if (relatedItems.length > 0) {
            return {
                success: false,
                error: `Cannot delete customer "${customer.name}": they have ${relatedItems.join(', ')} linked. Remove or reassign those records first.`,
            };
        }

        const _res = await prisma.customer.deleteMany({
            where: { id, companyId },
        });
        if (_res.count === 0) return { success: false, error: 'Record not found or unauthorized' };

        revalidateFor('customer');

        return { success: true };
    } catch (error) {
        console.error('Error deleting customer:', error);
        return { success: false, error: 'Failed to delete customer' };
    }
}
