import { NextResponse } from 'next/server';
import { checkDistributedRateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/security';

export async function enforceApiRateLimit(
    req: Request,
    options: {
        prefix: string;
        identifier?: string;
        maxAttempts: number;
        windowMs?: number;
        errorMessage?: string;
    }
): Promise<{ limited: false; remaining: number } | { limited: true; response: NextResponse }> {
    const windowMs = options.windowMs ?? 15 * 60 * 1000;
    const ip = getClientIp(req);
    const key = options.identifier
        ? `${options.prefix}:${options.identifier}:${ip}`
        : `${options.prefix}:${ip}`;

    const result = await checkDistributedRateLimit(key, options.maxAttempts, windowMs);
    if (!result.limited) {
        return { limited: false, remaining: result.remaining };
    }

    const retryAfterSeconds = Math.max(1, Math.ceil(result.retryAfterMs / 1000));
    const retryMinutes = Math.max(1, Math.ceil(result.retryAfterMs / 60000));

    return {
        limited: true,
        response: NextResponse.json(
            {
                success: false,
                error:
                    options.errorMessage ||
                    `Too many requests. Please try again in ${retryMinutes} minute(s).`,
            },
            {
                status: 429,
                headers: {
                    'Retry-After': String(retryAfterSeconds),
                    'X-RateLimit-Limit': String(options.maxAttempts),
                    'X-RateLimit-Remaining': '0',
                },
            }
        ),
    };
}
