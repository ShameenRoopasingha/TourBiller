import { NextRequest, NextResponse } from 'next/server';
import { createBooking } from '@/lib/booking-actions';
import { formatApiErrorResponse } from '@/lib/error-handler';

export async function POST(req: NextRequest) {
    try {
        let formData: FormData;
        try {
            formData = await req.formData();
        } catch {
            return NextResponse.json({ success: false, error: 'Invalid form data payload' }, { status: 400 });
        }
        const result = await createBooking(formData);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        return formatApiErrorResponse(error, 'Error creating booking');
    }
}
