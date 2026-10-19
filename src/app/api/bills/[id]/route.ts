import { NextRequest, NextResponse } from 'next/server';
import { deleteBill, updateBill } from '@/lib/actions';
import { formatApiErrorResponse } from '@/lib/error-handler';

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: RouteContext) {
    try {
        const { id } = await params;
        let formData: FormData;
        try {
            formData = await req.formData();
        } catch {
            return NextResponse.json({ success: false, error: 'Invalid form data payload' }, { status: 400 });
        }
        const result = await updateBill(id, formData);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        return formatApiErrorResponse(error, 'Error updating bill');
    }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
    try {
        const { id } = await params;
        const result = await deleteBill(id);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        return formatApiErrorResponse(error, 'Error deleting bill');
    }
}