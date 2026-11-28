import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-guard';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authCheck = await requireAdmin();
        if (!authCheck.authorized) {
            const isUnauthorized =
                authCheck.error === 'Not authenticated' || authCheck.error.includes('revoked');
            return NextResponse.json(
                { success: false, error: authCheck.error },
                { status: isUnauthorized ? 401 : 403 }
            );
        }

        const { id } = await params;
        await prisma.booking.updateMany({
            where: {
                id,
                companyId: authCheck.companyId,
            },
            data: {
                emergencyAcknowledgedAt: new Date(),
                emergencyAcknowledgedById: authCheck.userId,
            }
        });

        return NextResponse.json({ success: true, message: 'Emergency alarm acknowledged' });
    } catch (error) {
        console.error('Error acknowledging emergency alarm:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
