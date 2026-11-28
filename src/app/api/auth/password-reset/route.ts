import { NextRequest, NextResponse } from 'next/server';
import { resetPassword, verifyResetToken, verifyResetOtp } from '@/lib/auth-actions';
import { enforceApiRateLimit } from '@/lib/api-rate-limit';

export async function GET(req: NextRequest) {
    const rl = await enforceApiRateLimit(req, {
        prefix: 'pwd-reset-verify',
        maxAttempts: 25,
        windowMs: 15 * 60 * 1000,
    });
    if (rl.limited) return rl.response;

    const token = req.nextUrl.searchParams.get('token') || '';
    const email = req.nextUrl.searchParams.get('email') || '';
    const otp = req.nextUrl.searchParams.get('otp') || '';

    let valid = false;
    if (token) {
        valid = await verifyResetToken(token);
    } else if (email && otp) {
        valid = await verifyResetOtp(email, otp);
    }

    return NextResponse.json({ success: true, valid, data: valid });
}

export async function POST(req: NextRequest) {
    try {
        const rl = await enforceApiRateLimit(req, {
            prefix: 'pwd-reset-confirm-ip',
            maxAttempts: 15,
            windowMs: 15 * 60 * 1000,
        });
        if (rl.limited) return rl.response;

        const result = await resetPassword(await req.formData());
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error resetting password:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}