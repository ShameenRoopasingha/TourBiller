import { NextRequest, NextResponse } from 'next/server';
import { cancelBooking, getBookingById } from '@/lib/booking-actions';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const result = await getBookingById(id);
        return NextResponse.json(result, { status: result.success ? 200 : 404 });
    } catch (error) {
        console.error('API error fetching booking:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const result = await cancelBooking(id);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error cancelling booking:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}