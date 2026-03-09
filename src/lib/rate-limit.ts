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

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

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
