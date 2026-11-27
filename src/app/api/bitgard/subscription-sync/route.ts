import crypto from 'crypto';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyBitgardSyncSignature, hashOpaqueToken, isAllowedSourceIp } from '@/lib/security';
import { sendPasswordResetEmail } from '@/lib/open-source-mailer';

const syncPayloadSchema = z.object({
    deliveryId: z.string().trim().min(1).max(160),
    eventType: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(254),
    companyName: z.string().trim().min(1).max(160),
    contactName: z.string().trim().max(120).nullable().optional(),
    phone: z.string().trim().max(40).nullable().optional(),
    address: z.string().trim().max(240).nullable().optional(),
    country: z.string().trim().max(60).nullable().optional(),
    tier: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
    billingCycle: z.enum(['MONTHLY', 'ANNUAL', 'LIFETIME']),
    status: z.enum([
        'TRIALING',
        'ACTIVE',
        'LIFETIME',
        'PAST_DUE',
        'EXPIRED',
        'CANCELLED',
        'REVOKED',
    ]),
    source: z.enum(['DODO_PAYMENTS', 'MANUAL_ADMIN']).default('DODO_PAYMENTS'),
    isLifetime: z.boolean().default(false),
    licenseKey: z.string().trim().min(4).max(80).optional().nullable(),
    bitgardSubscriptionId: z.string().trim().min(1).max(120),
    currentPeriodStart: z.string().datetime().nullable().optional(),
    currentPeriodEnd: z.string().datetime().nullable().optional(),
    note: z.string().max(400).nullable().optional(),
    initialAdminPassword: z.string().min(6).max(128).optional(),
});

