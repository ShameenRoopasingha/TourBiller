'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdminOrOwnerRole } from '@/lib/crypto-utils';

type AuthGuardResult = {
    authorized: true;
    userId: string;
    role: string;
    companyId: string;
} | {
    authorized: false;
    error: string;
};

type SessionUserClaims = {
    email?: string;
    id?: string;
    role?: string;
    companyId?: string;
    deviceId?: string;
    tokenVersion?: number;
};

async function resolveVerifiedSessionUser(): Promise<AuthGuardResult> {
    const session = await auth();
    const user = session?.user as SessionUserClaims | undefined;

    if (!user?.email || !user?.id || !user?.companyId) {
        return { authorized: false, error: 'Not authenticated' };
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true, companyId: true, tokenVersion: true },
    });

    if (!dbUser) {
        return { authorized: false, error: 'Not authenticated' };
    }

    if (typeof user.tokenVersion === 'number' && dbUser.tokenVersion !== user.tokenVersion) {
        return { authorized: false, error: 'Session revoked. Please sign in again.' };
    }

    if (isAdminOrOwnerRole(dbUser.role) && user.deviceId) {
        const workstation = await prisma.activeWorkstation.findUnique({
            where: {
                companyId_deviceId: {
                    companyId: dbUser.companyId,
                    deviceId: user.deviceId,
                },
            },
            select: { status: true },
        });

        if (!workstation || workstation.status !== 'ACTIVE') {
            return { authorized: false, error: 'Workstation revoked. Please sign in again.' };
        }
    }

    return {
        authorized: true,
        userId: user.id,
        role: dbUser.role,
        companyId: dbUser.companyId,
    };
}

/**
 * Check if the current user is an authenticated admin or workspace owner.
 * Use this in any server action that requires admin privileges.
 */
export async function requireAdmin(): Promise<AuthGuardResult> {
    const verified = await resolveVerifiedSessionUser();
    if (!verified.authorized) {
        return verified;
    }

    if (!isAdminOrOwnerRole(verified.role)) {
        return { authorized: false, error: 'Unauthorized: Admin access required' };
    }

    return verified;
}

/**
 * Check if the current user is authenticated (any role) with an active, non-revoked session.
 * Use this in server actions that any logged-in user can access.
 */
export async function requireAuth(): Promise<AuthGuardResult> {
    return resolveVerifiedSessionUser();
}

