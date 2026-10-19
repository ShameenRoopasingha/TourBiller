import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authCheck = await requireAuth();
        if (!authCheck.authorized) {
            return NextResponse.json({ success: false, error: authCheck.error }, { status: 401 });
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
