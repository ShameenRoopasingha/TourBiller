import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { checkDistributedRateLimit } from '@/lib/rate-limit';
import { getClientIp, hashIpAddress } from '@/lib/crypto-utils';
import { registerOrSwitchWorkstation } from '@/lib/workstations';
import { recordAuditLog } from '@/lib/audit';

const checkSchema = z.object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(200),
    deviceId: z.string().trim().min(8).max(120),
    deviceLabel: z.string().trim().max(120).optional().default('Workstation Browser'),
    platform: z.string().trim().max(80).optional(),
    deactivateWorkstationId: z.string().trim().max(120).optional(),
});

export async function POST(request: Request) {
    try {
        const clientIp = getClientIp(request);
        const ipRl = await checkDistributedRateLimit(`ws-check-ip:${clientIp}`, 60, 15 * 60 * 1000);
        if (ipRl.limited) {
            return NextResponse.json(
                { allowed: false, error: 'Too many login attempts. Please try again later.' },
                { status: 429 }
            );
        }

        const rawJson = await request.json().catch(() => null);
        const parsed = checkSchema.safeParse(rawJson);
        if (!parsed.success) {
            return NextResponse.json(
                { allowed: false, error: parsed.error.issues[0]?.message || 'Invalid login request.' },
                { status: 400 }
            );
        }

        const email = parsed.data.email.toLowerCase();
        const emailRl = await checkDistributedRateLimit(`ws-check:${email}`, 30, 15 * 60 * 1000);
        if (emailRl.limited) {
            return NextResponse.json(
                { allowed: false, error: 'Too many login attempts for this email. Please wait 15 minutes.' },
                { status: 429 }
            );
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return NextResponse.json(
                { allowed: false, error: 'Invalid email or password. Please verify your credentials.' },
                { status: 401 }
            );
        }

        const validPassword = await bcrypt.compare(parsed.data.password, user.password);
        if (!validPassword) {
            return NextResponse.json(
                { allowed: false, error: 'Invalid email or password. Please verify your credentials.' },
                { status: 401 }
            );
        }

        const userAgent = request.headers.get('user-agent');
        const result = await registerOrSwitchWorkstation({
            companyId: user.companyId,
            userId: user.id,
            role: user.role,
            deviceId: parsed.data.deviceId,
            deviceLabel: parsed.data.deviceLabel,
            platform: parsed.data.platform,
            userAgent,
            deactivateWorkstationId: parsed.data.deactivateWorkstationId,
        });

        if (!result.allowed) {
            return NextResponse.json(result, { status: 409 });
        }

        if (result.switchedFromId) {
            await recordAuditLog({
                companyId: user.companyId,
                actorId: user.id,
                actorRole: user.role,
                action: 'WORKSTATION_SWITCH_DEACTIVATE',
                resourceType: 'ActiveWorkstation',
                resourceId: result.workstationId,
                ipAddress: hashIpAddress(clientIp),
                metadata: {
                    deactivatedWorkstationId: result.switchedFromId,
                    newDeviceLabel: parsed.data.deviceLabel,
                },
            });
        }

        return NextResponse.json({
            allowed: true,
            workstationId: result.workstationId,
            maxWorkstations: result.maxWorkstations,
            planLabel: result.planLabel,
        });
    } catch (error) {
        console.error('Workstation check error:', error);
        return NextResponse.json(
            { allowed: false, error: 'Unable to verify workstation seat limit.' },
            { status: 500 }
        );
    }
}
