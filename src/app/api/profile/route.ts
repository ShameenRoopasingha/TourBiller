import { NextRequest, NextResponse } from 'next/server';
import { updateProfile } from '@/lib/profile-actions';

export async function PUT(req: NextRequest) {
    try {
        const result = await updateProfile(await req.formData());
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error updating profile:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}