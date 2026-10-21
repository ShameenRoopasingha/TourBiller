import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/jwt';

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
            const decoded = jwt.verify(token, getJwtSecret()) as any;
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

        // 1. Fetch active ongoing tours or tours with urgent dispatch alerts
        const activeBookings = await prisma.booking.findMany({
            where: {
                companyId: companyId,
                OR: [
                    { status: { in: ['ONGOING', 'OVERDUE'] } },
                    {
                        status: 'CONFIRMED',
                        tripActivities: {
                            some: {
                                type: { in: ['HANDOVER_REQUESTED', 'BREAKDOWN_REPORTED'] }
                            }
                        }
                    }
                ]
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
                },
                tripActivities: {
                    where: {
                        type: { in: ['HANDOVER_REQUESTED', 'HANDOVER', 'BREAKDOWN_REPORTED', 'VEHICLE_SWAPPED'] }
                    },
                    select: {
                        id: true,
                        type: true,
                        note: true,
                        timestamp: true,
                    },
                    orderBy: { timestamp: 'desc' },
                    take: 4,
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

            const handoverReq = b.tripActivities?.find(a => a.type === 'HANDOVER_REQUESTED');
            const handoverDone = b.tripActivities?.find(a => a.type === 'HANDOVER');
            const hasPendingHandover = !!handoverReq && (!handoverDone || new Date(handoverReq.timestamp) > new Date(handoverDone.timestamp));

            let handoverDetails = null;
            if (hasPendingHandover && handoverReq) {
                const noteText = handoverReq.note || '';
                const reasonMatch = noteText.match(/Reason:\s*([^|]+)/i);
                const meterMatch = noteText.match(/Meter:\s*([0-9.]+)/i);
                const locMatch = noteText.match(/(?:Location\/Note|Location):\s*([^|]+)/i);
                const notesMatch = noteText.match(/Notes?:\s*(.+)/i);
                handoverDetails = {
                    reason: reasonMatch ? reasonMatch[1].trim() : 'Mid-Tour Handover Requested',
                    meterReading: meterMatch ? meterMatch[1].trim() : '',
                    location: locMatch ? locMatch[1].trim() : '',
                    note: notesMatch ? notesMatch[1].trim() : (!locMatch && noteText ? noteText : ''),
                    timestamp: handoverReq.timestamp,
                };
            }

            const breakdownReq = b.tripActivities?.find(a => a.type === 'BREAKDOWN_REPORTED');
            const swapped = b.tripActivities?.find(a => a.type === 'VEHICLE_SWAPPED');
            const hasPendingBreakdown = !!breakdownReq && (!swapped || new Date(breakdownReq.timestamp) > new Date(swapped.timestamp));

            const wasSwapped = !!swapped;
            let isHiredVehicle = !vehicleInfo; // Not in company fleet
            let hiredSupplier: string | null = null;

            if (swapped?.note) {
                const noteLower = swapped.note.toLowerCase();
                if (noteLower.includes('external third-party hire') || noteLower.includes('external') || noteLower.includes('outsourced')) {
                    isHiredVehicle = true;
                }
                const supplierMatch = swapped.note.match(/Supplier:\s*([^|(]+)/i);
                if (supplierMatch) {
                    hiredSupplier = supplierMatch[1].trim();
                }
            }

            let breakdownDetails = null;
            if (hasPendingBreakdown && breakdownReq) {
                const noteText = breakdownReq.note || '';
                const issueMatch = noteText.match(/Issue:\s*([^|]+)/i);
                const meterMatch = noteText.match(/Meter:\s*([0-9.]+)/i);
                const locMatch = noteText.match(/Location:\s*([^|]+)/i);
                const notesMatch = noteText.match(/Notes:\s*(.+)/i);
                breakdownDetails = {
                    reason: issueMatch ? issueMatch[1].trim() : 'Vehicle Breakdown Reported',
                    meterReading: meterMatch ? meterMatch[1].trim() : '',
                    location: locMatch ? locMatch[1].trim() : '',
                    note: notesMatch ? notesMatch[1].trim() : '',
                    timestamp: breakdownReq.timestamp,
                };
            }

            return {
                id: b.id,
                bookingId: b.id,
                customerName: b.customerName,
                vehicleNo: b.vehicleNo,
                vehicleModel: vehicleInfo?.model || (isHiredVehicle ? `${b.vehicleNo} (Hired)` : `${b.vehicleNo} (Vehicle)`),
                vehicleCategory: vehicleInfo?.category || (isHiredVehicle ? 'HIRED' : 'STANDARD'),
                isExternalVehicle: !vehicleInfo,
                isHiredVehicle,
                hiredSupplier,
                wasSwapped,
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
                hasPendingHandover,
                handoverDetails,
                hasPendingBreakdown,
                breakdownDetails,
                routePolyline: b.routePolyline || null,
                intermediateStops: (() => {
                    if (!b.notes) return [];
                    const lines = b.notes.split('\n');
                    for (let i = lines.length - 1; i >= 0; i--) {
                        const line = lines[i];
                        const match = line.match(/Stops:\s*([^()]+)/i);
                        if (match) {
                            return match[1].split('➔').map(s => s.trim()).filter(Boolean);
                        }
                    }
                    return [];
                })(),
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
