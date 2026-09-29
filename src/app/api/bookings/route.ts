import { NextRequest, NextResponse } from 'next/server';
import { createBooking } from '@/lib/booking-actions';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const result = await createBooking(formData);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error creating booking:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
