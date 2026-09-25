'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/auth-guard';
import bcrypt from 'bcrypt';
import { type ActionResult, type DriverAvailabilityConflict } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

/**
 * Check driver availability for a given date range.
 * Checks against Confirmed Bookings and Accepted Quotations.
 */
export async function checkDriverAvailability(
    driverId: string,
    startDate: Date | string,
    endDate: Date | string,
    currentId?: string, // Optional: exclude current record (Booking/Quotation) from check
    currentType?: 'Booking' | 'Quotation'
): Promise<ActionResult<{ available: boolean; conflicts: DriverAvailabilityConflict[] }>> {
    try {
        const authCheck = await requireAuth();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }
        const { companyId } = authCheck;

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return { success: false, error: 'Invalid dates provided' };
        }

        // 1. Check Bookings (Future confirmed usage)
        const bookingConflicts = await prisma.booking.findMany({
            where: {
                driverId,
                companyId,
                status: 'CONFIRMED',
                id: (currentType === 'Booking' && currentId) ? { not: currentId } : undefined,
                OR: [
                    {
                        startDate: { lte: end },
                        endDate: { gte: start, not: null }
                    },
                    {
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

        // 2. Check Accepted Quotations
        const quotationConflicts = await prisma.quotation.findMany({
            where: {
                driverId,
                companyId,
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

        const conflicts: DriverAvailabilityConflict[] = [
            ...bookingConflicts.map(b => ({ 
                type: 'Booking' as const, 
                id: b.id, 
                reference: 'Confirmed Booking',
                customer: b.customerName,
                start: b.startDate,
                end: b.endDate || b.startDate
            })),
            ...quotationConflicts.map(q => ({
                type: 'Quotation' as const,
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
        console.error('Error checking driver availability:', error);
        return { success: false, error: 'Failed to check driver availability' };
    }
}

type UserData = {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
};

/**
 * Get all users (no passwords exposed)
 */
export async function getUsers(): Promise<ActionResult<UserData[]>> {
    try {
        const authCheck = await requireAuth();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }
        const { companyId } = authCheck;

        const users = await prisma.user.findMany({
            where: { companyId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return { success: true, data: users };
    } catch (error) {
        console.error('Error fetching users:', error);
        return { success: false, error: 'Failed to fetch users' };
    }
}

/**
 * Create a new user
 */
export async function createUser(formData: FormData): Promise<ActionResult<string>> {
    try {
        // Authorization: Only admins can create users
        const authCheck = await requireAdmin();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }
        const { companyId } = authCheck;

        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const role = formData.get('role') as string || 'DRIVER';

        if (!name || !email || !password) {
            return { success: false, error: 'Name, email, and password are required' };
        }

        if (password.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters' };
        }

        // Check if email already exists
        const existing = await prisma.user.findFirst({ where: { email, companyId } });
        if (existing) {
            return { success: false, error: 'A user with this email already exists' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                companyId,
                name,
                email,
                password: hashedPassword,
                role,
            },
        });

        revalidatePath('/users');
        return { success: true, data: user.id };
    } catch (error) {
        console.error('Error creating user:', error);
        return { success: false, error: 'Failed to create user' };
    }
}

/**
 * Delete a user
 */
export async function deleteUser(id: string): Promise<ActionResult<void>> {
    try {
        const authCheck = await requireAdmin();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }
        const { companyId, userId } = authCheck;

        // Prevent self-deletion
        if (userId === id) {
            return { success: false, error: 'You cannot delete your own account.' };
        }

        // Check for related records that would prevent deletion
        const [bookingCount, quotationCount, expenseCount, activityCount] = await Promise.all([
            prisma.booking.count({ where: { driverId: id, companyId } }),
            prisma.quotation.count({ where: { driverId: id, companyId } }),
            prisma.vehicleExpense.count({ where: { driverId: id, companyId } }),
            prisma.tripActivity.count({ where: { driverId: id, companyId } }),
        ]);

        const relatedItems: string[] = [];
        if (bookingCount > 0) relatedItems.push(`${bookingCount} booking(s)`);
        if (quotationCount > 0) relatedItems.push(`${quotationCount} quotation(s)`);
        if (expenseCount > 0) relatedItems.push(`${expenseCount} expense(s)`);
        if (activityCount > 0) relatedItems.push(`${activityCount} trip activity(ies)`);

        if (relatedItems.length > 0) {
            return { 
                success: false, 
                error: `Cannot delete user: they have ${relatedItems.join(', ')} linked. Remove or reassign these records first.` 
            };
        }

        const _res = await prisma.user.deleteMany({ where: { id, companyId } });
        if (_res.count === 0) return { success: false, error: 'Record not found or unauthorized' };
        revalidatePath('/users');
        return { success: true };
    } catch (error) {
        console.error('Error deleting user:', error);
        if (error instanceof Error && error.message.includes('Foreign key constraint')) {
            return { success: false, error: 'Cannot delete user: they have related records (bookings, quotations, or expenses). Remove those first.' };
        }
        return { success: false, error: 'Failed to delete user' };
    }
}

export type DriverOption = { id: string; name: string; email: string };

/**
 * Get all drivers (users with DRIVER role)
 */
export async function getDrivers(): Promise<ActionResult<DriverOption[]>> {
    try {
        const authCheck = await requireAuth();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }
        const { companyId } = authCheck;

        const drivers = await prisma.user.findMany({
            where: { role: 'DRIVER', companyId },
            select: { id: true, name: true, email: true },
            orderBy: { name: 'asc' },
        });
        return { success: true, data: drivers };
    } catch (error) {
        console.error('Error fetching drivers:', error);
        return { success: false, error: 'Failed to fetch drivers' };
    }
}
