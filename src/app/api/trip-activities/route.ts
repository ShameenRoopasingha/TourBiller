import { NextRequest, NextResponse } from 'next/server';
import { getTripActivities, logTripActivity } from '@/lib/trip-activity-actions';
import { TripActivityLogSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
    try {
        const bookingId = new URL(req.url).searchParams.get('bookingId');
        if (!bookingId) return NextResponse.json({ success: false, error: 'Booking ID is required' }, { status: 400 });
        const result = await getTripActivities(bookingId);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error fetching trip activities:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = TripActivityLogSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Booking ID and activity type are required' }, { status: 400 });
        }
        const { bookingId, type, note, expenseId } = parsed.data;
        const result = await logTripActivity(bookingId, type, note, expenseId);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error logging trip activity:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}