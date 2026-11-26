import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { timingSafeEqualStrings, isAllowedSourceIp } from '@/lib/security';
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

function isDiagnosticAuthorized(request: Request): boolean {
    if (!isAllowedSourceIp(request, process.env.DIAGNOSTIC_ALLOWED_IPS)) {
        return false;
    }
    const configuredSecret = process.env.DIAGNOSTIC_SECRET?.trim();
    if (!configuredSecret) {
        return false;
    }
    const secretHeader = request.headers.get('x-diagnostic-secret')?.trim() || '';
    if (!secretHeader) {
        return false;
    }
    return timingSafeEqualStrings(secretHeader, configuredSecret);
}

export async function GET(request: Request) {
    const startTime = Date.now();
    const isAuthorizedDiagnostic = isDiagnosticAuthorized(request);
    const mem = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();
    const heapUsedMb = Number((mem.heapUsed / (1024 * 1024)).toFixed(2));
    const heapTotalMb = Number((mem.heapTotal / (1024 * 1024)).toFixed(2));
    const rssMb = Number((mem.rss / (1024 * 1024)).toFixed(2));
    const externalMb = Number((mem.external / (1024 * 1024)).toFixed(2));
    const heapUsageRatio = heapStats.heap_size_limit > 0 ? mem.heapUsed / heapStats.heap_size_limit : 0;
    const isUnderMemoryPressure = heapUsageRatio > 0.85;

    // Heap snapshots are disabled in production and gated strictly behind DIAGNOSTIC_SECRET in dev.
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    let heapSnapshotFile: string | null = null;
    if (action === 'snapshot') {
        if (process.env.NODE_ENV === 'production' || !isAuthorizedDiagnostic) {
            return NextResponse.json(
                { status: 'forbidden', error: 'Diagnostic snapshots are disabled in production or require valid x-diagnostic-secret.' },
                { status: 403 }
            );
        }
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

    const overallStatus = isUnderMemoryPressure || cachedDbStatus !== 'healthy' ? 'degraded' : 'healthy';

    if (!isAuthorizedDiagnostic) {
        return NextResponse.json(
            {
                status: overallStatus,
                timestamp: new Date().toISOString(),
                telemetry: {
                    dbStatus: cachedDbStatus,
                },
            },
            {
                status: overallStatus === 'healthy' ? 200 : 503,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate',
                },
            }
        );
    }

    const payload = {
        status: overallStatus,
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
        status: overallStatus === 'healthy' ? 200 : 503,
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Vigil-Memory-Rss': `${rssMb}MB`,
            'X-Vigil-Heap-Used': `${heapUsedMb}MB`,
        },
    });
}
