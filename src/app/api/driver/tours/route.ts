import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key-vigil';

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        let decoded: any;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (e) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
        }

        if (decoded.role !== 'DRIVER') {
            return NextResponse.json({ success: false, error: 'Not a driver' }, { status: 403 });
        }

        const driverId = decoded.id;
        
        // Find assigned tours for this driver
        const tours = await prisma.booking.findMany({
            where: {
                driverId: driverId,
                status: {
                    in: ['CONFIRMED', 'PENDING'] // Ongoing or upcoming
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
