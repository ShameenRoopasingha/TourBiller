import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

function resolveBitgardOrigin(): string {
    const raw =
        process.env.NEXT_PUBLIC_BITGARD_PORTAL_URL?.trim() || 'https://bitgard.vercel.app';
    try {
        return new URL(raw).origin;
    } catch {
        return 'https://bitgard.vercel.app';
    }
}

/**
 * Signs and pushes current fleet count to BitgardWeb so per-tier extra-vehicle
 * overage charges ($2.10 Starter / $1.80 Pro / $1.56 Enterprise) stay synced
 * with Dodo Payments metered usage billing.
 */
export async function reportCompanyVehicleUsage(companyId: string): Promise<void> {
    const syncSecret = process.env.BITGARD_SYNC_SECRET?.trim();
    if (!syncSecret) return;
    if (!prisma?.subscription?.findUnique || !prisma?.businessProfile?.findUnique || !prisma?.vehicle?.count) {
        return;
    }

    try {
        const [sub, profile, vehicleCount] = await Promise.all([
            prisma.subscription.findUnique({
                where: { companyId },
                select: { ownerEmail: true },
            }),
            prisma.businessProfile.findUnique({
                where: { id: companyId },
                select: { email: true },
            }),
            prisma.vehicle.count({ where: { companyId } }),
        ]);

        const email = (sub?.ownerEmail || profile?.email || '').trim().toLowerCase();
        if (!email) return;

        const deliveryId = `veh_${companyId}_${vehicleCount}_${Date.now()}`;
        const rawBody = JSON.stringify({
            deliveryId,
            companyId,
            email,
            vehicleCount,
        });

        const timestamp = String(Math.floor(Date.now() / 1000));
        const digest = crypto
            .createHmac('sha256', syncSecret)
            .update(`${timestamp}.${deliveryId}.${rawBody}`, 'utf8')
            .digest('base64');

        const origin = resolveBitgardOrigin();
        await fetch(`${origin}/api/bitgard/vehicle-usage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-bitgard-delivery-id': deliveryId,
                'x-bitgard-timestamp': timestamp,
                'x-bitgard-signature': `v1,${digest}`,
            },
            body: rawBody,
            signal: AbortSignal.timeout(4000),
        });
    } catch (error) {
        console.warn('Non-blocking vehicle usage telemetry sync skipped:', error);
    }
}
