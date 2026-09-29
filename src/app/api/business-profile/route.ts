import { NextRequest, NextResponse } from 'next/server';
import { updateBusinessProfile } from '@/lib/actions';

export async function PUT(req: NextRequest) {
    try {
        const result = await updateBusinessProfile(await req.formData());
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error updating business profile:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}