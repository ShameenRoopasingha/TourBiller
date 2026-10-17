import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DriverLoginSchema } from '@/lib/validations';
import { getJwtSecret } from '@/lib/jwt';

export async function POST(req: Request) {
    console.log("REACHED /api/driver/login ROUTE!");
    try {
        const body = await req.json();
        const parsed = DriverLoginSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Email and password are required' }, { status: 400 });
        }
        const { email, password } = parsed.data;

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

        const token = jwt.sign(
            { id: user.id, email: user.email, companyId: user.companyId, role: user.role },
            getJwtSecret(),
            { expiresIn: '30d' }
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
                }
            }
        });
    } catch (error) {
        console.error('Driver login error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
