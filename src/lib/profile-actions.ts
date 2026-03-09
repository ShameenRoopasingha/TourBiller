'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { type ActionResult } from '@/lib/validations';

/**
 * Update the logged-in user's profile information (name/email)
 */
export async function updateProfile(formData: FormData): Promise<ActionResult<void>> {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const name = formData.get('name') as string;
        const email = formData.get('email') as string;

        if (!name || !email) {
            return { success: false, error: 'Name and email are required' };
        }

        // Check if email is being changed to one that already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser && existingUser.id !== session.user.id) {
            return { success: false, error: 'Email is already in use by another account' };
        }

        await prisma.user.update({
            where: { id: session.user.id },
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
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const currentPassword = formData.get('currentPassword') as string;
        const newPassword = formData.get('newPassword') as string;

        if (!currentPassword || !newPassword) {
            return { success: false, error: 'Both current and new passwords are required' };
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return { success: false, error: 'Incorrect current password' };
        }

        if (newPassword.length < 6) {
            return { success: false, error: 'New password must be at least 6 characters' };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword },
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating password:', error);
        return { success: false, error: 'Failed to update password' };
    }
}
