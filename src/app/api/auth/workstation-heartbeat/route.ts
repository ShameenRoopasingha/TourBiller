import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdminOrOwnerRole } from '@/lib/crypto-utils';

export async function POST(request: Request) {
    try {
        const session = await auth();
        const sessionUser = session?.user as
            | { id?: string; companyId?: string; role?: string; deviceId?: string }
            | undefined;

        if (!sessionUser?.id || !sessionUser?.companyId) {
            return NextResponse.json({ active: false, reason: 'UNAUTHENTICATED' }, { status: 401 });
        }

        if (!isAdminOrOwnerRole(sessionUser.role)) {
            return NextResponse.json({ active: true });
        }

        const body = (await request.json().catch(() => ({}))) as { deviceId?: string };
        const deviceId = (sessionUser.deviceId || body.deviceId || '').trim();

        if (!deviceId) {
            return NextResponse.json({ active: true });
        }

        const ws = await prisma.activeWorkstation.findUnique({
            where: {
                companyId_deviceId: {
                    companyId: sessionUser.companyId,
                    deviceId,
                },
            },
            select: { id: true, status: true },
        });

        if (!ws || ws.status !== 'ACTIVE') {
            return NextResponse.json(
                { active: false, reason: 'WORKSTATION_REVOKED' },
                { status: 401, headers: { 'Cache-Control': 'no-store' } }
            );
        }

        await prisma.activeWorkstation.update({
            where: { id: ws.id },
            data: { lastSeenAt: new Date() },
        });

        return NextResponse.json({ active: true }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
        console.error('Workstation heartbeat error:', error);
        return NextResponse.json({ active: true });
    }
}
