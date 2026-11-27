import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { checkDistributedRateLimit } from '@/lib/rate-limit';
import { registerOrSwitchWorkstation } from '@/lib/workstations';
import { isAdminOrOwnerRole } from '@/lib/crypto-utils';

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
                deviceId: { label: 'Device ID', type: 'text' },
                deviceLabel: { label: 'Device Label', type: 'text' },
                deactivateWorkstationId: { label: 'Deactivate Workstation ID', type: 'text' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const cleanEmail = String(credentials.email).trim().toLowerCase();

                // Rate limit: 10 login attempts per email per 15 minutes
                const { limited } = await checkDistributedRateLimit(
                    `login:${cleanEmail}`,
                    10,
                    15 * 60 * 1000
                );
                if (limited) {
                    throw new Error('Too many login attempts. Please try again later.');
                }

                const user = await prisma.user.findUnique({
                    where: { email: cleanEmail },
                });

                if (!user) return null;

                const passwordMatch = await bcrypt.compare(
                    String(credentials.password),
                    user.password
                );

                if (!passwordMatch) return null;

                const rawDeviceId = credentials.deviceId ? String(credentials.deviceId).trim() : '';
                const rawDeviceLabel = credentials.deviceLabel
                    ? String(credentials.deviceLabel).trim()
                    : 'Workstation Browser';
                const rawDeactivateId = credentials.deactivateWorkstationId
                    ? String(credentials.deactivateWorkstationId).trim()
                    : undefined;

                if (isAdminOrOwnerRole(user.role)) {
                    if (!rawDeviceId || rawDeviceId.length < 8) {
                        return null;
                    }
                    const seatCheck = await registerOrSwitchWorkstation({
                        companyId: user.companyId,
                        userId: user.id,
                        role: user.role,
                        deviceId: rawDeviceId,
                        deviceLabel: rawDeviceLabel,
                        deactivateWorkstationId: rawDeactivateId,
                    });
                    if (!seatCheck.allowed) {
                        return null;
                    }
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    companyId: user.companyId,
                    deviceId: rawDeviceId || undefined,
                };
            },
        }),
    ],
    trustHost: true,
    session: {
        strategy: 'jwt',
        maxAge: 7 * 24 * 60 * 60, // 7 days (reduced from 30 for security)
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                const authUser = user as { role?: string; companyId?: string; deviceId?: string };
                token.role = authUser.role;
                token.id = user.id;
                token.companyId = authUser.companyId;
                token.deviceId = authUser.deviceId;
                token.name = user.name;
                token.email = user.email;
            }
            if (trigger === "update" && session) {
                if (session.name) token.name = session.name;
                if (session.email) token.email = session.email;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                const sessionUser = session.user as {
                    role?: string;
                    id?: string;
                    companyId?: string;
                    deviceId?: string;
                };
                sessionUser.role = token.role as string;
                sessionUser.id = token.id as string;
                sessionUser.companyId = token.companyId as string;
                sessionUser.deviceId = token.deviceId as string | undefined;
                if (token.name) session.user.name = token.name as string;
                if (token.email) session.user.email = token.email as string;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
});
