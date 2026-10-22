import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import v8 from 'v8';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

// High-throughput health cache: cache DB health status for 2 seconds
// Prevents high-frequency load testing / ALB probes from saturating DB connections
let lastDbCheck = 0;
let cachedDbStatus = 'healthy';
let cachedDbLatency = 0;
const DB_HEALTH_CACHE_MS = 2000;

export async function GET(request: Request) {
    const startTime = Date.now();
    const mem = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();
    const heapUsedMb = Number((mem.heapUsed / (1024 * 1024)).toFixed(2));
    const heapTotalMb = Number((mem.heapTotal / (1024 * 1024)).toFixed(2));
    const rssMb = Number((mem.rss / (1024 * 1024)).toFixed(2));
    const externalMb = Number((mem.external / (1024 * 1024)).toFixed(2));
    const heapUsageRatio = heapStats.heap_size_limit > 0 ? mem.heapUsed / heapStats.heap_size_limit : 0;
    const isUnderMemoryPressure = heapUsageRatio > 0.85;

    // Check query params for heap snapshot action
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    let heapSnapshotFile: string | null = null;
    if (action === 'snapshot') {
        const isDev = process.env.NODE_ENV !== 'production';
        const secretHeader = request.headers.get('x-diagnostic-secret');
        const configuredSecret = process.env.DIAGNOSTIC_SECRET || 'vigil-internal-profiler';

        if (isDev || secretHeader === configuredSecret) {
            try {
                const dumpDir = path.join(process.cwd(), 'diagnostics');
                if (!fs.existsSync(dumpDir)) {
                    fs.mkdirSync(dumpDir, { recursive: true });
                }
                const filename = `heap-${Date.now()}.heapsnapshot`;
                const fullPath = path.join(dumpDir, filename);
                v8.writeHeapSnapshot(fullPath);
                heapSnapshotFile = fullPath;
            } catch (snapError) {
                console.error('[Health] Failed to write heap snapshot:', snapError);
            }
        }
    }

    // High-concurrency debounced DB ping
    const now = Date.now();
    if (now - lastDbCheck > DB_HEALTH_CACHE_MS) {
        try {
            const dbStart = Date.now();
            await prisma.$queryRaw`SELECT 1`;
            cachedDbLatency = Date.now() - dbStart;
            cachedDbStatus = 'healthy';
            lastDbCheck = now;
        } catch {
            cachedDbStatus = 'degraded';
            cachedDbLatency = 0;
        }
    }

    const payload = {
        status: isUnderMemoryPressure || cachedDbStatus !== 'healthy' ? 'degraded' : 'healthy',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        telemetry: {
            latencyMs: Date.now() - startTime,
            dbLatencyMs: cachedDbLatency,
            dbStatus: cachedDbStatus,
        },
        memory: {
            rssMb,
            heapTotalMb,
            heapUsedMb,
            externalMb,
            heapUsagePercent: Number((heapUsageRatio * 100).toFixed(1)),
            isUnderMemoryPressure,
            alert: isUnderMemoryPressure ? 'WARNING: Heap usage exceeds 85% threshold' : 'NOMINAL',
        },
        process: {
            pid: process.pid,
            nodeVersion: process.version,
        },
        ...(heapSnapshotFile ? { heapSnapshotFile } : {}),
    };

    return NextResponse.json(payload, {
        status: isUnderMemoryPressure || cachedDbStatus !== 'healthy' ? 503 : 200,
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Vigil-Memory-Rss': `${rssMb}MB`,
            'X-Vigil-Heap-Used': `${heapUsedMb}MB`,
        },
    });
}
