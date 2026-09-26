import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key-vigil';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
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

        const token = jwt.sign(
            { id: user.id, email: user.email, companyId: user.companyId, role: user.role },
            JWT_SECRET,
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
                    companyName: user.company.companyName
                }
            }
        });
    } catch (error) {
        console.error('Driver login error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
