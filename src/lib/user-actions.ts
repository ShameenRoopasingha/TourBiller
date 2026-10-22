'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/auth-guard';
import bcrypt from 'bcrypt';
import { type ActionResult, type DriverAvailabilityConflict, UserCreateSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import { formatActionError } from '@/lib/error-handler';
import crypto from 'crypto';
import { verifyEmailAddress } from '@/lib/email-verifier';
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/open-source-mailer';

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
                status: { in: ['CONFIRMED', 'ONGOING'] },
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
        return formatActionError(error, 'Failed to check driver availability');
    }
}

export type UserData = {
    id: string;
    name: string;
    email: string;
    role: string;
    emailVerified: Date | null;
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
                emailVerified: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return { success: true, data: users };
    } catch (error) {
        return formatActionError(error, 'Failed to fetch users');
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

        const rawData = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
            role: formData.get('role') || 'DRIVER',
        };

        const parsed = UserCreateSchema.safeParse(rawData);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0]?.message || 'Invalid user data' };
        }

        const { name, email, password, role } = parsed.data;

        // Check if email already exists
        const existing = await prisma.user.findFirst({ where: { email, companyId } });
        if (existing) {
            return { success: false, error: 'A user with this email already exists' };
        }

        // 1. Level 1 & Level 2 Pre-verification: RFC 5322 Syntax + Disposable blocklist + DNS MX lookup
        const emailCheck = await verifyEmailAddress(email);
        if (!emailCheck.valid) {
            return { success: false, error: emailCheck.error || 'Invalid email address' };
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

        // 2. Level 3 OTP & Token Generation for Open-Source Verification
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.emailVerificationToken.deleteMany({
            where: { email },
        });

        await prisma.emailVerificationToken.create({
            data: {
                email,
                token,
                otpCode,
                expires,
            },
        });

        // 3. Dispatch verification email via Nodemailer (or Dev console fallback)
        await sendVerificationEmail({
            to: email,
            name,
            otpCode,
            token,
        });

        revalidatePath('/users');
        return { success: true, data: user.id };
    } catch (error) {
        return formatActionError(error, 'Failed to create user');
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
        const bookingCount = await prisma.booking.count({ where: { driverId: id, companyId } });
        const quotationCount = await prisma.quotation.count({ where: { driverId: id, companyId } });
        const expenseCount = await prisma.vehicleExpense.count({ where: { driverId: id, companyId } });
        const activityCount = await prisma.tripActivity.count({ where: { driverId: id, companyId } });

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
        return formatActionError(error, 'Failed to delete user');
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
        return formatActionError(error, 'Failed to fetch drivers');
    }
}


export async function logoutUser() {
  const { signOut } = await import('@/lib/auth');
  await signOut({ redirectTo: '/login' });
}

/**
 * Verify user email via 6-digit OTP code or direct token link
 */
export async function verifyUserEmail(email: string, tokenOrOtp: string): Promise<ActionResult<void>> {
    try {
        if (!email || !tokenOrOtp) {
            return { success: false, error: 'Email and verification code/token are required.' };
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanCode = tokenOrOtp.trim();

        const record = await prisma.emailVerificationToken.findFirst({
            where: {
                email: cleanEmail,
                OR: [
                    { otpCode: cleanCode },
                    { token: cleanCode },
                ],
            },
        });

        if (!record) {
            return { success: false, error: 'Invalid verification code or link. Please check and try again.' };
        }

        if (record.expires < new Date()) {
            return { success: false, error: 'Verification code has expired. Please request a new one.' };
        }

        // Mark user email as verified
        await prisma.user.updateMany({
            where: { email: cleanEmail },
            data: { emailVerified: new Date() },
        });

        // Delete used token
        await prisma.emailVerificationToken.deleteMany({
            where: { email: cleanEmail },
        });

        revalidatePath('/users');
        return { success: true };
    } catch (error) {
        return formatActionError(error, 'Failed to verify email');
    }
}

/**
 * Resend verification OTP email for a pending user
 */
export async function resendVerificationEmail(userId: string): Promise<ActionResult<void>> {
    try {
        const authCheck = await requireAdmin();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }
        const { companyId } = authCheck;

        const user = await prisma.user.findFirst({
            where: { id: userId, companyId },
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        if (user.emailVerified) {
            return { success: false, error: 'User email is already verified.' };
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.emailVerificationToken.deleteMany({
            where: { email: user.email },
        });

        await prisma.emailVerificationToken.create({
            data: {
                email: user.email,
                token,
                otpCode,
                expires,
            },
        });

        await sendVerificationEmail({
            to: user.email,
            name: user.name,
            otpCode,
            token,
        });

        return { success: true };
    } catch (error) {
        return formatActionError(error, 'Failed to resend verification email');
    }
}

/**
 * Admin action: Generate a direct password reset link for any team member
 */
export async function adminGenerateResetLink(userId: string): Promise<ActionResult<{ resetLink: string; email: string }>> {
    try {
        const authCheck = await requireAdmin();
        if (!authCheck.authorized) {
            return { success: false, error: authCheck.error };
        }
        const { companyId } = authCheck;

        const user = await prisma.user.findFirst({
            where: { id: userId, companyId },
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour

        await prisma.passwordResetToken.deleteMany({
            where: { email: user.email },
        });

        await prisma.passwordResetToken.create({
            data: {
                email: user.email,
                token,
                expires,
            },
        });

        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

        // Also try to send email if SMTP is configured
        await sendPasswordResetEmail({
            to: user.email,
            name: user.name,
            resetLink,
        });

        return {
            success: true,
            data: {
                resetLink,
                email: user.email,
            },
        };
    } catch (error) {
        return formatActionError(error, 'Failed to generate reset link');
    }
}
