import { NextRequest, NextResponse } from 'next/server';
import { updatePassword } from '@/lib/profile-actions';
import { enforceApiRateLimit } from '@/lib/api-rate-limit';

export async function PUT(req: NextRequest) {
    try {
        const rl = await enforceApiRateLimit(req, {
            prefix: 'profile-password',
            maxAttempts: 10,
            windowMs: 15 * 60 * 1000,
        });
        if (rl.limited) return rl.response;

        const result = await updatePassword(await req.formData());
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error updating password:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}