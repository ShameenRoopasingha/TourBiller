import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordReset } from '@/lib/auth-actions';
import { enforceApiRateLimit } from '@/lib/api-rate-limit';

export async function POST(req: NextRequest) {
    try {
        const rl = await enforceApiRateLimit(req, {
            prefix: 'pwd-reset-request-ip',
            maxAttempts: 15,
            windowMs: 15 * 60 * 1000,
        });
        if (rl.limited) return rl.response;

        const result = await requestPasswordReset(await req.formData());
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error requesting password reset:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}