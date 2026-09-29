import { NextRequest, NextResponse } from 'next/server';
import { convertQuotationToBooking } from '@/lib/quotation-actions';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const result = await convertQuotationToBooking(id);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error converting quotation:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}