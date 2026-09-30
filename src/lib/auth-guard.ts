'use server';

import { auth } from '@/lib/auth';

type AuthGuardResult = {
    authorized: true;
    userId: string;
    role: string;
    companyId: string;
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
    
    // The session JWT already contains the user role, id, and companyId. No need for a DB lookup.
    const user = session?.user as { email?: string; id?: string; role?: string; companyId?: string } | undefined;
    
    if (!user?.email || !user?.id || !user?.companyId) {
        return { authorized: false, error: 'Not authenticated' };
    }

    if (user.role !== 'ADMIN') {
        return { authorized: false, error: 'Unauthorized: Admin access required' };
    }

    return { 
        authorized: true, 
        userId: user.id, 
        role: user.role, 
        companyId: user.companyId 
    };
}

/**
 * Check if the current user is authenticated (any role).
 * Use this in server actions that any logged-in user can access.
 */
export async function requireAuth(): Promise<AuthGuardResult> {
    const session = await auth();
    
    // The session JWT already contains the user role, id, and companyId. No need for a DB lookup.
    const user = session?.user as { email?: string; id?: string; role?: string; companyId?: string } | undefined;
    
    if (!user?.email || !user?.id || !user?.companyId) {
        return { authorized: false, error: 'Not authenticated' };
    }

    return { 
        authorized: true, 
        userId: user.id, 
        role: user.role || 'USER', 
        companyId: user.companyId 
    };
}

