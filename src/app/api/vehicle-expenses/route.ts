import { NextRequest, NextResponse } from 'next/server';
import { addVehicleExpense, getVehicleExpenses } from '@/lib/vehicle-expense-actions';
import { type VehicleExpenseFormData } from '@/lib/validations';

export async function GET(req: NextRequest) {
    try {
        const params = new URL(req.url).searchParams;
        const result = await getVehicleExpenses(params.get('vehicleNo') || undefined, params.get('bookingId') || undefined);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error fetching vehicle expenses:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const data = await req.json() as VehicleExpenseFormData;
        const result = await addVehicleExpense({
            ...data,
            date: data.date ? new Date(String(data.date)) : new Date(),
        });
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error adding vehicle expense:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}