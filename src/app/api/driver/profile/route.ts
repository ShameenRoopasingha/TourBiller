import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { auth } from '@/lib/auth';
import { getJwtSecret } from '@/lib/jwt';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const DriverProfileUpdateSchema = z.object({
    name: z.string().trim().min(1, 'Name cannot be empty').optional(),
    avatarUrl: z.string().optional().nullable(),
    email: z.string().email('Invalid email address format').optional().or(z.literal('')),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, 'New password must be at least 6 characters long').optional(),
});

async function authenticateDriver(req: Request) {
    let driverId: string | null = null;
    let companyId: string | null = null;

    // 1. Bearer Token check (Mobile App)
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, getJwtSecret()) as any;
            if (decoded?.role === 'DRIVER' && decoded?.id) {
                driverId = decoded.id;
                companyId = decoded.companyId;
            }
        } catch {
            // Invalid token
        }
    }

    // 2. NextAuth Session check (Web Portal)
    if (!driverId) {
        try {
            const session = await auth();
            const user = session?.user as { id?: string; role?: string; companyId?: string } | undefined;
            if (user?.id && user?.role === 'DRIVER') {
                driverId = user.id;
                companyId = user.companyId || null;
            }
        } catch {
            // Session error
        }
    }

    return { driverId, companyId };
}

// GET: Fetch current driver's profile information
export async function GET(req: Request) {
    try {
        const { driverId } = await authenticateDriver(req);
        if (!driverId) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Driver access required' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: driverId },
            include: { company: true },
        });

        if (!user || user.role !== 'DRIVER') {
            return NextResponse.json({ success: false, error: 'Driver profile not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl || null,
                role: user.role,
                companyId: user.company?.id || user.companyId,
                companyName: user.company?.companyName || 'Tour Transport Company',
                companyLogoUrl: user.company?.logoUrl || null,
            },
        });
    } catch (error) {
        console.error('Fetch driver profile error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// PUT: Update driver's email and/or password
export async function PUT(req: Request) {
    try {
        const { driverId } = await authenticateDriver(req);
        if (!driverId) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Driver access required' }, { status: 401 });
        }

        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';
        const { limited, retryAfterMs } = rateLimit(`driver-profile-update:${driverId}:${ip}`, 15, 15 * 60 * 1000);
        if (limited) {
            const retryMinutes = Math.ceil(retryAfterMs / 60000);
            return NextResponse.json(
                { success: false, error: `Too many profile update requests. Please wait ${retryMinutes} minute(s).` },
                { status: 429 }
            );
        }

        const body = await req.json();
        const parsed = DriverProfileUpdateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ 
                success: false, 
                error: parsed.error.issues[0]?.message || 'Invalid input data' 
            }, { status: 400 });
        }

        const { name, avatarUrl, email, currentPassword, newPassword } = parsed.data;

        const driver = await prisma.user.findUnique({
            where: { id: driverId },
            include: { company: true }
        });

        if (!driver || driver.role !== 'DRIVER') {
            return NextResponse.json({ success: false, error: 'Driver not found' }, { status: 404 });
        }

        const updateData: { name?: string; avatarUrl?: string | null; email?: string; password?: string } = {};

        // 1. Name update
        if (name && name.trim() && name.trim() !== driver.name) {
            updateData.name = name.trim();
        }

        // 2. Avatar / Profile Picture update
        if (avatarUrl !== undefined && avatarUrl !== driver.avatarUrl) {
            updateData.avatarUrl = avatarUrl;
        }

        // 3. Email update validation
        const normalizedEmail = email?.trim().toLowerCase();
        if (normalizedEmail && normalizedEmail !== driver.email.toLowerCase()) {
            const existingEmailUser = await prisma.user.findUnique({
                where: { email: normalizedEmail },
            });

            if (existingEmailUser && existingEmailUser.id !== driver.id) {
                return NextResponse.json(
                    { success: false, error: 'This email address is already in use by another user' },
                    { status: 409 }
                );
            }

            updateData.email = normalizedEmail;
        }

        // 4. Password change validation
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json(
                    { success: false, error: 'Current password is required to change your password' },
                    { status: 400 }
                );
            }

            const isPasswordValid = await bcrypt.compare(currentPassword, driver.password);
            if (!isPasswordValid) {
                return NextResponse.json(
                    { success: false, error: 'The current password you entered is incorrect' },
                    { status: 400 }
                );
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updateData.password = hashedPassword;
        }

        // If no changes provided
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No changes were requested',
                data: {
                    driver: {
                        id: driver.id,
                        name: driver.name,
                        email: driver.email,
                        avatarUrl: driver.avatarUrl || null,
                        companyId: driver.company?.id || driver.companyId,
                        companyName: driver.company?.companyName || 'Tour Transport Company',
                        companyLogoUrl: driver.company?.logoUrl || null,
                    }
                }
            });
        }

        // Update database record
        const updatedDriver = await prisma.user.update({
            where: { id: driverId },
            data: updateData,
            include: { company: true }
        });

        // Issue fresh token if email changed or generally to refresh
        const token = jwt.sign(
            { id: updatedDriver.id, email: updatedDriver.email, companyId: updatedDriver.companyId, role: updatedDriver.role },
            getJwtSecret(),
            { expiresIn: '30d' }
        );

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                token,
                driver: {
                    id: updatedDriver.id,
                    name: updatedDriver.name,
                    email: updatedDriver.email,
                    avatarUrl: updatedDriver.avatarUrl || null,
                    companyId: updatedDriver.company?.id || updatedDriver.companyId,
                    companyName: updatedDriver.company?.companyName || 'Tour Transport Company',
                    companyLogoUrl: updatedDriver.company?.logoUrl || null,
                }
            }
        });
    } catch (error) {
        console.error('Update driver profile error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
