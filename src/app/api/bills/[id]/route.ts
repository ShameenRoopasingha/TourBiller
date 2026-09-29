import { NextRequest, NextResponse } from 'next/server';
import { deleteBill, updateBill } from '@/lib/actions';

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: RouteContext) {
    try {
        const { id } = await params;
        const result = await updateBill(id, await req.formData());
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error updating bill:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
    try {
        const { id } = await params;
        const result = await deleteBill(id);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error deleting bill:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}