import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import QRCode from 'qrcode';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';
import { enforceApiRateLimit } from '@/lib/api-rate-limit';
import {
    buildOtpAuthUri,
    decryptMfaSecret,
    encryptMfaSecret,
    generateBackupCodes,
    generateTotpSecret,
    verifyMfaChallengeAgainstUser,
    verifyTotpCode,
} from '@/lib/mfa';
import { recordAuditLog } from '@/lib/audit';
import { getClientIp, hashIpAddress } from '@/lib/security';

const beginOrEnableSchema = z.discriminatedUnion('action', [
    z.object({
        action: z.literal('begin'),
    }),
    z.object({
        action: z.literal('enable'),
        code: z.string().trim().min(6).max(16),
    }),
    z.object({
        action: z.literal('regenerate'),
        currentPassword: z.string().min(1).max(200),
        code: z.string().trim().min(6).max(32),
    }),
]);

const disableSchema = z.object({
    currentPassword: z.string().min(1).max(200),
    code: z.string().trim().min(6).max(32),
});

export async function GET(req: Request) {
    const authCheck = await requireAuth();
    if (!authCheck.authorized) {
        return NextResponse.json({ success: false, error: authCheck.error }, { status: 401 });
    }

    const rl = await enforceApiRateLimit(req, {
        prefix: 'vigil-mfa-status',
        identifier: authCheck.userId,
        maxAttempts: 30,
        windowMs: 15 * 60 * 1000,
    });
    if (rl.limited) return rl.response;

    const user = await prisma.user.findUnique({
        where: { id: authCheck.userId },
        select: {
            mfaEnabled: true,
            mfaBackupCodes: true,
        },
    });

    if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(
        {
            success: true,
            mfaEnabled: user.mfaEnabled,
            backupCodesRemaining: user.mfaBackupCodes?.length ?? 0,
        },
        { headers: { 'Cache-Control': 'no-store' } }
    );
}

export async function POST(req: Request) {
    const authCheck = await requireAuth();
    if (!authCheck.authorized) {
        return NextResponse.json({ success: false, error: authCheck.error }, { status: 401 });
    }

    const rl = await enforceApiRateLimit(req, {
        prefix: 'vigil-mfa-setup',
        identifier: authCheck.userId,
        maxAttempts: 15,
        windowMs: 15 * 60 * 1000,
    });
    if (rl.limited) return rl.response;

    const body = await req.json().catch(() => null);
    const parsed = beginOrEnableSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { success: false, error: parsed.error.issues[0]?.message || 'Invalid MFA request' },
            { status: 400 }
        );
    }

    const user = await prisma.user.findUnique({
        where: { id: authCheck.userId },
        select: {
            id: true,
            email: true,
            password: true,
            companyId: true,
            role: true,
            mfaEnabled: true,
            mfaSecret: true,
            mfaPendingSecret: true,
            mfaBackupCodes: true,
        },
    });

    if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (parsed.data.action === 'begin') {
        const plainSecret = generateTotpSecret();
        const encryptedPending = encryptMfaSecret(plainSecret);
        const otpauthUri = buildOtpAuthUri({
            issuer: 'Vigil Tour Management',
            accountEmail: user.email,
            secret: plainSecret,
        });
        const qrDataUrl = await QRCode.toDataURL(otpauthUri, {
            width: 220,
            margin: 1,
            color: { dark: '#0f172a', light: '#ffffff' },
        });

        await prisma.user.update({
            where: { id: user.id },
            data: { mfaPendingSecret: encryptedPending },
        });

        return NextResponse.json(
            {
                success: true,
                manualSecret: plainSecret,
                otpauthUri,
                qrDataUrl,
            },
            { headers: { 'Cache-Control': 'no-store' } }
        );
    }

    if (parsed.data.action === 'enable') {
        if (!user.mfaPendingSecret) {
            return NextResponse.json(
                { success: false, error: 'No pending authenticator setup found. Start setup first.' },
                { status: 400 }
            );
        }

        let plainSecret: string;
        try {
            plainSecret = decryptMfaSecret(user.mfaPendingSecret);
        } catch {
            return NextResponse.json(
                { success: false, error: 'Pending MFA secret expired or invalid. Please restart setup.' },
                { status: 400 }
            );
        }

        if (!verifyTotpCode(plainSecret, parsed.data.code)) {
            return NextResponse.json(
                { success: false, error: 'Invalid 6-digit authenticator code. Please try again.' },
                { status: 400 }
            );
        }

        const { plainCodes, hashedCodes } = generateBackupCodes(8);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                mfaEnabled: true,
                mfaSecret: user.mfaPendingSecret,
                mfaPendingSecret: null,
                mfaBackupCodes: hashedCodes,
            },
        });

        await recordAuditLog({
            companyId: user.companyId,
            actorId: user.id,
            actorRole: user.role,
            action: 'MFA_ENABLED',
            resourceType: 'User',
            resourceId: user.id,
            ipAddress: hashIpAddress(getClientIp(req)),
        });

        return NextResponse.json(
            {
                success: true,
                mfaEnabled: true,
                backupCodes: plainCodes,
            },
            { headers: { 'Cache-Control': 'no-store' } }
        );
    }

    // action === 'regenerate'
    if (!user.mfaEnabled || !user.mfaSecret) {
        return NextResponse.json(
            { success: false, error: 'Two-factor authentication is not enabled.' },
            { status: 400 }
        );
    }

    const passwordOk = await bcrypt.compare(parsed.data.currentPassword, user.password);
    if (!passwordOk) {
        return NextResponse.json({ success: false, error: 'Incorrect current password.' }, { status: 401 });
    }

    const mfaRes = verifyMfaChallengeAgainstUser({
        encryptedSecret: user.mfaSecret,
        backupHashes: [],
        code: parsed.data.code,
    });
    if (!mfaRes.valid) {
        return NextResponse.json(
            { success: false, error: 'Invalid 6-digit authenticator code.' },
            { status: 401 }
        );
    }

    const { plainCodes, hashedCodes } = generateBackupCodes(8);
    await prisma.user.update({
        where: { id: user.id },
        data: { mfaBackupCodes: hashedCodes },
    });

    await recordAuditLog({
        companyId: user.companyId,
        actorId: user.id,
        actorRole: user.role,
        action: 'MFA_BACKUP_CODES_REGENERATED',
        resourceType: 'User',
        resourceId: user.id,
        ipAddress: hashIpAddress(getClientIp(req)),
    });

    return NextResponse.json(
        {
            success: true,
            backupCodes: plainCodes,
        },
        { headers: { 'Cache-Control': 'no-store' } }
    );
}

