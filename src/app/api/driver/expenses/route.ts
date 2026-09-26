import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key-vigil';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        let decoded: any;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (e) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
        }

        const { id: driverId, companyId } = decoded;
        const body = await req.json();
        const { vehicleNo, amount, category, description, bookingId } = body;

        if (!vehicleNo || !amount || !category) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const expense = await prisma.vehicleExpense.create({
            data: {
                companyId,
                driverId,
                vehicleNo,
                amount: parseFloat(amount),
                category,
                description,
                bookingId
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
