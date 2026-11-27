import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: { findUnique: jest.fn(), count: jest.fn() },
        customer: { findFirst: jest.fn(), deleteMany: jest.fn() },
        booking: { findMany: jest.fn(), findFirst: jest.fn(), count: jest.fn() },
        quotation: { findMany: jest.fn(), create: jest.fn(), count: jest.fn(), deleteMany: jest.fn() },
        tourSchedule: { findFirst: jest.fn(), count: jest.fn(), updateMany: jest.fn() },
        bill: { create: jest.fn(), count: jest.fn() },
        vehicle: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), count: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
        vehicleExpense: { count: jest.fn(), deleteMany: jest.fn() },
        subscription: { findUnique: jest.fn(), upsert: jest.fn(), create: jest.fn(), update: jest.fn() },
        subscriptionEvent: { findUnique: jest.fn(), create: jest.fn() },
        passwordResetToken: { deleteMany: jest.fn(), create: jest.fn() },
        auditLog: { create: jest.fn() },
        activeWorkstation: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), upsert: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
        $transaction: jest.fn(),
        $queryRaw: jest.fn(),
    },
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
    revalidateTag: jest.fn(),
}));

jest.mock('@/lib/open-source-mailer', () => ({
    sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/lib/auth', () => ({
    auth: jest.fn(),
}));

jest.mock('@/lib/auth-guard', () => ({
    requireAuth: jest.fn(),
    requireAdmin: jest.fn(),
}));

jest.mock('@/lib/osrm-actions', () => ({
    calculateRouteOSRM: jest.fn(),
}));

jest.mock('ai', () => ({
    streamText: jest.fn(),
    tool: jest.fn((def) => def),
    convertToModelMessages: jest.fn(async (msgs) => msgs),
    stepCountIs: jest.fn((n) => ({ type: 'stepCount', count: n })),
}));

jest.mock('@ai-sdk/openai', () => ({
    createOpenAI: jest.fn(() => jest.fn(() => 'mock-model')),
}));

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import * as authGuard from '@/lib/auth-guard';
import { calculateRouteOSRM } from '@/lib/osrm-actions';
import { sendPasswordResetEmail } from '@/lib/open-source-mailer';
import { streamText } from 'ai';
import { getJwtSecret } from '@/lib/jwt';
import { _clearRateLimitStore } from '@/lib/rate-limit';
import {
    timingSafeEqualStrings,
    verifyBitgardSyncSignature,
    verifyCronSecret,
    isAdminOrOwnerRole,
    authenticateBearerOrSession,
    hashOpaqueToken,
    escapeCsvCell,
    hashIpAddress,
    isAllowedSourceIp,
} from '@/lib/security';
import {
    evaluateSubscriptionRecord,
    checkVehicleQuota,
    checkTierFeature,
} from '@/lib/subscription';
import {
    cancelCompanySubscription,
    deactivateCompanyWorkstation,
} from '@/lib/subscription-actions';
import { registerOrSwitchWorkstation } from '@/lib/workstations';
import { POST as workstationHeartbeatPOST } from '@/app/api/auth/workstation-heartbeat/route';
import { POST as bitgardSyncPOST } from '@/app/api/bitgard/subscription-sync/route';
import { POST as bitgardOnboardingPOST } from '@/app/api/bitgard/onboarding-token/route';
import { GET as customerExportGET } from '@/app/api/customers/export/route';
import { POST as chatPOST } from '@/app/api/chat/route';
import { POST as transcribePOST } from '@/app/api/transcribe/route';
import { POST as driverRoutePOST } from '@/app/api/driver/route/route';
import { GET as cronRemindersGET } from '@/app/api/cron/reminders/route';
import { GET as keepaliveGET } from '@/app/api/keepalive/route';
import { POST as companyImportPOST } from '@/app/api/company/import/route';
import { GET as healthV1GET } from '@/app/api/v1/health/route';
import { GET as exchangeRateGET } from '@/app/api/exchange-rate/route';
import { deleteVehicle } from '@/lib/vehicle-actions';
import { deleteCustomer } from '@/lib/customer-actions';
import { deleteQuotation } from '@/lib/quotation-actions';
import { deleteTourSchedule } from '@/lib/tour-schedule-actions';
import { deleteVehicleExpense } from '@/lib/vehicle-expense-actions';
import { swapBookingVehicle } from '@/lib/booking-actions';

