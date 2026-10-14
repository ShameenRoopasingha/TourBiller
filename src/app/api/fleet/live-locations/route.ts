import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key-vigil';

async function verifyAdminOrOwner(req: Request) {
    // 1. Session-based check (Next.js Dashboard)
    try {
        const session = await auth();
        const user = session?.user as { id?: string; companyId?: string; role?: string } | undefined;
        if (user?.id && user?.companyId && (user.role === 'ADMIN' || user.role === 'OWNER')) {
            return { companyId: user.companyId, userId: user.id, role: user.role };
        }
    } catch {
        // Continue to check Bearer token
    }

    // 2. Bearer token check (Mobile Admin or API)
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            if (decoded?.companyId && (decoded.role === 'ADMIN' || decoded.role === 'OWNER')) {
                return { companyId: decoded.companyId, userId: decoded.id, role: decoded.role };
            }
        } catch {
            return null;
        }
    }

    return null;
}

export async function GET(req: Request) {
    try {
        const authUser = await verifyAdminOrOwner(req);
        if (!authUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required' }, { status: 401 });
        }

        const companyId = authUser.companyId;

        // 1. Fetch active ongoing tours
        const activeBookings = await prisma.booking.findMany({
            where: {
                companyId: companyId,
                status: 'ONGOING'
            },
            include: {
                driver: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        lastLat: true,
                        lastLon: true,
                        lastLocationAt: true,
                        isLiveTracking: true,
                    }
                }
            },
            orderBy: {
                startDate: 'desc'
            }
        });

        // 2. Fetch vehicle info for active bookings
        const vehicleNos = activeBookings.map(b => b.vehicleNo).filter(Boolean) as string[];
        const vehicles = await prisma.vehicle.findMany({
            where: {
                companyId: companyId,
                vehicleNo: { in: vehicleNos }
            },
            select: {
                vehicleNo: true,
                model: true,
                category: true,
            }
        });
        const vehicleMap = new Map(vehicles.map(v => [v.vehicleNo, v]));

        // 3. Map active tours with locations
        const nowMs = Date.now();
        const activeTours = activeBookings.map(b => {
            const vehicleInfo = vehicleMap.get(b.vehicleNo);
            // Effective coordinates: prefer booking's lastLat, fallback to driver's lastLat
            const effectiveLat = b.lastLat ?? b.driver?.lastLat ?? null;
            const effectiveLon = b.lastLon ?? b.driver?.lastLon ?? null;
            const lastAt = b.lastLocationAt ?? b.driver?.lastLocationAt ?? null;
            
            // Check if active in the last 5 minutes
            const isFresh = lastAt ? (nowMs - new Date(lastAt).getTime() < 5 * 60 * 1000) : false;

            return {
                id: b.id,
                bookingId: b.id,
                customerName: b.customerName,
                vehicleNo: b.vehicleNo,
                vehicleModel: vehicleInfo?.model || b.vehicleNo,
                vehicleCategory: vehicleInfo?.category || 'CAR',
                driverId: b.driverId,
                driverName: b.driver?.name || 'Unassigned',
                driverEmail: b.driver?.email || '',
                pickupLocation: b.pickupLocation,
                destination: b.destination,
                dropLocation: b.dropLocation,
                startDate: b.startDate,
                endDate: b.endDate,
                lat: effectiveLat,
                lon: effectiveLon,
                heading: b.lastHeading ?? 0,
                speed: b.lastSpeed ?? 0,
                lastLocationAt: lastAt,
                isFresh,
                isLiveTracking: b.driver?.isLiveTracking ?? false,
            };
        });

        // 4. Fetch all other online drivers (even if without ongoing booking)
        const onlineDrivers = await prisma.user.findMany({
            where: {
                companyId: companyId,
                role: 'DRIVER',
                isLiveTracking: true,
            },
            select: {
                id: true,
                name: true,
                email: true,
                lastLat: true,
                lastLon: true,
                lastLocationAt: true,
            }
        });

        return NextResponse.json({
            success: true,
            summary: {
                totalActiveTours: activeTours.length,
                toursWithGps: activeTours.filter(t => t.lat !== null && t.lon !== null).length,
                onlineDriversCount: onlineDrivers.length,
                timestamp: new Date().toISOString()
            },
            data: {
                activeTours,
                onlineDrivers
            }
        });

    } catch (error) {
        console.error('Fleet live locations error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
