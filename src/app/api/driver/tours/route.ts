import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateBearerOrSession } from '@/lib/security';
import { extractHandoverNavigation } from '@/lib/handover-navigation';
import { checkTierFeature } from '@/lib/subscription';
import { enforceApiRateLimit } from '@/lib/api-rate-limit';

export async function GET(req: Request) {
    try {
        const authRes = await authenticateBearerOrSession(req, ['DRIVER']);
        if (!authRes.authenticated) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Driver access required' }, { status: authRes.status });
        }

        const rl = await enforceApiRateLimit(req, {
            prefix: 'driver-tours',
            identifier: authRes.userId,
            maxAttempts: 60,
            windowMs: 60 * 1000,
        });
        if (rl.limited) return rl.response;
        const driverId = authRes.userId;

        const driverRecord = await prisma.user.findUnique({
            where: { id: driverId },
            select: { companyId: true },
        });
        if (driverRecord?.companyId) {
            const subCheck = await checkTierFeature(driverRecord.companyId, 'driverMobileSync');
            if (!subCheck.allowed) {
                return NextResponse.json(
                    { success: false, code: subCheck.code, error: subCheck.error },
                    { status: 403 }
                );
            }
        }
        
        // Find assigned tours for this driver
        const [tours, driverUser] = await Promise.all([
            prisma.booking.findMany({
                where: {
                    driverId: driverId,
                    status: {
                        in: ['CONFIRMED', 'PENDING', 'ONGOING'] // Ongoing or upcoming
                    }
                },
                include: {
                    tripActivities: {
                        orderBy: { timestamp: 'desc' },
                        take: 10,
                    },
                    driverLocations: {
                        orderBy: { timestamp: 'desc' },
                        take: 1,
                        select: {
                            lat: true,
                            lon: true,
                            timestamp: true,
                        }
                    }
                },
                orderBy: {
                    startDate: 'asc'
                }
            }),
            prisma.user.findUnique({
                where: { id: driverId },
                include: {
                    company: {
                        select: {
                            id: true,
                            companyName: true,
                            logoUrl: true,
                            phone: true,
                        }
                    }
                }
            })
        ]);

        const enrichedTours = tours.map((tour) => {
            const { needsTakeover, handoverDetails } = extractHandoverNavigation(tour);
            return {
                ...tour,
                needsTakeover,
                handoverDetails,
            };
        });

        return NextResponse.json({
            success: true,
            data: enrichedTours,
            driver: driverUser ? {
                id: driverUser.id,
                name: driverUser.name,
                email: driverUser.email,
                avatarUrl: driverUser.avatarUrl || null,
                companyId: driverUser.company?.id,
                companyName: driverUser.company?.companyName || 'Transport Company',
                companyLogoUrl: driverUser.company?.logoUrl || null,
                companyPhone: driverUser.company?.phone || null,
            } : null
        });
    } catch (error) {
        console.error('Driver tours error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
