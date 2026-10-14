import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { auth } from '@/lib/auth';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key-vigil';

async function authenticateDriverOrUser(req: Request) {
    // 1. Try Bearer token (Mobile App)
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            if (decoded?.id && decoded?.companyId) {
                return {
                    driverId: decoded.id as string,
                    companyId: decoded.companyId as string,
                    role: decoded.role as string,
                };
            }
        } catch {
            // Ignore error and try session next
        }
    }

    // 2. Try NextAuth session (Web Driver Portal or Admin)
    try {
        const session = await auth();
        const user = session?.user as { id?: string; companyId?: string; role?: string } | undefined;
        if (user?.id && user?.companyId) {
            return {
                driverId: user.id,
                companyId: user.companyId,
                role: user.role || 'DRIVER',
            };
        }
    } catch {
        // Session resolution failed
    }

    return null;
}

// POST: Save driver GPS ping (Single or Batch for Offline Sync)
export async function POST(req: Request) {
    try {
        const authUser = await authenticateDriverOrUser(req);
        if (!authUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const driverId = authUser.driverId;
        const companyId = authUser.companyId;

        // Check if this is an offline batch sync
        if (Array.isArray(body.batch) && body.batch.length > 0) {
            const batchPoints = body.batch as Array<{
                lat: number;
                lon: number;
                heading?: number;
                speed?: number;
                accuracy?: number;
                battery?: number;
                timestamp?: string | number;
            }>;

            let activeBookingId = body.bookingId;
            if (!activeBookingId) {
                const currentBooking = await prisma.booking.findFirst({
                    where: { driverId, status: 'ONGOING' },
                    select: { id: true }
                });
                activeBookingId = currentBooking?.id || null;
            }

            const validRecords = batchPoints
                .filter(p => typeof p.lat === 'number' && typeof p.lon === 'number')
                .map(p => ({
                    companyId,
                    driverId,
                    bookingId: activeBookingId,
                    lat: p.lat,
                    lon: p.lon,
                    heading: typeof p.heading === 'number' ? p.heading : null,
                    speed: typeof p.speed === 'number' ? p.speed : null,
                    accuracy: typeof p.accuracy === 'number' ? p.accuracy : null,
                    battery: typeof p.battery === 'number' ? p.battery : null,
                    timestamp: p.timestamp ? new Date(p.timestamp) : new Date(),
                }));

            if (validRecords.length > 0) {
                await prisma.driverLocation.createMany({
                    data: validRecords
                });

                // Update latest position from last point
                const latest = validRecords[validRecords.length - 1];
                await prisma.user.update({
                    where: { id: driverId },
                    data: {
                        lastLat: latest.lat,
                        lastLon: latest.lon,
                        lastLocationAt: latest.timestamp,
                        isLiveTracking: true,
                    }
                });

                if (activeBookingId) {
                    await prisma.booking.update({
                        where: { id: activeBookingId },
                        data: {
                            lastLat: latest.lat,
                            lastLon: latest.lon,
                            lastHeading: latest.heading,
                            lastSpeed: latest.speed,
                            lastLocationAt: latest.timestamp,
                        }
                    });
                }
            }

            return NextResponse.json({
                success: true,
                syncedCount: validRecords.length,
                bookingId: activeBookingId,
            });
        }

        // Single GPS Ping
        const { bookingId, lat, lon, heading, speed, accuracy, battery } = body;

        if (typeof lat !== 'number' || typeof lon !== 'number') {
            return NextResponse.json({ success: false, error: 'Valid latitude and longitude are required' }, { status: 400 });
        }

        // Find active booking if not explicitly provided
        let activeBookingId = bookingId;
        if (!activeBookingId) {
            const currentBooking = await prisma.booking.findFirst({
                where: {
                    driverId: driverId,
                    status: 'ONGOING'
                },
                select: { id: true }
            });
            activeBookingId = currentBooking?.id || null;
        }

        const now = new Date();

        // 1. Insert breadcrumb point
        const locationRecord = await prisma.driverLocation.create({
            data: {
                companyId,
                driverId,
                bookingId: activeBookingId,
                lat,
                lon,
                heading: typeof heading === 'number' ? heading : null,
                speed: typeof speed === 'number' ? speed : null,
                accuracy: typeof accuracy === 'number' ? accuracy : null,
                battery: typeof battery === 'number' ? battery : null,
                timestamp: now,
            }
        });

        // 2. Update driver's last known position on User record
        await prisma.user.update({
            where: { id: driverId },
            data: {
                lastLat: lat,
                lastLon: lon,
                lastLocationAt: now,
                isLiveTracking: true,
            }
        });

        // 3. If an active booking exists, update its last known coordinates for fast queries
        if (activeBookingId) {
            await prisma.booking.update({
                where: { id: activeBookingId },
                data: {
                    lastLat: lat,
                    lastLon: lon,
                    lastHeading: typeof heading === 'number' ? heading : null,
                    lastSpeed: typeof speed === 'number' ? speed : null,
                    lastLocationAt: now,
                }
            });
        }

        return NextResponse.json({
            success: true,
            id: locationRecord.id,
            timestamp: now.toISOString(),
            bookingId: activeBookingId,
        });

    } catch (error) {
        console.error('Driver location update error:', error);
        return NextResponse.json({ success: false, error: 'Failed to record location' }, { status: 500 });
    }
}

// GET: Retrieve location history (breadcrumbs) for a tour/booking
export async function GET(req: Request) {
    try {
        const authUser = await authenticateDriverOrUser(req);
        if (!authUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(req.url);
        const bookingId = url.searchParams.get('bookingId');
        const driverId = url.searchParams.get('driverId') || authUser.driverId;
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 500);

        const whereClause: any = {
            companyId: authUser.companyId,
        };

        if (bookingId) {
            whereClause.bookingId = bookingId;
        } else if (driverId) {
            whereClause.driverId = driverId;
        }

        const locations = await prisma.driverLocation.findMany({
            where: whereClause,
            orderBy: { timestamp: 'asc' },
            take: limit,
            select: {
                id: true,
                lat: true,
                lon: true,
                heading: true,
                speed: true,
                accuracy: true,
                timestamp: true,
            }
        });

        return NextResponse.json({
            success: true,
            data: locations
        });

    } catch (error) {
        console.error('Fetch driver location history error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch location history' }, { status: 500 });
    }
}
