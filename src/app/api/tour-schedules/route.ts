import { NextRequest, NextResponse } from 'next/server';
import { createTourSchedule } from '@/lib/tour-schedule-actions';

export async function POST(req: NextRequest) {
    try {
        const data = await req.json() as Parameters<typeof createTourSchedule>[0];
        const result = await createTourSchedule(data);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error creating tour schedule:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}