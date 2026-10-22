import { NextRequest, NextResponse } from 'next/server';
import { resetPassword, verifyResetToken, verifyResetOtp } from '@/lib/auth-actions';

export async function GET(req: NextRequest) {
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
        const result = await resetPassword(await req.formData());
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error resetting password:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}