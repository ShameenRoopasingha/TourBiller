import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

import { auth } from '@/lib/auth';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key-vigil';

export async function GET(req: Request) {
    try {
        let driverId: string | null = null;

        // 1. Bearer Token check (Mobile App)
        const authHeader = req.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, JWT_SECRET) as any;
                if (decoded?.role === 'DRIVER' && decoded?.id) {
                    driverId = decoded.id;
                }
            } catch {
                // Ignore token error and try session
            }
        }

        // 2. NextAuth Session check (Web Portal)
        if (!driverId) {
            try {
                const session = await auth();
                const user = session?.user as { id?: string; role?: string } | undefined;
                if (user?.id && user?.role === 'DRIVER') {
                    driverId = user.id;
                }
            } catch {
                // Session error
            }
        }

        if (!driverId) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Driver access required' }, { status: 401 });
        }
        
        // Find assigned tours for this driver
        const tours = await prisma.booking.findMany({
            where: {
                driverId: driverId,
                status: {
                    in: ['CONFIRMED', 'PENDING', 'ONGOING'] // Ongoing or upcoming
                }
            },
            orderBy: {
                startDate: 'asc'
            }
        });

        return NextResponse.json({
            success: true,
            data: tours
        });
    } catch (error) {
        console.error('Driver tours error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