function makeBitgardSyncHeaders(
    rawBody: string,
    secret: string,
    deliveryId = 'dlv_test_001',
    timestamp = String(Math.floor(Date.now() / 1000))
): Record<string, string> {
    const sig = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${deliveryId}.${rawBody}`, 'utf8')
        .digest('base64');

    return {
        'content-type': 'application/json',
        'x-bitgard-delivery-id': deliveryId,
        'x-bitgard-timestamp': timestamp,
        'x-bitgard-signature': `v1,${sig}`,
    };
}

const TEST_SYNC_SECRET = 'bitgard-vigil-sync-secret-32-bytes';

describe('BitgardWeb <-> Vigil Security & Subscription Mitigations', () => {
    const origEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        _clearRateLimitStore();
        process.env = { ...origEnv };
    });

    afterAll(() => {
        process.env = origEnv;
    });

    describe('src/lib/security helpers', () => {
        it('performs constant-time string equality safely', () => {
            expect(timingSafeEqualStrings('abc123', 'abc123')).toBe(true);
            expect(timingSafeEqualStrings('abc123', 'abc124')).toBe(false);
            expect(timingSafeEqualStrings('abc', 'abcd')).toBe(false);
        });

        it('validates Bitgard HMAC sync signatures and rejects tampered/stale payloads', () => {
            const now = 1_764_000_000;
            const body = JSON.stringify({ deliveryId: 'dlv_1', tier: 'ENTERPRISE' });
            const headers = makeBitgardSyncHeaders(body, TEST_SYNC_SECRET, 'dlv_1', String(now));

            expect(
                verifyBitgardSyncSignature(
                    body,
                    {
                        deliveryId: headers['x-bitgard-delivery-id'],
                        timestamp: headers['x-bitgard-timestamp'],
                        signature: headers['x-bitgard-signature'],
                    },
                    TEST_SYNC_SECRET,
                    now
                )
            ).toEqual({ valid: true });

            expect(
                verifyBitgardSyncSignature(
                    JSON.stringify({ deliveryId: 'dlv_1', tier: 'STARTER' }),
                    {
                        deliveryId: headers['x-bitgard-delivery-id'],
                        timestamp: headers['x-bitgard-timestamp'],
                        signature: headers['x-bitgard-signature'],
                    },
                    TEST_SYNC_SECRET,
                    now
                )
            ).toMatchObject({ valid: false });

            expect(
                verifyBitgardSyncSignature(
                    body,
                    {
                        deliveryId: headers['x-bitgard-delivery-id'],
                        timestamp: headers['x-bitgard-timestamp'],
                        signature: headers['x-bitgard-signature'],
                    },
                    TEST_SYNC_SECRET,
                    now + 600
                )
            ).toMatchObject({ valid: false });
        });

        it('enforces CRON_SECRET verification and fails closed when unset', () => {
            expect(verifyCronSecret('Bearer abc', undefined)).toMatchObject({ valid: false, status: 500 });
            expect(verifyCronSecret(null, 'super-secret')).toMatchObject({ valid: false, status: 401 });
            expect(verifyCronSecret('Bearer wrong', 'super-secret')).toMatchObject({ valid: false, status: 401 });
            expect(verifyCronSecret('Bearer super-secret', 'super-secret')).toEqual({ valid: true });
        });

        it('recognizes ADMIN and OWNER roles only', () => {
            expect(isAdminOrOwnerRole('ADMIN')).toBe(true);
            expect(isAdminOrOwnerRole('OWNER')).toBe(true);
            expect(isAdminOrOwnerRole('DRIVER')).toBe(false);
            expect(isAdminOrOwnerRole(undefined)).toBe(false);
        });

        it('authenticates Bearer JWT and enforces allowed roles', async () => {
            (auth as jest.Mock).mockResolvedValue(null);
            const driverToken = jwt.sign(
                { id: 'drv-1', companyId: 'comp-1', role: 'DRIVER' },
                getJwtSecret(),
                { expiresIn: '1h' }
            );

            const req = new Request('http://localhost/api/test', {
                headers: { authorization: `Bearer ${driverToken}` },
            });

            const driverOk = await authenticateBearerOrSession(req, ['DRIVER', 'ADMIN']);
            expect(driverOk).toEqual({
                authenticated: true,
                userId: 'drv-1',
                companyId: 'comp-1',
                role: 'DRIVER',
            });

            const driverForbidden = await authenticateBearerOrSession(req, ['ADMIN']);
            expect(driverForbidden).toMatchObject({ authenticated: false, status: 403 });
        });
    });

    describe('TB-8: POST /api/bitgard/subscription-sync', () => {
        it('fails closed (500) when BITGARD_SYNC_SECRET is not configured', async () => {
            delete process.env.BITGARD_SYNC_SECRET;
            const req = new Request('http://localhost/api/bitgard/subscription-sync', {
                method: 'POST',
                body: JSON.stringify({ deliveryId: 'dlv_1' }),
            });
            const res = await bitgardSyncPOST(req);
            expect(res.status).toBe(500);
            expect(prisma.$transaction).not.toHaveBeenCalled();
        });

        it('rejects forged or missing Bitgard signatures with 401', async () => {
            process.env.BITGARD_SYNC_SECRET = TEST_SYNC_SECRET;
            const req = new Request('http://localhost/api/bitgard/subscription-sync', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-bitgard-delivery-id': 'dlv_bad',
                    'x-bitgard-timestamp': String(Math.floor(Date.now() / 1000)),
                    'x-bitgard-signature': 'v1,ZmFrZQ==',
                },
                body: JSON.stringify({
                    deliveryId: 'dlv_bad',
                    eventType: 'admin.lifetime_granted',
                    email: 'rogue@test.com',
                    companyName: 'Rogue',
                    tier: 'ENTERPRISE',
                    billingCycle: 'LIFETIME',
                    status: 'LIFETIME',
                    bitgardSubscriptionId: 'bg_sub_1',
                }),
            });
            const res = await bitgardSyncPOST(req);
            expect(res.status).toBe(401);
            expect(prisma.$transaction).not.toHaveBeenCalled();
        });

        it('provisions BusinessProfile, ADMIN User, Subscription, and sends reset link on signed sync', async () => {
            process.env.BITGARD_SYNC_SECRET = TEST_SYNC_SECRET;
            (prisma.subscriptionEvent.findUnique as jest.Mock).mockResolvedValueOnce(null);
            (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
            (prisma.subscription.findUnique as jest.Mock).mockResolvedValueOnce(null);

            const txSubCreate = jest.fn().mockResolvedValue({ id: 'sub-vigil-1' });
            const txEventCreate = jest.fn().mockResolvedValue({ id: 'evt-1' });
            (prisma.$transaction as jest.Mock).mockImplementation(async (cb) =>
                cb({
                    businessProfile: { create: jest.fn().mockResolvedValue({ id: 'comp-new' }) },
                    user: { create: jest.fn().mockResolvedValue({ id: 'user-new' }) },
                    subscription: { create: txSubCreate },
                    subscriptionEvent: { create: txEventCreate },
                })
            );

            const body = JSON.stringify({
                deliveryId: 'dlv_grant_001',
                eventType: 'admin.lifetime_granted',
                email: 'VIP@Tours.lk',
                companyName: 'VIP Tours',
                tier: 'ENTERPRISE',
                billingCycle: 'LIFETIME',
                status: 'LIFETIME',
                source: 'MANUAL_ADMIN',
                isLifetime: true,
                licenseKey: 'VGL-AAAA-BBBB-CCCC-DDDD',
                bitgardSubscriptionId: 'bg_sub_vip_1',
                note: 'Partner lifetime grant',
            });

            const req = new Request('http://localhost/api/bitgard/subscription-sync', {
                method: 'POST',
                headers: makeBitgardSyncHeaders(body, TEST_SYNC_SECRET, 'dlv_grant_001'),
                body,
            });
            const res = await bitgardSyncPOST(req);
            expect(res.status).toBe(200);
            expect(txSubCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        companyId: 'comp-new',
                        ownerEmail: 'vip@tours.lk',
                        tier: 'ENTERPRISE',
                        status: 'LIFETIME',
                        isLifetime: true,
                    }),
                })
            );
            expect(prisma.passwordResetToken.create).toHaveBeenCalledTimes(1);
            expect(sendPasswordResetEmail).toHaveBeenCalledWith(
                expect.objectContaining({ to: 'vip@tours.lk' })
            );
        });

        it('issues onboarding setupUrl ONLY for brand-new ADMIN/OWNER accounts with tokenVersion=0', async () => {
            process.env.BITGARD_SYNC_SECRET = TEST_SYNC_SECRET;
            process.env.NEXT_PUBLIC_APP_URL = 'https://vigil-pos.vercel.app';

            const body = JSON.stringify({
                email: 'founder@tours.lk',
                sessionId: 'cks_test_123456',
            });

            // 1. Existing user who already set/reset password (tokenVersion = 1) -> NOT eligible
            (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
                id: 'usr-old',
                email: 'founder@tours.lk',
                role: 'ADMIN',
                tokenVersion: 1,
                createdAt: new Date(),
            });
            const ineligibleRes = await bitgardOnboardingPOST(
                new Request('http://localhost/api/bitgard/onboarding-token', {
                    method: 'POST',
                    headers: makeBitgardSyncHeaders(body, TEST_SYNC_SECRET, 'onb_001'),
                    body,
                })
            );
            const ineligibleJson = await ineligibleRes.json();
            expect(ineligibleRes.status).toBe(200);
            expect(ineligibleJson).toMatchObject({ success: true, eligible: false, setupUrl: null });

            // 2. Newly provisioned workspace owner (tokenVersion = 0) -> issues setupUrl
            (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
                id: 'usr-new',
                email: 'founder@tours.lk',
                role: 'ADMIN',
                tokenVersion: 0,
                createdAt: new Date(),
            });
            const okRes = await bitgardOnboardingPOST(
                new Request('http://localhost/api/bitgard/onboarding-token', {
                    method: 'POST',
                    headers: makeBitgardSyncHeaders(body, TEST_SYNC_SECRET, 'onb_002'),
                    body,
                })
            );
            const okJson = await okRes.json();
            expect(okRes.status).toBe(200);
            expect(okJson.eligible).toBe(true);
            expect(okJson.setupUrl).toContain('https://vigil-pos.vercel.app/reset-password?token=');
            expect(okJson.setupUrl).toContain('onboarding=1');
        });
    });

    describe('Subscription Tier & LIFETIME Evaluation', () => {
        it('allows LIFETIME subscriptions even with null period end and bypasses expiry', () => {
            const evalRes = evaluateSubscriptionRecord({
                tier: 'PROFESSIONAL',
                status: 'LIFETIME',
                isLifetime: true,
                currentPeriodEnd: null,
            });
            expect(evalRes).toMatchObject({
                active: true,
                isLifetime: true,
                tier: 'PROFESSIONAL',
                status: 'LIFETIME',
            });
        });

        it('respects ENABLE_SUBSCRIPTION_ENFORCEMENT toggle for test run vs production enforcement', async () => {
            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
                tier: 'STARTER',
                status: 'ACTIVE',
                isLifetime: false,
                currentPeriodEnd: new Date(Date.now() + 86_400_000),
            });
            (prisma.vehicle.count as jest.Mock).mockResolvedValue(10);

            process.env.ENABLE_SUBSCRIPTION_ENFORCEMENT = 'false';
            const testRunAllowed = await checkVehicleQuota('comp-1');
            expect(testRunAllowed.allowed).toBe(true);

            process.env.ENABLE_SUBSCRIPTION_ENFORCEMENT = 'true';
            const enforcedBlocked = await checkVehicleQuota('comp-1');
            expect(enforcedBlocked).toMatchObject({ allowed: false, code: 'QUOTA_EXCEEDED' });

            const multiCurrencyBlocked = await checkTierFeature('comp-1', 'multiCurrency');
            expect(multiCurrencyBlocked).toMatchObject({
                allowed: false,
                code: 'TIER_UPGRADE_REQUIRED',
                requiredTier: 'Enterprise',
            });
        });

        it('exposes billingCycle and currentPeriodStart clearly on evaluated subscriptions', () => {
            const start = new Date('2026-11-01T00:00:00.000Z');
            const end = new Date(Date.now() + 30 * 86_400_000);
            const evalRes = evaluateSubscriptionRecord({
                tier: 'ENTERPRISE',
                billingCycle: 'ANNUAL',
                status: 'ACTIVE',
                source: 'DODO_PAYMENTS',
                isLifetime: false,
                currentPeriodStart: start,
                currentPeriodEnd: end,
                licenseKey: 'VGL-TEST-1234',
            });
            expect(evalRes).toMatchObject({
                active: true,
                tier: 'ENTERPRISE',
                billingCycle: 'ANNUAL',
                status: 'ACTIVE',
                source: 'DODO_PAYMENTS',
                currentPeriodStart: start,
                currentPeriodEnd: end,
            });
        });

        it('rejects subscription cancellation for DRIVER users and protects LIFETIME VIP licenses', async () => {
            (authGuard.requireAuth as jest.Mock).mockResolvedValueOnce({
                authorized: true,
                userId: 'drv-1',
                role: 'DRIVER',
                companyId: 'comp-1',
            });

            const driverCancel = await cancelCompanySubscription('No longer needed');
            expect(driverCancel.success).toBe(false);
            expect(driverCancel.error).toContain('Admin or Owner');

            (authGuard.requireAuth as jest.Mock).mockResolvedValueOnce({
                authorized: true,
                userId: 'own-1',
                role: 'OWNER',
                companyId: 'comp-1',
            });
            (prisma.subscription.findUnique as jest.Mock).mockResolvedValueOnce({
                id: 'sub-life',
                companyId: 'comp-1',
                ownerEmail: 'vip@tours.lk',
                tier: 'ENTERPRISE',
                billingCycle: 'LIFETIME',
                status: 'LIFETIME',
                source: 'MANUAL_ADMIN',
                isLifetime: true,
            });

            const lifetimeCancel = await cancelCompanySubscription();
            expect(lifetimeCancel.success).toBe(false);
            expect(lifetimeCancel.error).toContain('Lifetime VIP');
            expect(prisma.subscription.update).not.toHaveBeenCalled();
        });

        it('fails closed for DODO_PAYMENTS cancellation when BITGARD_SYNC_SECRET is missing, and cancels MANUAL_ADMIN cleanly with audit log', async () => {
            delete process.env.BITGARD_SYNC_SECRET;
            (authGuard.requireAuth as jest.Mock).mockResolvedValue({
                authorized: true,
                userId: 'adm-1',
                role: 'ADMIN',
                companyId: 'comp-1',
            });

            (prisma.subscription.findUnique as jest.Mock).mockResolvedValueOnce({
                id: 'sub-dodo',
                companyId: 'comp-1',
                ownerEmail: 'ops@tours.lk',
                tier: 'PROFESSIONAL',
                billingCycle: 'MONTHLY',
                status: 'ACTIVE',
                source: 'DODO_PAYMENTS',
                bitgardSubscriptionId: 'bg-sub-1',
                isLifetime: false,
            });

            const failedDodo = await cancelCompanySubscription('Switching plan');
            expect(failedDodo.success).toBe(false);
            expect(prisma.subscription.update).not.toHaveBeenCalled();

            (prisma.subscription.findUnique as jest.Mock).mockResolvedValueOnce({
                id: 'sub-manual',
                companyId: 'comp-1',
                ownerEmail: 'ops@tours.lk',
                tier: 'STARTER',
                billingCycle: 'MONTHLY',
                status: 'ACTIVE',
                source: 'MANUAL_ADMIN',
                bitgardSubscriptionId: null,
                isLifetime: false,
            });

            const manualCancel = await cancelCompanySubscription('Seasonal pause');
            expect(manualCancel).toMatchObject({
                success: true,
                status: 'CANCELLED',
                remoteBillingCancelled: false,
            });
            expect(prisma.subscription.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'sub-manual' },
                    data: expect.objectContaining({ status: 'CANCELLED' }),
                })
            );
            expect(prisma.subscriptionEvent.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        subscriptionId: 'sub-manual',
                        eventType: 'subscription.cancelled_by_customer',
                        status: 'CANCELLED',
                    }),
                })
            );
            expect(prisma.auditLog.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        companyId: 'comp-1',
                        action: 'SUBSCRIPTION_CANCEL',
                    }),
                })
            );
        });

        it('enforces Starter 1-workstation limit, allows self-serve switch, and revokes old device heartbeat', async () => {
            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
                tier: 'STARTER',
                billingCycle: 'MONTHLY',
                status: 'ACTIVE',
                source: 'DODO_PAYMENTS',
                isLifetime: false,
                currentPeriodEnd: new Date(Date.now() + 86_400_000),
            });

            // 1 existing active workstation occupies the 1 Starter slot
            (prisma.activeWorkstation.findMany as jest.Mock).mockResolvedValue([
                {
                    id: 'ws-broken-1',
                    companyId: 'comp-1',
                    userId: 'adm-1',
                    deviceId: 'old-broken-device-uuid',
                    deviceLabel: 'Vigil Desktop • Windows (#1111)',
                    platform: 'Windows',
                    status: 'ACTIVE',
                    lastSeenAt: new Date(),
                    createdAt: new Date(),
                    user: { name: 'Kasun', email: 'kasun@tours.lk' },
                },
            ]);

            // New PC without deactivateWorkstationId -> blocked
            const blocked = await registerOrSwitchWorkstation({
                companyId: 'comp-1',
                userId: 'adm-1',
                role: 'ADMIN',
                deviceId: 'new-laptop-device-uuid',
                deviceLabel: 'Edge • Windows (#2222)',
            });
            expect(blocked).toMatchObject({
                allowed: false,
                code: 'WORKSTATION_LIMIT_REACHED',
                maxWorkstations: 1,
            });

            // New PC switching away from broken PC -> revokes old PC & activates new PC
            (prisma.activeWorkstation.upsert as jest.Mock).mockResolvedValueOnce({ id: 'ws-new-2' });
            const switched = await registerOrSwitchWorkstation({
                companyId: 'comp-1',
                userId: 'adm-1',
                role: 'ADMIN',
                deviceId: 'new-laptop-device-uuid',
                deviceLabel: 'Edge • Windows (#2222)',
                deactivateWorkstationId: 'ws-broken-1',
            });
            expect(switched).toMatchObject({
                allowed: true,
                workstationId: 'ws-new-2',
                switchedFromId: 'ws-broken-1',
            });
            expect(prisma.activeWorkstation.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'ws-broken-1' },
                    data: expect.objectContaining({ status: 'REVOKED' }),
                })
            );

            // Revoked workstation heartbeat triggers 401 WORKSTATION_REVOKED
            (auth as jest.Mock).mockResolvedValueOnce({
                user: { id: 'adm-1', companyId: 'comp-1', role: 'ADMIN', deviceId: 'old-broken-device-uuid' },
            });
            (prisma.activeWorkstation.findUnique as jest.Mock).mockResolvedValueOnce({
                id: 'ws-broken-1',
                status: 'REVOKED',
            });
            const hbRes = await workstationHeartbeatPOST(
                new Request('http://localhost/api/auth/workstation-heartbeat', { method: 'POST' })
            );
            expect(hbRes.status).toBe(401);

            // RBAC on deactivateCompanyWorkstation
            (authGuard.requireAuth as jest.Mock).mockResolvedValueOnce({
                authorized: true,
                userId: 'drv-1',
                role: 'DRIVER',
                companyId: 'comp-1',
            });
            const drvRes = await deactivateCompanyWorkstation('ws-new-2');
            expect(drvRes.success).toBe(false);
        });
    });

    describe('Phase 2: GET /api/customers/export (I1)', () => {
        it('returns 401 when unauthenticated and 403 for DRIVER', async () => {
            (authGuard.requireAuth as jest.Mock).mockResolvedValueOnce({
                authorized: false,
                error: 'Not authenticated',
            });
            const unauthRes = await customerExportGET(
                new NextRequest('http://localhost/api/customers/export?id=cust-1')
            );
            expect(unauthRes.status).toBe(401);

            (authGuard.requireAuth as jest.Mock).mockResolvedValueOnce({
                authorized: true,
                userId: 'drv-1',
                role: 'DRIVER',
                companyId: 'comp-a',
            });
            const driverRes = await customerExportGET(
                new NextRequest('http://localhost/api/customers/export?id=cust-1')
            );
            expect(driverRes.status).toBe(403);
        });

        it('enforces companyId scope and neutralizes CSV formula injection', async () => {
            (authGuard.requireAuth as jest.Mock).mockResolvedValue({
                authorized: true,
                userId: 'adm-1',
                role: 'ADMIN',
                companyId: 'comp-a',
            });
            (prisma.customer.findFirst as jest.Mock).mockResolvedValueOnce(null);

            const notFoundRes = await customerExportGET(
                new NextRequest('http://localhost/api/customers/export?id=cust-comp-b')
            );
            expect(notFoundRes.status).toBe(404);

            (prisma.customer.findFirst as jest.Mock).mockResolvedValueOnce({
                id: 'cust-a1',
                companyId: 'comp-a',
                name: '=CMD("calc")',
                mobile: '+94771234567',
                email: 'a@test.com',
                address: 'Colombo',
            });
            (prisma.booking.findMany as jest.Mock).mockResolvedValueOnce([]);
            (prisma.quotation.findMany as jest.Mock).mockResolvedValueOnce([]);

            const okRes = await customerExportGET(
                new NextRequest('http://localhost/api/customers/export?id=cust-a1')
            );
            expect(okRes.status).toBe(200);
            const csv = await okRes.text();
            expect(csv).toContain(`"'=CMD(""calc"")"`);
        });
    });

    describe('Phase 2: POST /api/chat & /api/transcribe & /api/driver/route & Cron', () => {
        it('blocks DRIVER role on /api/chat and restricts mutating tools on readOnly', async () => {
            (auth as jest.Mock).mockResolvedValueOnce({
                user: { id: 'drv-1', companyId: 'comp-a', role: 'DRIVER' },
            });
            const forbidden = await chatPOST(
                new Request('http://localhost/api/chat', {
                    method: 'POST',
                    body: JSON.stringify({ messages: [{ role: 'user', content: 'create bill' }] }),
                })
            );
            expect(forbidden.status).toBe(403);

            (auth as jest.Mock).mockResolvedValueOnce({
                user: { id: 'adm-1', companyId: 'comp-a', role: 'ADMIN' },
            });
            (streamText as jest.Mock).mockReturnValueOnce({
                toUIMessageStreamResponse: () => new Response('ok', { status: 200 }),
            });

            const res = await chatPOST(
                new Request('http://localhost/api/chat', {
                    method: 'POST',
                    body: JSON.stringify({
                        readOnly: true,
                        messages: [{ role: 'user', content: 'Show stats' }],
                    }),
                })
            );
            expect(res.status).toBe(200);
            const callArgs = (streamText as jest.Mock).mock.calls[0][0];
            expect(Object.keys(callArgs.tools)).not.toContain('createBill');
        });

        it('requires ADMIN/OWNER auth and upload validation on /api/transcribe', async () => {
            (auth as jest.Mock).mockResolvedValueOnce(null);
            const unauth = await transcribePOST(new Request('http://localhost/api/transcribe', { method: 'POST' }));
            expect(unauth.status).toBe(401);

            (auth as jest.Mock).mockResolvedValueOnce({
                user: { id: 'adm-1', companyId: 'comp-a', role: 'ADMIN' },
            });
            const badForm = new FormData();
            badForm.append('audio', new Blob(['<html>bad</html>'], { type: 'text/html' }));
            const badTypeRes = await transcribePOST(
                new Request('http://localhost/api/transcribe', { method: 'POST', body: badForm })
            );
            expect(badTypeRes.status).toBe(400);
        });

        it('requires auth on /api/driver/route and CRON_SECRET on /api/cron/reminders', async () => {
            (auth as jest.Mock).mockResolvedValue(null);
            const unauth = await driverRoutePOST(
                new Request('http://localhost/api/driver/route', {
                    method: 'POST',
                    body: JSON.stringify({ origin: 'Colombo', destination: 'Kandy' }),
                })
            );
            expect(unauth.status).toBe(401);
            expect(calculateRouteOSRM).not.toHaveBeenCalled();

            delete process.env.CRON_SECRET;
            const noEnv = await cronRemindersGET(new Request('http://localhost/api/cron/reminders'));
            expect(noEnv.status).toBe(500);

            (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([{ '?column?': 1 }]);
            const ka = await keepaliveGET();
            expect(ka.status).toBe(200);
        });

        it('rejects revoked driver JWTs when tokenVersion mismatches DB and enforces health/import/FX hardening', async () => {
            (auth as jest.Mock).mockResolvedValue(null);

            const revocableToken = jwt.sign(
                { id: 'drv-2', companyId: 'comp-1', role: 'DRIVER', tokenVersion: 1 },
                getJwtSecret(),
                { expiresIn: '7d' }
            );
            (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
                tokenVersion: 2,
                companyId: 'comp-1',
                role: 'DRIVER',
            });
            const revokedRes = await authenticateBearerOrSession(
                new Request('http://localhost/api/driver/location', {
                    headers: { authorization: `Bearer ${revocableToken}` },
                }),
                ['DRIVER']
            );
            expect(revokedRes).toMatchObject({ authenticated: false, status: 401 });

            expect(hashOpaqueToken('123456')).toHaveLength(64);
            expect(hashOpaqueToken('123456')).not.toBe('123456');
            expect(escapeCsvCell('=1+1')).toBe(`"'=1+1"`);

            // /api/v1/health strips PID & memory without DIAGNOSTIC_SECRET and blocks ?action=snapshot
            (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
            const healthPublic = await healthV1GET(new Request('http://localhost/api/v1/health'));
            const healthJson = (await healthPublic.json()) as Record<string, unknown>;
            expect(healthJson.memory).toBeUndefined();
            expect(healthJson.process).toBeUndefined();

            const snapDenied = await healthV1GET(
                new Request('http://localhost/api/v1/health?action=snapshot', {
                    headers: { 'x-diagnostic-secret': 'vigil-internal-profiler' },
                })
            );
            expect(snapDenied.status).toBe(403);

            // /api/exchange-rate rejects unauthenticated callers
            const fxUnauth = await exchangeRateGET(new NextRequest('http://localhost/api/exchange-rate'));
            expect(fxUnauth.status).toBe(401);

            // /api/chat defaults to Read-Only when allowMutations is absent
            (auth as jest.Mock).mockResolvedValueOnce({
                user: { id: 'adm-1', companyId: 'comp-a', role: 'ADMIN' },
            });
            (streamText as jest.Mock).mockReturnValueOnce({
                toUIMessageStreamResponse: () => new Response('ok', { status: 200 }),
            });
            await chatPOST(
                new Request('http://localhost/api/chat', {
                    method: 'POST',
                    body: JSON.stringify({ messages: [{ role: 'user', content: 'Add a vehicle' }] }),
                })
            );
            const defaultTools = Object.keys((streamText as jest.Mock).mock.calls[0][0].tools);
            expect(defaultTools).not.toContain('addVehicle');
            expect(defaultTools).not.toContain('createBill');

            // /api/company/import enforces remaining vehicle quota when enforcement is enabled
            process.env.ENABLE_SUBSCRIPTION_ENFORCEMENT = 'true';
            (authGuard.requireAdmin as jest.Mock).mockResolvedValueOnce({
                authorized: true,
                userId: 'adm-1',
                role: 'ADMIN',
                companyId: 'comp-starter',
            });
            (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
                tier: 'STARTER',
                status: 'ACTIVE',
                isLifetime: false,
                currentPeriodEnd: new Date(Date.now() + 86_400_000),
            });
            (prisma.vehicle.count as jest.Mock).mockResolvedValueOnce(9);
            (prisma.vehicle.findMany as jest.Mock).mockResolvedValueOnce(
                Array.from({ length: 9 }, (_, i) => ({ vehicleNo: `CAB-${i}` }))
            );
            const importOverflow = await companyImportPOST(
                new NextRequest('http://localhost/api/company/import', {
                    method: 'POST',
                    body: JSON.stringify({
                        companyId: 'comp-starter',
                        entityType: 'vehicles',
                        data: [
                            { vehicleNo: 'CAB-99' },
                            { vehicleNo: 'CAB-100' },
                        ],
                    }),
                })
            );
            expect(importOverflow.status).toBe(403);

            // Optional IP isolation on Bitgard Sync & Diagnostics while masking logged IPs
            expect(hashIpAddress('203.0.113.55')).toMatch(/^ip_[a-f0-9]{16}$/);
            expect(hashIpAddress('203.0.113.55')).not.toContain('203.0.113.55');

            const unconfiguredAllow = isAllowedSourceIp(
                new Request('http://localhost/api/test', { headers: { 'x-real-ip': '198.51.100.9' } }),
                undefined
            );
            expect(unconfiguredAllow).toBe(true);

            process.env.BITGARD_SYNC_ALLOWED_IPS = '203.0.113.10, 203.0.113.11';
            const blockedIpSync = await bitgardSyncPOST(
                new Request('http://localhost/api/bitgard/subscription-sync', {
                    method: 'POST',
                    headers: { 'x-real-ip': '198.51.100.9' },
                    body: '{}',
                })
            );
            expect(blockedIpSync.status).toBe(403);
        });
    });

    describe('AuditLog Coverage for Admin Delete & Vehicle Swap Actions', () => {
        it('records structured AuditLog entries for delete actions', async () => {
            (authGuard.requireAdmin as jest.Mock).mockResolvedValue({
                authorized: true,
                userId: 'adm-1',
                role: 'ADMIN',
                companyId: 'comp-a',
            });

            (prisma.vehicle.findFirst as jest.Mock).mockResolvedValueOnce({ vehicleNo: 'CAB-1234' });
            (prisma.vehicleExpense.count as jest.Mock).mockResolvedValueOnce(0);
            (prisma.bill.count as jest.Mock).mockResolvedValueOnce(0);
            (prisma.booking.count as jest.Mock).mockResolvedValueOnce(0);
            (prisma.quotation.count as jest.Mock).mockResolvedValueOnce(0);
            (prisma.tourSchedule.count as jest.Mock).mockResolvedValueOnce(0);
            (prisma.vehicle.deleteMany as jest.Mock).mockResolvedValueOnce({ count: 1 });
            expect(await deleteVehicle('veh-1')).toEqual({ success: true });
            expect(prisma.auditLog.create).toHaveBeenLastCalledWith({
                data: expect.objectContaining({
                    companyId: 'comp-a',
                    actorId: 'adm-1',
                    actorRole: 'ADMIN',
                    action: 'VEHICLE_DELETED',
                    resourceType: 'Vehicle',
                    resourceId: 'veh-1',
                    metadata: { vehicleNo: 'CAB-1234' },
                }),
            });

            (prisma.customer.findFirst as jest.Mock).mockResolvedValueOnce({ name: 'Nimal Perera' });
            (prisma.bill.count as jest.Mock).mockResolvedValueOnce(0);
            (prisma.booking.count as jest.Mock).mockResolvedValueOnce(0);
            (prisma.quotation.count as jest.Mock).mockResolvedValueOnce(0);
            (prisma.customer.deleteMany as jest.Mock).mockResolvedValueOnce({ count: 1 });
            expect(await deleteCustomer('cust-1')).toEqual({ success: true });
            expect(prisma.auditLog.create).toHaveBeenLastCalledWith({
                data: expect.objectContaining({
                    companyId: 'comp-a',
                    actorId: 'adm-1',
                    actorRole: 'ADMIN',
                    action: 'CUSTOMER_DELETED',
                    resourceType: 'Customer',
                    resourceId: 'cust-1',
                    metadata: { customerName: 'Nimal Perera' },
                }),
            });

            (prisma.quotation.deleteMany as jest.Mock).mockResolvedValueOnce({ count: 1 });
            expect(await deleteQuotation('quo-1')).toEqual({ success: true });
            expect(prisma.auditLog.create).toHaveBeenLastCalledWith({
                data: expect.objectContaining({
                    companyId: 'comp-a',
                    actorId: 'adm-1',
                    actorRole: 'ADMIN',
                    action: 'QUOTATION_DELETED',
                    resourceType: 'Quotation',
                    resourceId: 'quo-1',
                    metadata: { deletedCount: 1 },
                }),
            });

            (prisma.tourSchedule.updateMany as jest.Mock).mockResolvedValueOnce({ count: 1 });
            expect(await deleteTourSchedule('tour-1')).toEqual({ success: true });
            expect(prisma.auditLog.create).toHaveBeenLastCalledWith({
                data: expect.objectContaining({
                    companyId: 'comp-a',
                    actorId: 'adm-1',
                    actorRole: 'ADMIN',
                    action: 'TOUR_SCHEDULE_DELETED',
                    resourceType: 'TourSchedule',
                    resourceId: 'tour-1',
                    metadata: { softDelete: true, isActive: false },
                }),
            });

            (prisma.vehicleExpense.deleteMany as jest.Mock).mockResolvedValueOnce({ count: 1 });
            expect(await deleteVehicleExpense('exp-1')).toEqual({ success: true, data: true });
            expect(prisma.auditLog.create).toHaveBeenLastCalledWith({
                data: expect.objectContaining({
                    companyId: 'comp-a',
                    actorId: 'adm-1',
                    actorRole: 'ADMIN',
                    action: 'VEHICLE_EXPENSE_DELETED',
                    resourceType: 'VehicleExpense',
                    resourceId: 'exp-1',
                    metadata: { deletedCount: 1 },
                }),
            });
        });

        it('records AuditLog on swapBookingVehicle and skips AuditLog when mutation affects zero rows', async () => {
            (authGuard.requireAdmin as jest.Mock).mockResolvedValue({
                authorized: true,
                userId: 'adm-1',
                role: 'ADMIN',
                companyId: 'comp-a',
            });

            (prisma.quotation.deleteMany as jest.Mock).mockResolvedValueOnce({ count: 0 });
            const missingRes = await deleteQuotation('missing-id');
            expect(missingRes.success).toBe(false);
            expect(prisma.auditLog.create).not.toHaveBeenCalled();

            process.env.ENABLE_SUBSCRIPTION_ENFORCEMENT = 'false';
            (prisma.booking.findFirst as jest.Mock).mockResolvedValueOnce({
                id: 'book-1',
                companyId: 'comp-a',
                vehicleNo: 'CAB-1111',
                startDate: new Date('2026-12-01'),
                endDate: new Date('2026-12-03'),
                driverId: 'drv-1',
                driver: null,
            });
            (prisma.$transaction as jest.Mock).mockImplementationOnce(async (cb) =>
                cb({
                    booking: { update: jest.fn() },
                    vehicleSwapLog: { create: jest.fn() },
                    vehicleExpense: { create: jest.fn() },
                    vehicle: { findUnique: jest.fn().mockResolvedValue(null), update: jest.fn() },
                    tripActivity: { create: jest.fn() },
                })
            );

            const swapRes = await swapBookingVehicle('book-1', {
                swapType: 'EXTERNAL',
                newVehicleNo: 'EXT-9999',
                breakdownMeterReading: '10500',
                newVehicleStartMeter: '500',
                location: 'Kandy',
                reason: 'Alternator failure',
                supplierName: 'Lanka Cabs',
                hireCost: 15000,
            });
            expect(swapRes).toEqual({ success: true });
            expect(prisma.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    companyId: 'comp-a',
                    actorId: 'adm-1',
                    actorRole: 'ADMIN',
                    action: 'BOOKING_VEHICLE_SWAPPED',
                    resourceType: 'Booking',
                    resourceId: 'book-1',
                    metadata: expect.objectContaining({
                        previousVehicleNo: 'CAB-1111',
                        newVehicleNo: 'EXT-9999',
                        swapType: 'EXTERNAL',
                        reason: 'Alternator failure',
                        supplierName: 'Lanka Cabs',
                        hireCost: 15000,
                    }),
                }),
            });
        });
    });
});
