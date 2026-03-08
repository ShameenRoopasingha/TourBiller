import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Keepalive endpoint — performs a lightweight DB query to prevent
 * Supabase free-tier from pausing after 7 days of inactivity.
 * 
 * Set up an external cron service (e.g. cron-job.org) to call
 * GET /api/keepalive every 3–5 days.
 */
export async function GET() {
    try {
        // Lightweight query — just count one table
        const count = await prisma.vehicle.count();
        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            vehicles: count,
        });
    } catch (error) {
        console.error('Keepalive ping failed:', error);
        return NextResponse.json(
            { status: 'error', message: 'Database ping failed' },
            { status: 500 }
        );
    }
}
