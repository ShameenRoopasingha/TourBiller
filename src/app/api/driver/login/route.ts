import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DriverLoginSchema } from '@/lib/validations';
import { getJwtSecret } from '@/lib/jwt';
import { checkDistributedRateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/security';
import { checkTierFeature } from '@/lib/subscription';

export async function POST(req: Request) {
    console.log("REACHED /api/driver/login ROUTE!");
    try {
        const body = await req.json();
        const parsed = DriverLoginSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Email and password are required' }, { status: 400 });
        }
        const { email, password } = parsed.data;

        // Rate limit: 10 attempts per email/IP per 15 minutes to prevent Bcrypt CPU exhaustion
        const ip = getClientIp(req);
        const { limited, retryAfterMs } = await checkDistributedRateLimit(`driver-login:${email}:${ip}`, 10, 15 * 60 * 1000);
        if (limited) {
            const retryMinutes = Math.ceil(retryAfterMs / 60000);
            return NextResponse.json(
                { success: false, error: `Too many login attempts. Please try again in ${retryMinutes} minute(s).` },
                { status: 429 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { company: true }
        });

        if (!user || user.role !== 'DRIVER') {
            return NextResponse.json({ success: false, error: 'Invalid credentials or not a driver' }, { status: 401 });
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
        }

        const subCheck = await checkTierFeature(user.companyId, 'driverMobileSync');
        if (!subCheck.allowed) {
            return NextResponse.json(
                { success: false, code: subCheck.code, error: subCheck.error },
                { status: 403 }
            );
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                companyId: user.companyId,
                role: user.role,
                tokenVersion: user.tokenVersion ?? 0,
            },
            getJwtSecret(),
            { expiresIn: '7d' }
        );

        return NextResponse.json({
            success: true,
            data: {
                token,
                driver: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    companyId: user.company?.id,
                    companyName: user.company?.companyName || 'Transport Company',
                    companyLogoUrl: user.company?.logoUrl || null,
                    avatarUrl: user.avatarUrl || null,
                }
            }
        });
    } catch (error) {
        console.error('Driver login error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
