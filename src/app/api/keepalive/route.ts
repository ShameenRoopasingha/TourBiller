import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Keepalive endpoint — performs a lightweight DB ping to prevent
 * Supabase free-tier from pausing after 7 days of inactivity.
 *
 * Set up an external cron service (e.g. cron-job.org or Vercel Cron)
 * to call GET /api/keepalive every 3–5 days.
 */
export async function GET() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Keepalive ping failed:', error);
        return NextResponse.json(
            { status: 'error', message: 'Database ping failed' },
            { status: 500 }
        );
    }
}