export async function DELETE(req: Request) {
    const authCheck = await requireAuth();
    if (!authCheck.authorized) {
        return NextResponse.json({ success: false, error: authCheck.error }, { status: 401 });
    }

    const rl = await enforceApiRateLimit(req, {
        prefix: 'vigil-mfa-disable',
        identifier: authCheck.userId,
        maxAttempts: 10,
        windowMs: 15 * 60 * 1000,
    });
    if (rl.limited) return rl.response;

    const body = await req.json().catch(() => null);
    const parsed = disableSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { success: false, error: parsed.error.issues[0]?.message || 'Password and authenticator code are required.' },
            { status: 400 }
        );
    }

    const user = await prisma.user.findUnique({
        where: { id: authCheck.userId },
        select: {
            id: true,
            password: true,
            companyId: true,
            role: true,
            mfaEnabled: true,
            mfaSecret: true,
            mfaBackupCodes: true,
        },
    });

    if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const passwordOk = await bcrypt.compare(parsed.data.currentPassword, user.password);
    if (!passwordOk) {
        return NextResponse.json({ success: false, error: 'Incorrect current password.' }, { status: 401 });
    }

    if (user.mfaEnabled) {
        const mfaRes = verifyMfaChallengeAgainstUser({
            encryptedSecret: user.mfaSecret,
            backupHashes: user.mfaBackupCodes || [],
            code: parsed.data.code,
        });
        if (!mfaRes.valid) {
            return NextResponse.json(
                { success: false, error: 'Invalid authenticator or backup code.' },
                { status: 401 }
            );
        }
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            mfaEnabled: false,
            mfaSecret: null,
            mfaPendingSecret: null,
            mfaBackupCodes: [],
        },
    });

    await recordAuditLog({
        companyId: user.companyId,
        actorId: user.id,
        actorRole: user.role,
        action: 'MFA_DISABLED',
        resourceType: 'User',
        resourceId: user.id,
        ipAddress: hashIpAddress(getClientIp(req)),
    });

    return NextResponse.json({ success: true, mfaEnabled: false });
}
