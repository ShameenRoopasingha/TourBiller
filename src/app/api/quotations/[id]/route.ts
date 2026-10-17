import { NextRequest, NextResponse } from 'next/server';
import { deleteQuotation, updateQuotation, updateQuotationStatus } from '@/lib/quotation-actions';
import { QuotationStatusUpdateSchema } from '@/lib/validations';

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: RouteContext) {
    try {
        const { id } = await params;
        const formData = await req.formData();
        const rawScheduleId = formData.get('tourScheduleId');
        const tourScheduleId = (typeof rawScheduleId === 'string' && rawScheduleId && !rawScheduleId.startsWith('transfer-'))
            ? rawScheduleId
            : null;
        const result = await updateQuotation(id, tourScheduleId, formData);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error updating quotation:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
    try {
        const { id } = await params;
        const result = await deleteQuotation(id);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error deleting quotation:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
    try {
        const { id } = await params;
        const body = await req.json();
        const parsed = QuotationStatusUpdateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Status is required' }, { status: 400 });
        }
        const result = await updateQuotationStatus(id, parsed.data.status);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error updating quotation status:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}