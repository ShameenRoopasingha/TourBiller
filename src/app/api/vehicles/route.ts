import { NextRequest, NextResponse } from 'next/server';
import { createVehicle, getVehicles } from '@/lib/vehicle-actions';

export async function GET(req: NextRequest) {
    try {
        const searchQuery = new URL(req.url).searchParams.get('q') || undefined;
        const result = await getVehicles(searchQuery);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error fetching vehicles:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const result = await createVehicle(formData);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error creating vehicle:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}