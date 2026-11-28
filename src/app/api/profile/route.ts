import { NextRequest, NextResponse } from 'next/server';
import { updateProfile } from '@/lib/profile-actions';
import { enforceApiRateLimit } from '@/lib/api-rate-limit';

export async function PUT(req: NextRequest) {
    try {
        const rl = await enforceApiRateLimit(req, {
            prefix: 'profile-update',
            maxAttempts: 20,
            windowMs: 15 * 60 * 1000,
        });
        if (rl.limited) return rl.response;

        const result = await updateProfile(await req.formData());
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error updating profile:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}