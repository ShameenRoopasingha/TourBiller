/**
 * Simple in-memory rate limiter for server actions.
 * Tracks attempts by IP/key with a sliding window.
 * 
 * For production at scale, replace with Redis-backed rate limiting.
 */

type RateLimitEntry = {
    count: number;
    resetTime: number;
};

const MAX_STORE_SIZE = 10_000;
const rateLimitStore = new Map<string, RateLimitEntry>();

function pruneExpired(now: number) {
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}

// Clean up expired entries every 5 minutes.
// Crucial: Call unref() so this background timer does not hold open the Node.js event loop or leak workers.
const cleanupTimer = setInterval(() => {
    pruneExpired(Date.now());
}, 5 * 60 * 1000);

if (typeof cleanupTimer === 'object' && cleanupTimer !== null && 'unref' in cleanupTimer && typeof (cleanupTimer as { unref?: () => void }).unref === 'function') {
    (cleanupTimer as { unref: () => void }).unref();
}

/**
 * Resets and clears the in-memory rate limit store (used in testing and graceful teardowns).
 */
export function _clearRateLimitStore() {
    rateLimitStore.clear();
}

/**
 * Check if a key has exceeded the rate limit.
 * 
 * @param key - Unique identifier (e.g., IP address, email)
 * @param maxAttempts - Maximum attempts allowed in the window
 * @param windowMs - Time window in milliseconds (default: 15 minutes)
 * @returns { limited: boolean, remaining: number, retryAfterMs: number }
 */
export function rateLimit(
    key: string,
    maxAttempts: number,
    windowMs: number = 15 * 60 * 1000
): { limited: boolean; remaining: number; retryAfterMs: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    // No existing entry or window expired — allow
    if (!entry || now > entry.resetTime) {
        if (rateLimitStore.size >= MAX_STORE_SIZE) {
            pruneExpired(now);
            if (rateLimitStore.size >= MAX_STORE_SIZE) {
                const oldestKey = rateLimitStore.keys().next().value;
                if (oldestKey) rateLimitStore.delete(oldestKey);
            }
        }
        rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
        return { limited: false, remaining: maxAttempts - 1, retryAfterMs: 0 };
    }

    // Within window — check count
    if (entry.count >= maxAttempts) {
        return {
            limited: true,
            remaining: 0,
            retryAfterMs: entry.resetTime - now,
        };
    }

    // Increment and allow
    entry.count++;
    return { limited: false, remaining: maxAttempts - entry.count, retryAfterMs: 0 };
}

/**
 * Distributed sliding-window counter backed by Upstash Redis REST API when
 * UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are configured.
 * Falls back gracefully to the bounded in-memory rate limiter in single-instance/test environments.
 */
export async function checkDistributedRateLimit(
    key: string,
    maxAttempts: number,
    windowMs: number = 15 * 60 * 1000
): Promise<{ limited: boolean; remaining: number; retryAfterMs: number }> {
    const restUrl = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/\/+$/, '');
    const restToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

    if (!restUrl || !restToken) {
        // Distributed PostgreSQL atomic rate-limit fallback for serverless instances without Redis
        if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
            try {
                const { prisma } = await import('@/lib/prisma');
                const nowMs = Date.now();
                const nextReset = new Date(nowMs + windowMs);
                const rows = await prisma.$queryRaw<Array<{ count: number; reset_at: Date }>>`
                    INSERT INTO "rate_limit_buckets" ("key", "count", "resetAt")
                    VALUES (${key}, 1, ${nextReset})
                    ON CONFLICT ("key") DO UPDATE SET
                        "count" = CASE WHEN "rate_limit_buckets"."resetAt" <= NOW() THEN 1 ELSE "rate_limit_buckets"."count" + 1 END,
                        "resetAt" = CASE WHEN "rate_limit_buckets"."resetAt" <= NOW() THEN ${nextReset} ELSE "rate_limit_buckets"."resetAt" END
                    RETURNING "count", "resetAt" AS "reset_at"
                `;

                if (Array.isArray(rows) && rows.length > 0 && typeof rows[0]?.count === 'number') {
                    const count = Number(rows[0].count);
                    const resetAtMs = new Date(rows[0].reset_at).getTime();
                    if (count > maxAttempts) {
                        return {
                            limited: true,
                            remaining: 0,
                            retryAfterMs: Math.max(0, resetAtMs - nowMs),
                        };
                    }
                    return {
                        limited: false,
                        remaining: Math.max(0, maxAttempts - count),
                        retryAfterMs: 0,
                    };
                }
            } catch {
                // Fall back safely to bounded in-memory limiter if DB table is unavailable
            }
        }

        return rateLimit(key, maxAttempts, windowMs);
    }

    try {
        const redisKey = `rl:${key}`;
        const response = await fetch(`${restUrl}/pipeline`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${restToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([
                ['INCR', redisKey],
                ['PTTL', redisKey],
            ]),
            signal: AbortSignal.timeout(2500),
        });

        if (!response.ok) {
            return rateLimit(key, maxAttempts, windowMs);
        }

        const results = (await response.json()) as Array<{ result?: number; error?: string }>;
        const count = Number(results?.[0]?.result ?? 0);
        let ttlMs = Number(results?.[1]?.result ?? -1);

        if (count === 1 || ttlMs < 0) {
            await fetch(`${restUrl}/pexpire/${encodeURIComponent(redisKey)}/${windowMs}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${restToken}` },
                signal: AbortSignal.timeout(2500),
            }).catch(() => {});
            ttlMs = windowMs;
        }

        if (count > maxAttempts) {
            return {
                limited: true,
                remaining: 0,
                retryAfterMs: ttlMs > 0 ? ttlMs : windowMs,
            };
        }

        return {
            limited: false,
            remaining: Math.max(0, maxAttempts - count),
            retryAfterMs: 0,
        };
    } catch {
        return rateLimit(key, maxAttempts, windowMs);
    }
}

/**
 * Consumes a single-use replay nonce within `windowMs`.
 * Returns `true` on the first sighting and `false` if replayed within the window.
 */
export async function consumeReplayNonce(
    nonceKey: string,
    windowMs: number = 6 * 60 * 1000
): Promise<boolean> {
    const res = await checkDistributedRateLimit(`replay:${nonceKey}`, 1, windowMs);
    return !res.limited;
}
