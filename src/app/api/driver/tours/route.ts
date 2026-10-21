import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

import { auth } from '@/lib/auth';
import { getJwtSecret } from '@/lib/jwt';

import { extractHandoverNavigation } from '@/lib/handover-navigation';

export async function GET(req: Request) {
    try {
        let driverId: string | null = null;

        // 1. Bearer Token check (Mobile App)
        const authHeader = req.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, getJwtSecret()) as any;
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
