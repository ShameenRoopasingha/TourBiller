import { NextRequest, NextResponse } from 'next/server';
import { checkDriverAvailability } from '@/lib/user-actions';

export async function GET(req: NextRequest) {
    const params = new URL(req.url).searchParams;
    const driverId = params.get('driverId');
    const startDate = params.get('startDate');
    const endDate = params.get('endDate');
    if (!driverId || !startDate || !endDate) {
        return NextResponse.json({ success: false, error: 'Driver and date range are required' }, { status: 400 });
    }

    const currentType = params.get('currentType');
    if (currentType && !['Booking', 'Quotation'].includes(currentType)) {
        return NextResponse.json({ success: false, error: 'Invalid record type' }, { status: 400 });
    }

    try {
        const result = await checkDriverAvailability(
            driverId,
            startDate,
            endDate,
            params.get('currentId') || undefined,
            currentType as 'Booking' | 'Quotation' | null || undefined,
        );
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error checking driver availability:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}