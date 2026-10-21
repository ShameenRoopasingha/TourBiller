import { NextRequest, NextResponse } from 'next/server';
import { cancelBooking, getBookingById, updateBookingDates } from '@/lib/booking-actions';
import { formatApiErrorResponse } from '@/lib/error-handler';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const result = await getBookingById(id);
        return NextResponse.json(result, { status: result.success ? 200 : 404 });
    } catch (error) {
        return formatApiErrorResponse(error, 'Error fetching booking');
    }
}

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const result = await cancelBooking(id);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        return formatApiErrorResponse(error, 'Error cancelling booking');
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const result = await updateBookingDates(id, body);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        return formatApiErrorResponse(error, 'Error updating tour dates');
    }
}
