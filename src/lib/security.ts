import jwt from 'jsonwebtoken';
import { auth } from '@/lib/auth';
import { getJwtSecret } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export {
    timingSafeEqualStrings,
    hashOpaqueToken,
    verifyBitgardSyncSignature,
    verifyCronSecret,
    isAdminOrOwnerRole,
    escapeCsvCell,
    getClientIp,
    hashIpAddress,
    isAllowedSourceIp,
} from '@/lib/crypto-utils';

export type ApiCallerResult =
    | {
          authenticated: true;
          userId: string;
          companyId: string;
          role: string;
      }
    | {
          authenticated: false;
          status: 401 | 403;
          error: string;
      };

/**
 * Authenticates an API caller via either a Bearer HS256 JWT (Mobile App)
 * or a NextAuth session cookie (Web Portal).
 */
export async function authenticateBearerOrSession(
    req: Request,
    allowedRoles?: string[]
): Promise<ApiCallerResult> {
    let resolved: { userId: string; companyId: string; role: string } | null = null;

    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice('Bearer '.length).trim();
        if (token) {
            try {
                const decoded = jwt.verify(token, getJwtSecret()) as {
                    id?: string;
                    companyId?: string;
                    role?: string;
                    tokenVersion?: number;
                };
                if (decoded?.id && decoded?.companyId && decoded?.role) {
                    if (typeof decoded.tokenVersion === 'number') {
                        const dbUser = await prisma.user.findUnique({
                            where: { id: decoded.id },
                            select: { tokenVersion: true, companyId: true, role: true },
                        });
                        if (
                            !dbUser ||
                            dbUser.tokenVersion !== decoded.tokenVersion ||
                            dbUser.companyId !== decoded.companyId
                        ) {
                            return { authenticated: false, status: 401, error: 'Token revoked or expired' };
                        }
                    }
                    resolved = {
                        userId: decoded.id,
                        companyId: decoded.companyId,
                        role: decoded.role,
                    };
                }
            } catch {
                // Fall back to NextAuth session if cookie is also present
            }
        }
    }

    if (!resolved) {
        try {
            const session = await auth();
            const user = session?.user as
                | { id?: string; companyId?: string; role?: string }
                | undefined;
            if (user?.id && user?.companyId && user?.role) {
                resolved = {
                    userId: user.id,
                    companyId: user.companyId,
                    role: user.role,
                };
            }
        } catch {
            // Session resolution failed
        }
    }

    if (!resolved) {
        return { authenticated: false, status: 401, error: 'Unauthorized' };
    }

    if (allowedRoles && !allowedRoles.includes(resolved.role)) {
        return {
            authenticated: false,
            status: 403,
            error: 'Forbidden: Insufficient permissions',
        };
    }

    return {
        authenticated: true,
        ...resolved,
    };
}
