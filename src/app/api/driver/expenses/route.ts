import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DriverExpenseApiSchema } from '@/lib/validations';
import { authenticateBearerOrSession } from '@/lib/security';
import { checkTierFeature } from '@/lib/subscription';
import { enforceApiRateLimit } from '@/lib/api-rate-limit';

export async function POST(req: Request) {
    try {
        const authRes = await authenticateBearerOrSession(req, ['DRIVER', 'ADMIN', 'OWNER']);
        if (!authRes.authenticated) {
            return NextResponse.json({ success: false, error: authRes.error }, { status: authRes.status });
        }

        const rl = await enforceApiRateLimit(req, {
            prefix: 'driver-expenses',
            identifier: authRes.userId,
            maxAttempts: 60,
            windowMs: 60 * 1000,
        });
        if (rl.limited) return rl.response;

        const { userId: driverId, companyId } = authRes;
        const subCheck = await checkTierFeature(companyId, 'driverMobileSync');
        if (!subCheck.allowed) {
            return NextResponse.json(
                { success: false, code: subCheck.code, error: subCheck.error },
                { status: 403 }
            );
        }
        const body = await req.json();
        const parsed = DriverExpenseApiSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Missing required fields' }, { status: 400 });
        }

        const { vehicleNo, amount, category, description, bookingId, expenseType } = parsed.data;
        const normalizedVehicleNo = vehicleNo.trim().toUpperCase();

        const vehicleExists = await prisma.vehicle.findFirst({
            where: { companyId, vehicleNo: normalizedVehicleNo },
            select: { id: true },
        });
        if (!vehicleExists) {
            return NextResponse.json(
                { success: false, error: 'Vehicle not found for your company' },
                { status: 404 }
            );
        }

        if (bookingId) {
            const booking = await prisma.booking.findFirst({
                where: { id: bookingId, companyId },
                select: { id: true, driverId: true },
            });
            if (!booking || booking.driverId !== driverId) {
                return NextResponse.json(
                    { success: false, error: 'Booking not found or not assigned to this driver' },
                    { status: 403 }
                );
            }
        }

        const expense = await prisma.vehicleExpense.create({
            data: {
                companyId,
                driverId,
                vehicleNo: normalizedVehicleNo,
                amount,
                category,
                description,
                bookingId,
                expenseType: expenseType || 'COMPANY'
            }
        });

        // Optionally, if there is a bookingId, log a TripActivity as well
        if (bookingId) {
            await prisma.tripActivity.create({
                data: {
                    companyId,
                    bookingId,
                    driverId,
                    type: category === 'FUEL' ? 'FUEL_FILL' : (category === 'BREAKDOWN' ? 'BREAKDOWN' : 'NOTE'),
                    note: `Expense added: ${category} - Rs ${amount}${description ? ` (${description})` : ''}`,
                }
            });
        }

        return NextResponse.json({ success: true, data: expense });

    } catch (error) {
        console.error('Add expense error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
