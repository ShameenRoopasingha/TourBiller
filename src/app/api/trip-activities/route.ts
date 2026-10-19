import { NextRequest, NextResponse } from 'next/server';
import { getTripActivities, logTripActivity } from '@/lib/trip-activity-actions';
import { TripActivityLogSchema } from '@/lib/validations';
import { formatApiErrorResponse } from '@/lib/error-handler';

export async function GET(req: NextRequest) {
    try {
        const bookingId = new URL(req.url).searchParams.get('bookingId');
        if (!bookingId) return NextResponse.json({ success: false, error: 'Booking ID is required' }, { status: 400 });
        const result = await getTripActivities(bookingId);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        return formatApiErrorResponse(error, 'Error fetching trip activities');
    }
}

export async function POST(req: NextRequest) {
    try {
        let body: any;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ success: false, error: 'Invalid JSON request payload' }, { status: 400 });
        }
        const parsed = TripActivityLogSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Booking ID and activity type are required' }, { status: 400 });
        }
        const { bookingId, type, note, expenseId } = parsed.data;
        const result = await logTripActivity(bookingId, type, note, expenseId);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        return formatApiErrorResponse(error, 'Error logging trip activity');
    }
}