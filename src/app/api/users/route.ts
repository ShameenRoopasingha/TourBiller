import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUsers } from '@/lib/user-actions';

export async function GET() {
    try {
        const result = await getUsers();
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error fetching users:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const result = await createUser(await req.formData());
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error creating user:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}