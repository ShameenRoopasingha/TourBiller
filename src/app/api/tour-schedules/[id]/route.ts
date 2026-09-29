import { NextRequest, NextResponse } from 'next/server';
import { deleteTourSchedule, updateTourSchedule } from '@/lib/tour-schedule-actions';

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: RouteContext) {
    try {
        const { id } = await params;
        const data = await req.json() as Parameters<typeof updateTourSchedule>[1];
        const result = await updateTourSchedule(id, data);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error updating tour schedule:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
    try {
        const { id } = await params;
        const result = await deleteTourSchedule(id);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error) {
        console.error('API error deleting tour schedule:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}