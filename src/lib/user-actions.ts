'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { type ActionResult } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

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
        const users = await prisma.user.findMany({
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
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return { success: false, error: 'A user with this email already exists' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
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
        await prisma.user.delete({ where: { id } });
        revalidatePath('/users');
        return { success: true };
    } catch (error) {
        console.error('Error deleting user:', error);
        return { success: false, error: 'Failed to delete user' };
    }
}
