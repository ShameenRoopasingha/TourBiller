import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
    verifyBitgardSyncSignature,
    hashOpaqueToken,
    isAllowedSourceIp,
    isAdminOrOwnerRole,
} from '@/lib/security';

const onboardingRequestSchema = z.object({
    email: z.string().trim().email().max(254),
    sessionId: z.string().trim().min(1).max(180).optional(),
});

const ONBOARDING_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours for brand-new workspaces

export async function POST(request: Request) {
    try {
        if (!isAllowedSourceIp(request, process.env.BITGARD_SYNC_ALLOWED_IPS)) {
            return NextResponse.json(
                { success: false, error: 'Source IP is not allowlisted for Bitgard sync' },
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

        let rawJson: unknown;
        try {
            rawJson = JSON.parse(rawBody);
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid JSON payload' },
                { status: 400 }
            );
        }

        const parsed = onboardingRequestSchema.safeParse(rawJson);
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: parsed.error.issues[0]?.message || 'Invalid payload' },
                { status: 400 }
            );
        }

        const email = parsed.data.email.toLowerCase();
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                role: true,
                tokenVersion: true,
                createdAt: true,
            },
        });

        if (!user || !isAdminOrOwnerRole(user.role)) {
            return NextResponse.json({ success: true, eligible: false, setupUrl: null });
        }

        // Security guard: Only mint an inline setup URL for brand-new workspaces
        // whose admin has never set or reset their password (`tokenVersion === 0`).
        const ageMs = Date.now() - user.createdAt.getTime();
        if (user.tokenVersion !== 0 || ageMs > ONBOARDING_WINDOW_MS) {
            return NextResponse.json({ success: true, eligible: false, setupUrl: null });
        }

        const setupToken = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000);

        await prisma.passwordResetToken.deleteMany({ where: { email } });
        await prisma.passwordResetToken.create({
            data: {
                email,
                token: hashOpaqueToken(setupToken),
                expires,
            },
        });

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const setupUrl = `${baseUrl.replace(/\/+$/, '')}/reset-password?token=${setupToken}&email=${encodeURIComponent(
            email
        )}&onboarding=1`;

        return NextResponse.json({
            success: true,
            eligible: true,
            setupUrl,
        });
    } catch (error) {
        console.error('Bitgard onboarding token error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
