import { NextRequest, NextResponse } from 'next/server';
import { generateQuotation } from '@/lib/quotation-actions';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const rawScheduleId = formData.get('tourScheduleId');
        const tourScheduleId = (typeof rawScheduleId === 'string' && rawScheduleId && !rawScheduleId.startsWith('transfer-'))
            ? rawScheduleId
            : null;
        const result = await generateQuotation(tourScheduleId, formData);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error creating quotation:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}