'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type AuthGuardResult = {
    authorized: true;
    userId: string;
    role: string;
} | {
    authorized: false;
    error: string;
};

/**
 * Check if the current user is an authenticated admin.
 * Use this in any server action that requires admin privileges.
 */
export async function requireAdmin(): Promise<AuthGuardResult> {
    const session = await auth();
    if (!session?.user?.email) {
        return { authorized: false, error: 'Not authenticated' };
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true },
    });

    if (!user) {
        return { authorized: false, error: 'User not found' };
    }

    if (user.role !== 'ADMIN') {
        return { authorized: false, error: 'Unauthorized: Admin access required' };
    }

    return { authorized: true, userId: user.id, role: user.role };
}

/**
 * Check if the current user is authenticated (any role).
 * Use this in server actions that any logged-in user can access.
 */
export async function requireAuth(): Promise<AuthGuardResult> {
    const session = await auth();
    if (!session?.user?.email) {
        return { authorized: false, error: 'Not authenticated' };
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true },
    });

    if (!user) {
        return { authorized: false, error: 'User not found' };
    }

    return { authorized: true, userId: user.id, role: user.role };
}
