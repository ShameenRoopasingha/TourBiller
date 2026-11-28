import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DriverLocationPingSchema, DriverLocationBatchSchema } from '@/lib/validations';
import { authenticateBearerOrSession } from '@/lib/security';
import { checkTierFeature } from '@/lib/subscription';
import { enforceApiRateLimit } from '@/lib/api-rate-limit';

async function resolveAuthorizedBookingId(
    requestedBookingId: string | null | undefined,
    companyId: string,
    driverId: string
): Promise<
    | { ok: true; bookingId: string | null }
    | { ok: false; status: 403 | 404; code?: string; error: string }
> {
    if (requestedBookingId) {
        const booking = await prisma.booking.findFirst({
            where: { id: requestedBookingId, companyId },
            select: { id: true, driverId: true },
        });
        if (!booking) {
            return { ok: false, status: 404, error: 'Booking not found for this company' };
        }
        if (booking.driverId !== driverId) {
            return {
                ok: false,
                status: 403,
                code: 'TOUR_HANDED_OVER',
                error: 'This tour has been reassigned to another driver by dispatch.',
            };
        }
        return { ok: true, bookingId: booking.id };
    }

    const currentBooking = await prisma.booking.findFirst({
        where: { driverId, companyId, status: 'ONGOING' },
        select: { id: true },
    });
    return { ok: true, bookingId: currentBooking?.id || null };
}

// POST: Save driver GPS ping (Single or Batch for Offline Sync)
export async function POST(req: Request) {
    try {
        const authRes = await authenticateBearerOrSession(req, ['DRIVER', 'ADMIN', 'OWNER']);
        if (!authRes.authenticated) {
            return NextResponse.json({ success: false, error: authRes.error }, { status: authRes.status });
        }

        const rl = await enforceApiRateLimit(req, {
            prefix: 'driver-location',
            identifier: authRes.userId,
            maxAttempts: 120,
            windowMs: 60 * 1000,
        });
        if (rl.limited) return rl.response;

        const body = await req.json();
        const driverId = authRes.userId;
        const companyId = authRes.companyId;
        const serverNow = new Date();
        const maxAllowedClientTimeMs = serverNow.getTime() + 5 * 60 * 1000;

        const subCheck = await checkTierFeature(companyId, 'driverMobileSync');
        if (!subCheck.allowed) {
            return NextResponse.json(
                { success: false, code: subCheck.code, error: subCheck.error },
                { status: 403 }
            );
        }

        // Check if this is an offline batch sync
        if (body.batch !== undefined && Array.isArray(body.batch)) {
            const parsedBatch = DriverLocationBatchSchema.safeParse(body);
            if (!parsedBatch.success) {
                return NextResponse.json({ success: false, error: parsedBatch.error.issues[0]?.message || 'Invalid batch payload' }, { status: 400 });
            }

            const batchPoints = parsedBatch.data.batch;
            const resolvedBooking = await resolveAuthorizedBookingId(parsedBatch.data.bookingId, companyId, driverId);
            if (!resolvedBooking.ok) {
                return NextResponse.json(
                    { success: false, ...(resolvedBooking.code ? { code: resolvedBooking.code } : {}), error: resolvedBooking.error },
                    { status: resolvedBooking.status }
                );
            }
            const activeBookingId = resolvedBooking.bookingId;

            const validRecords = batchPoints.map((p) => {
                const rawTs = p.timestamp instanceof Date ? p.timestamp : new Date(p.timestamp);
                const clampedTs = Number.isNaN(rawTs.getTime()) || rawTs.getTime() > maxAllowedClientTimeMs ? serverNow : rawTs;
                return {
                    companyId,
                    driverId,
                    bookingId: activeBookingId,
                    lat: p.lat,
                    lon: p.lon,
                    heading: p.heading,
                    speed: p.speed,
                    accuracy: p.accuracy,
                    battery: p.battery,
                    timestamp: clampedTs,
                    serverReceivedAt: serverNow,
                };
            });

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
        const parsedPing = DriverLocationPingSchema.safeParse(body);
        if (!parsedPing.success) {
            return NextResponse.json({ success: false, error: parsedPing.error.issues[0]?.message || 'Valid latitude and longitude are required' }, { status: 400 });
        }

        const { bookingId, lat, lon, heading, speed, accuracy, battery } = parsedPing.data;

        const resolvedBooking = await resolveAuthorizedBookingId(bookingId, companyId, driverId);
        if (!resolvedBooking.ok) {
            return NextResponse.json(
                { success: false, ...(resolvedBooking.code ? { code: resolvedBooking.code } : {}), error: resolvedBooking.error },
                { status: resolvedBooking.status }
            );
        }
        const activeBookingId = resolvedBooking.bookingId;

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
                serverReceivedAt: now,
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
        const authRes = await authenticateBearerOrSession(req, ['DRIVER', 'ADMIN', 'OWNER']);
        if (!authRes.authenticated) {
            return NextResponse.json({ success: false, error: authRes.error }, { status: authRes.status });
        }

        const rl = await enforceApiRateLimit(req, {
            prefix: 'driver-location',
            identifier: authRes.userId,
            maxAttempts: 120,
            windowMs: 60 * 1000,
        });
        if (rl.limited) return rl.response;

        const url = new URL(req.url);
        const bookingId = url.searchParams.get('bookingId');
        const driverId = url.searchParams.get('driverId') || authRes.userId;
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 500);

        const whereClause: {
            companyId: string;
            driverId?: string;
            bookingId?: string;
        } = {
            companyId: authRes.companyId,
        };

        if (authRes.role === 'DRIVER') {
            whereClause.driverId = authRes.userId;
            if (bookingId) {
                whereClause.bookingId = bookingId;
            }
        } else if (bookingId) {
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
