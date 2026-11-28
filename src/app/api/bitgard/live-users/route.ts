import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyBitgardSyncSignature, isAllowedSourceIp } from '@/lib/security';

export const dynamic = 'force-dynamic';

const LIVE_WINDOW_MS = 2 * 60 * 1000; // WorkstationGuard heartbeats every 45s
const DRIVER_LIVE_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
    try {
        if (!isAllowedSourceIp(request, process.env.BITGARD_SYNC_ALLOWED_IPS)) {
            return NextResponse.json(
                { success: false, error: 'Source IP is not allowlisted for Bitgard telemetry' },
                { status: 403 }
            );
        }

        const syncSecret = process.env.BITGARD_SYNC_SECRET?.trim();
        if (!syncSecret) {
            return NextResponse.json(
                { success: false, error: 'Bitgard sync secret is not configured' },
                { status: 500 }
            );
        }

        const rawBody = await request.text();
        const verification = verifyBitgardSyncSignature(
            rawBody,
            {
                deliveryId: request.headers.get('x-bitgard-delivery-id'),
                timestamp: request.headers.get('x-bitgard-timestamp'),
                signature: request.headers.get('x-bitgard-signature'),
            },
            syncSecret
        );

        if (!verification.valid) {
            return NextResponse.json(
                { success: false, error: verification.reason },
                { status: 401 }
            );
        }

        const now = Date.now();
        const liveCutoff = new Date(now - LIVE_WINDOW_MS);
        const driverCutoff = new Date(now - DRIVER_LIVE_WINDOW_MS);

        const [workstations, liveDrivers] = await Promise.all([
            prisma.activeWorkstation.findMany({
                where: { status: 'ACTIVE' },
                orderBy: { lastSeenAt: 'desc' },
                take: 250,
                select: {
                    id: true,
                    companyId: true,
                    deviceId: true,
                    deviceLabel: true,
                    platform: true,
                    lastSeenAt: true,
                    createdAt: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                    company: {
                        select: {
                            id: true,
                            companyName: true,
                            email: true,
                            subscription: {
                                select: {
                                    tier: true,
                                    status: true,
                                    billingCycle: true,
                                    isLifetime: true,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.user.findMany({
                where: {
                    role: 'DRIVER',
                    isLiveTracking: true,
                    lastLocationAt: { gte: driverCutoff },
                },
                orderBy: { lastLocationAt: 'desc' },
                take: 100,
                select: {
                    id: true,
                    companyId: true,
                    name: true,
                    email: true,
                    role: true,
                    lastLocationAt: true,
                    company: {
                        select: {
                            id: true,
                            companyName: true,
                            subscription: {
                                select: {
                                    tier: true,
                                    status: true,
                                    billingCycle: true,
                                    isLifetime: true,
                                },
                            },
                        },
                    },
                },
            }),
        ]);

        const workstationSessions = workstations.map((ws) => {
            const isLiveNow = ws.lastSeenAt.getTime() >= liveCutoff.getTime();
            const isDesktopApp = ws.deviceLabel.toLowerCase().includes('vigil desktop');
            return {
                id: ws.id,
                kind: 'WORKSTATION' as const,
                isLiveNow,
                isDesktopApp,
                userId: ws.user.id,
                userName: ws.user.name,
                userEmail: ws.user.email,
                userRole: ws.user.role,
                companyId: ws.company.id,
                companyName: ws.company.companyName,
                tier: ws.company.subscription?.tier || 'UNLICENSED',
                subscriptionStatus: ws.company.subscription?.status || 'NONE',
                billingCycle: ws.company.subscription?.billingCycle || null,
                deviceLabel: ws.deviceLabel,
                platform: ws.platform || null,
                lastSeenAt: ws.lastSeenAt.toISOString(),
            };
        });

        const driverSessions = liveDrivers.map((drv) => ({
            id: `drv_${drv.id}`,
            kind: 'DRIVER_GPS' as const,
            isLiveNow: true,
            isDesktopApp: false,
            userId: drv.id,
            userName: drv.name,
            userEmail: drv.email,
            userRole: drv.role,
            companyId: drv.company.id,
            companyName: drv.company.companyName,
            tier: drv.company.subscription?.tier || 'UNLICENSED',
            subscriptionStatus: drv.company.subscription?.status || 'NONE',
            billingCycle: drv.company.subscription?.billingCycle || null,
            deviceLabel: 'Driver Mobile GPS',
            platform: 'Mobile Telemetry',
            lastSeenAt: (drv.lastLocationAt || new Date()).toISOString(),
        }));

        const allSessions = [...workstationSessions, ...driverSessions].sort(
            (a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
        );

        const liveNowUsers = new Set(
            allSessions.filter((s) => s.isLiveNow).map((s) => s.userId)
        );
        const activeCompanies = new Set(
            allSessions.filter((s) => s.isLiveNow).map((s) => s.companyId)
        );

        return NextResponse.json(
            {
                success: true,
                fetchedAt: new Date().toISOString(),
                summary: {
                    liveNowCount: liveNowUsers.size,
                    activeWorkstationCount: workstationSessions.length,
                    liveDriverCount: driverSessions.length,
                    liveCompanyCount: activeCompanies.size,
                },
                sessions: allSessions,
            },
            { headers: { 'Cache-Control': 'no-store' } }
        );
    } catch (error) {
        console.error('Bitgard live-users telemetry error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
