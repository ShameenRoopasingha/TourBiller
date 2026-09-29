import { NextRequest, NextResponse } from 'next/server';
import { checkVehicleAvailability } from '@/lib/vehicle-actions';

export async function GET(req: NextRequest) {
    const params = new URL(req.url).searchParams;
    const vehicleNo = params.get('vehicleNo');
    const startDate = params.get('startDate');
    const endDate = params.get('endDate');
    if (!vehicleNo || !startDate || !endDate) {
        return NextResponse.json({ success: false, error: 'Vehicle and date range are required' }, { status: 400 });
    }

    const currentType = params.get('currentType');
    if (currentType && !['Bill', 'Booking', 'Quotation'].includes(currentType)) {
        return NextResponse.json({ success: false, error: 'Invalid record type' }, { status: 400 });
    }

    try {
        const result = await checkVehicleAvailability(
            vehicleNo,
            startDate,
            endDate,
            params.get('currentId') || undefined,
            currentType as 'Bill' | 'Booking' | 'Quotation' | null || undefined,
        );
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error checking vehicle availability:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}