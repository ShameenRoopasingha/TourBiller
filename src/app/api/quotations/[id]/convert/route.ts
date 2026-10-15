import { NextRequest, NextResponse } from 'next/server';
import { convertQuotationToBooking } from '@/lib/quotation-actions';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        let driverId: string | undefined = undefined;
        try {
            const body = await req.json();
            if (body && typeof body === 'object') {
                driverId = body.driverId;
            }
        } catch {
            // Body is optional (e.g. empty POST)
        }
        const result = await convertQuotationToBooking(id, driverId);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error converting quotation:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}