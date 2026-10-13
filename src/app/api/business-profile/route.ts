import { NextRequest, NextResponse } from 'next/server';
import { getBusinessProfile, updateBusinessProfile, configureInitialCurrency } from '@/lib/actions';

export async function GET() {
    try {
        const result = await getBusinessProfile();
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error fetching business profile:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { currency, usdRate } = body;
        const result = await configureInitialCurrency(currency, usdRate);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error configuring initial currency:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const result = await updateBusinessProfile(await req.formData());
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error updating business profile:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}