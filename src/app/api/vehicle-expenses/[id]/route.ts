import { NextRequest, NextResponse } from 'next/server';
import { deleteVehicleExpense } from '@/lib/vehicle-expense-actions';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const result = await deleteVehicleExpense(id);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error deleting vehicle expense:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}