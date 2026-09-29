import { NextRequest, NextResponse } from 'next/server';
import { deleteQuotation, updateQuotation, updateQuotationStatus } from '@/lib/quotation-actions';

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: RouteContext) {
    try {
        const { id } = await params;
        const formData = await req.formData();
        const tourScheduleId = formData.get('tourScheduleId');
        if (typeof tourScheduleId !== 'string' || !tourScheduleId) {
            return NextResponse.json({ success: false, error: 'Tour schedule is required' }, { status: 400 });
        }
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
        const body = await req.json() as { status?: string };
        if (!body.status) {
            return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });
        }
        const result = await updateQuotationStatus(id, body.status);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error updating quotation status:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}