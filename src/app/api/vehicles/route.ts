import { NextRequest, NextResponse } from 'next/server';
import { createVehicle, getVehicles } from '@/lib/vehicle-actions';
import { formatApiErrorResponse } from '@/lib/error-handler';

export async function GET(req: NextRequest) {
    try {
        const searchQuery = new URL(req.url).searchParams.get('q') || undefined;
        const result = await getVehicles(searchQuery);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        return formatApiErrorResponse(error, 'Error fetching vehicles');
    }
}

export async function POST(req: NextRequest) {
    try {
        let formData: FormData;
        try {
            formData = await req.formData();
        } catch {
            return NextResponse.json({ success: false, error: 'Invalid form data payload' }, { status: 400 });
        }
        const result = await createVehicle(formData);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        return formatApiErrorResponse(error, 'Error creating vehicle');
    }
}