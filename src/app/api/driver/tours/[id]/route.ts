import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key-vigil';

// Middleware-like function to verify driver
async function verifyDriver(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { error: 'Unauthorized', status: 401 };
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        return { driver: decoded };
    } catch (e) {
        return { error: 'Invalid token', status: 401 };
    }
}

// GET: Fetch single tour details with activities
export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const auth = await verifyDriver(req);
        if (auth.error) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

        const bookingId = params.id;
        const driverId = auth.driver.id;

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                tripActivities: {
                    orderBy: { timestamp: 'desc' }
                }
            }
        });

        if (!booking || booking.driverId !== driverId) {
            return NextResponse.json({ success: false, error: 'Tour not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: booking });

    } catch (error) {
        console.error('Fetch tour error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// PUT: Update tour status or add activity
export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const auth = await verifyDriver(req);
        if (auth.error) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

        const bookingId = params.id;
        const { companyId, id: driverId } = auth.driver;
        
        const body = await req.json();
        const { action, note, meterReading } = body;

        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking || booking.driverId !== driverId) {
            return NextResponse.json({ success: false, error: 'Tour not found or unauthorized' }, { status: 404 });
        }

        if (action === 'START_TRIP') {
            await prisma.$transaction([
                prisma.booking.update({
                    where: { id: bookingId },
                    data: { status: 'ONGOING' }
                }),
                prisma.tripActivity.create({
                    data: {
                        companyId,
                        bookingId,
                        driverId,
                        type: 'START',
                        note: meterReading ? `Trip Started. Start Meter: ${meterReading}` : 'Trip Started'
                    }
                })
            ]);
            return NextResponse.json({ success: true });
        }

        if (action === 'END_TRIP') {
            await prisma.$transaction([
                prisma.booking.update({
                    where: { id: bookingId },
                    data: { status: 'COMPLETED' }
                }),
                prisma.tripActivity.create({
                    data: {
                        companyId,
                        bookingId,
                        driverId,
                        type: 'END',
                        note: meterReading ? `Trip Ended. End Meter: ${meterReading}` : 'Trip Ended'
                    }
                })
            ]);
            return NextResponse.json({ success: true });
        }

        if (action === 'ADD_ACTIVITY') {
            const activity = await prisma.tripActivity.create({
                data: {
                    companyId,
                    bookingId,
                    driverId,
                    type: 'NOTE',
                    note: note || 'Activity recorded'
                }
            });
            return NextResponse.json({ success: true, data: activity });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Update tour error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
