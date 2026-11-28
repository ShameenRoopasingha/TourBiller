'use server';

import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { type ActionResult, ProfileUpdateSchema, PasswordChangeSchema } from '@/lib/validations';

/**
 * Update the logged-in user's profile information (name/email)
 */
export async function updateProfile(formData: FormData): Promise<ActionResult<void>> {
    try {
        const authCheck = await requireAuth();
        if (!authCheck.authorized) {
            return { success: false, error: 'Unauthorized' };
        }

        const raw = {
            name: formData.get('name'),
            email: formData.get('email'),
        };

        const parsed = ProfileUpdateSchema.safeParse(raw);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0]?.message || 'Invalid profile data' };
        }

        const { name, email } = parsed.data;

        // Check if email is being changed to one that already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser && existingUser.id !== authCheck.userId) {
            return { success: false, error: 'Email is already in use by another account' };
        }

        await prisma.user.update({
            where: { id: authCheck.userId },
            data: { name, email },
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating profile:', error);
        return { success: false, error: 'Failed to update profile' };
    }
}

/**
 * Update the logged-in user's password
 */
export async function updatePassword(formData: FormData): Promise<ActionResult<void>> {
    try {
        const authCheck = await requireAuth();
        if (!authCheck.authorized) {
            return { success: false, error: 'Unauthorized' };
        }

        const raw = {
            currentPassword: formData.get('currentPassword'),
            newPassword: formData.get('newPassword'),
        };

        const parsed = PasswordChangeSchema.safeParse(raw);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0]?.message || 'Invalid password data' };
        }

        const { currentPassword, newPassword } = parsed.data;

        const user = await prisma.user.findUnique({
            where: { id: authCheck.userId }
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return { success: false, error: 'Incorrect current password' };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: authCheck.userId },
            data: {
                password: hashedPassword,
                tokenVersion: { increment: 1 },
            },
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating password:', error);
        return { success: false, error: 'Failed to update password' };
    }
}
