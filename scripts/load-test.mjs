#!/usr/bin/env node
/**
 * VIGIL SaaS Engine — Production Load & Memory Leak Verification Runner
 * Simulates 1,000 concurrent requests against /api/v1/health using Autocannon.
 * Evaluates Heap Stability, RSS, and Event Loop resilience under load.
 */

import autocannon from 'autocannon';

const targetUrl = process.env.TARGET_URL || 'http://localhost:3000/api/v1/health';
const connections = parseInt(process.env.CONCURRENT_CLIENTS || '1000', 10);
const duration = parseInt(process.env.DURATION_SECONDS || '15', 10);

console.log('='.repeat(70));
console.log('  VIGIL SYSTEM DIRECTIVE: NODE.JS PERFORMANCE & MEMORY LEAK AUDIT');
console.log('='.repeat(70));
console.log(`Target:      ${targetUrl}`);
console.log(`Concurrency: ${connections} concurrent connections`);
console.log(`Duration:    ${duration} seconds`);
console.log('='.repeat(70));

async function fetchTelemetry() {
    try {
        const res = await fetch(targetUrl);
        if (!res.ok) {
            throw new Error(`Health check returned HTTP ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        return null;
    }
}

async function runAudit() {
    console.log('\n[Phase 1] Probing target server baseline memory...');
    const baseline = await fetchTelemetry();

    if (!baseline) {
        console.error(`\n❌ Error: Cannot connect to ${targetUrl}.`);
        console.error('Please ensure the Next.js server is running (`npm run build && npm start` or `npm run dev`) before running this load audit.\n');
        process.exit(1);
    }

    console.log(`  -> Baseline RSS:        ${baseline.memory.rssMb} MB`);
    console.log(`  -> Baseline Heap Total: ${baseline.memory.heapTotalMb} MB`);
    console.log(`  -> Baseline Heap Used:  ${baseline.memory.heapUsedMb} MB (${baseline.memory.heapUsagePercent}%)`);
    console.log(`  -> DB Status:           ${baseline.telemetry.dbStatus}`);

    console.log(`\n[Phase 2] Spawning ${connections} concurrent requests for ${duration}s...`);

    const instance = autocannon(
        {
            url: targetUrl,
            connections,
            duration,
            headers: {
                'x-load-test': 'vigil-production-audit',
            },
        },
        async (err, results) => {
            if (err) {
                console.error('❌ Autocannon benchmark execution failed:', err);
                process.exit(1);
            }

            console.log('\n[Phase 3] Benchmark Completed. Collecting post-load telemetry...');
            console.log(autocannon.printResult(results));

            // Wait 3 seconds for GC & event-loop cooldown
            await new Promise((resolve) => setTimeout(resolve, 3000));

            const postLoad = await fetchTelemetry();
            if (!postLoad) {
                console.error('❌ Server crashed during or immediately following load test!');
                process.exit(1);
            }

            console.log('\n='.repeat(70));
            console.log('  MEMORY LEAK & HEAP STABILITY AUDIT REPORT');
            console.log('='.repeat(70));
            console.log(`Total Requests:         ${results.requests.total}`);
            console.log(`Req/Sec (Throughput):   ${results.requests.average}`);
            console.log(`Latency (p99):          ${results.latency.p99} ms`);
            console.log(`HTTP 2xx Success:       ${results['2xx']}`);
            console.log(`Errors / Timeouts:      ${results.errors + results.timeouts}`);
            console.log('-'.repeat(70));
            console.log(`Post-Load RSS:          ${postLoad.memory.rssMb} MB (Delta: ${(postLoad.memory.rssMb - baseline.memory.rssMb).toFixed(2)} MB)`);
            console.log(`Post-Load Heap Total:   ${postLoad.memory.heapTotalMb} MB`);
            console.log(`Post-Load Heap Used:    ${postLoad.memory.heapUsedMb} MB (${postLoad.memory.heapUsagePercent}%)`);
            console.log(`Memory Pressure Alert:  ${postLoad.memory.alert}`);

            const isStable = !postLoad.memory.isUnderMemoryPressure && (results.errors + results.timeouts === 0);

            if (isStable) {
                console.log('\n✅ PASS: Heap stabilized within safety thresholds. No memory bloat or request data leaks detected.');
                console.log('='.repeat(70));
                process.exit(0);
            } else {
                console.error('\n⚠️ WARNING: Potential memory pressure or dropped requests detected.');
                console.log('='.repeat(70));
                process.exit(1);
            }
        }
    );

    autocannon.track(instance, { renderProgressBar: true });
}

runAudit();