const GRANTING_STATUSES = new Set(['ACTIVE', 'LIFETIME', 'TRIALING']);

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
            console.error('Bitgard subscription sync rejected: BITGARD_SYNC_SECRET is not configured.');
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
                { success: false, error: 'Invalid JSON sync payload' },
                { status: 400 }
            );
        }

        const parsed = syncPayloadSchema.safeParse(rawJson);
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: parsed.error.issues[0]?.message || 'Invalid sync payload' },
                { status: 400 }
            );
        }

        const data = parsed.data;
        const email = data.email.toLowerCase();

        // Idempotent replay protection per deliveryId
        const existingDelivery = await prisma.subscriptionEvent.findUnique({
            where: { deliveryId: data.deliveryId },
            select: { id: true },
        });
        if (existingDelivery) {
            return NextResponse.json({
                success: true,
                duplicate: true,
                deliveryId: data.deliveryId,
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true, companyId: true, name: true },
        });

        const existingSubByExternal = await prisma.subscription.findUnique({
            where: { bitgardSubscriptionId: data.bitgardSubscriptionId },
            select: { id: true, companyId: true },
        });

        const targetCompanyId = existingUser?.companyId || existingSubByExternal?.companyId || null;
        const isLifetime = data.isLifetime || data.status === 'LIFETIME';
        const periodStart = data.currentPeriodStart ? new Date(data.currentPeriodStart) : new Date();
        const periodEnd = isLifetime
            ? null
            : data.currentPeriodEnd
            ? new Date(data.currentPeriodEnd)
            : null;

        if (!targetCompanyId && !GRANTING_STATUSES.has(data.status)) {
            return NextResponse.json({
                success: true,
                ignored: true,
                message: 'No existing tenant for non-provisioning subscription event.',
            });
        }

        let createdNewTenant = false;
        let setupUrl: string | null = null;
        let resolvedCompanyId = targetCompanyId;
        const normalizedCountryCode = data.country?.trim()
            ? data.country.trim().toLowerCase().slice(0, 2)
            : undefined;

        if (!resolvedCompanyId) {
            const effectivePassword =
                data.initialAdminPassword || crypto.randomBytes(24).toString('hex');
            const hashedPassword = await bcrypt.hash(effectivePassword, 10);

            const created = await prisma.$transaction(async (tx) => {
                const profile = await tx.businessProfile.create({
                    data: {
                        companyName: data.companyName,
                        email,
                        ...(data.address?.trim() ? { address: data.address.trim() } : {}),
                        ...(data.phone?.trim() ? { phone: data.phone.trim() } : {}),
                        ...(normalizedCountryCode ? { countryCode: normalizedCountryCode } : {}),
                    },
                });

                await tx.user.create({
                    data: {
                        email,
                        name: data.contactName?.trim() || data.companyName,
                        password: hashedPassword,
                        role: 'ADMIN',
                        companyId: profile.id,
                    },
                });

                const sub = await tx.subscription.create({
                    data: {
                        companyId: profile.id,
                        ownerEmail: email,
                        licenseKey: data.licenseKey || null,
                        tier: data.tier,
                        billingCycle: isLifetime ? 'LIFETIME' : data.billingCycle,
                        status: data.status,
                        source: data.source,
                        isLifetime,
                        bitgardSubscriptionId: data.bitgardSubscriptionId,
                        currentPeriodStart: periodStart,
                        currentPeriodEnd: periodEnd,
                        note: data.note || null,
                        lastSyncedAt: new Date(),
                    },
                });

                await tx.subscriptionEvent.create({
                    data: {
                        subscriptionId: sub.id,
                        deliveryId: data.deliveryId,
                        eventType: data.eventType,
                        tier: data.tier,
                        status: data.status,
                        metadata: {
                            source: data.source,
                            isLifetime,
                            licenseKey: data.licenseKey || null,
                        },
                    },
                });

                return profile.id;
            });

            resolvedCompanyId = created;
            createdNewTenant = true;

            if (!data.initialAdminPassword) {
                const setupToken = crypto.randomBytes(32).toString('hex');
                const expires = new Date(Date.now() + 3600000);
                await prisma.passwordResetToken.deleteMany({ where: { email } });
                await prisma.passwordResetToken.create({
                    data: { email, token: hashOpaqueToken(setupToken), expires },
                });

                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                const resetLink = `${baseUrl}/reset-password?token=${setupToken}&email=${encodeURIComponent(
                    email
                )}&onboarding=1`;
                setupUrl = resetLink;
                await sendPasswordResetEmail({
                    to: email,
                    name: data.contactName?.trim() || data.companyName,
                    resetLink,
                });
            }
        } else {
            await prisma.$transaction(async (tx) => {
                if (data.address?.trim() || data.phone?.trim() || normalizedCountryCode) {
                    const existingProfile = await tx.businessProfile.findUnique({
                        where: { id: resolvedCompanyId! },
                        select: { address: true, phone: true, countryCode: true },
                    });
                    if (existingProfile) {
                        await tx.businessProfile.update({
                            where: { id: resolvedCompanyId! },
                            data: {
                                ...(!existingProfile.address && data.address?.trim()
                                    ? { address: data.address.trim() }
                                    : {}),
                                ...(!existingProfile.phone && data.phone?.trim()
                                    ? { phone: data.phone.trim() }
                                    : {}),
                                ...(normalizedCountryCode ? { countryCode: normalizedCountryCode } : {}),
                            },
                        });
                    }
                }
                const sub = await tx.subscription.upsert({
                    where: { companyId: resolvedCompanyId! },
                    update: {
                        ownerEmail: email,
                        licenseKey: data.licenseKey || undefined,
                        tier: data.tier,
                        billingCycle: isLifetime ? 'LIFETIME' : data.billingCycle,
                        status: data.status,
                        source: data.source,
                        isLifetime,
                        bitgardSubscriptionId: data.bitgardSubscriptionId,
                        currentPeriodStart: periodStart,
                        currentPeriodEnd: periodEnd,
                        note: data.note ?? undefined,
                        lastSyncedAt: new Date(),
                    },
                    create: {
                        companyId: resolvedCompanyId!,
                        ownerEmail: email,
                        licenseKey: data.licenseKey || null,
                        tier: data.tier,
                        billingCycle: isLifetime ? 'LIFETIME' : data.billingCycle,
                        status: data.status,
                        source: data.source,
                        isLifetime,
                        bitgardSubscriptionId: data.bitgardSubscriptionId,
                        currentPeriodStart: periodStart,
                        currentPeriodEnd: periodEnd,
                        note: data.note || null,
                        lastSyncedAt: new Date(),
                    },
                });

                await tx.subscriptionEvent.create({
                    data: {
                        subscriptionId: sub.id,
                        deliveryId: data.deliveryId,
                        eventType: data.eventType,
                        tier: data.tier,
                        status: data.status,
                        metadata: {
                            source: data.source,
                            isLifetime,
                            licenseKey: data.licenseKey || null,
                        },
                    },
                });
            });
        }

        return NextResponse.json({
            success: true,
            companyId: resolvedCompanyId,
            createdTenant: createdNewTenant,
            setupUrl,
            status: data.status,
            tier: data.tier,
        });
    } catch (error) {
        console.error('Bitgard subscription sync error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
