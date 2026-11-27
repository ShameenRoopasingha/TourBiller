import crypto from 'crypto';

/**
 * Constant-time string equality check using crypto.timingSafeEqual.
 */
export function timingSafeEqualStrings(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) {
        return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * One-way SHA-256 hash for opaque verification/reset tokens & OTP codes stored at rest.
 */
export function hashOpaqueToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken.trim(), 'utf8').digest('hex');
}

const SYNC_TOLERANCE_SECONDS = 300; // 5 minutes

/**
 * Verifies a server-to-server subscription sync request from BitgardWeb.
 * Signed content: `${x-bitgard-timestamp}.${x-bitgard-delivery-id}.${rawBody}`
 * using HMAC-SHA256 with `BITGARD_SYNC_SECRET`.
 */
export function verifyBitgardSyncSignature(
    rawBody: string,
    headers: {
        deliveryId: string | null;
        timestamp: string | null;
        signature: string | null;
    },
    syncSecret: string,
    nowSeconds: number = Math.floor(Date.now() / 1000)
): { valid: true } | { valid: false; reason: string } {
    const { deliveryId, timestamp, signature } = headers;

    if (!syncSecret) {
        return { valid: false, reason: 'BITGARD_SYNC_SECRET is not configured' };
    }

    if (!deliveryId || !timestamp || !signature) {
        return { valid: false, reason: 'Missing required Bitgard sync headers' };
    }

    const timestampNum = Number(timestamp);
    if (!Number.isInteger(timestampNum) || Math.abs(nowSeconds - timestampNum) > SYNC_TOLERANCE_SECONDS) {
        return { valid: false, reason: 'Sync timestamp outside tolerance window' };
    }

    const signedContent = `${timestamp}.${deliveryId}.${rawBody}`;
    const expectedBase64 = crypto
        .createHmac('sha256', syncSecret)
        .update(signedContent, 'utf8')
        .digest('base64');

    const trimmed = signature.trim();
    const commaIdx = trimmed.indexOf(',');
    if (commaIdx <= 0) {
        return { valid: false, reason: 'Malformed signature header' };
    }

    const version = trimmed.slice(0, commaIdx);
    const sig = trimmed.slice(commaIdx + 1);
    if (version !== 'v1' || !timingSafeEqualStrings(expectedBase64, sig)) {
        return { valid: false, reason: 'Invalid Bitgard sync signature' };
    }

    return { valid: true };
}

/**
 * Signs an outbound Vigil -> BitgardWeb request using HMAC-SHA256 with `BITGARD_SYNC_SECRET`.
 */
export function signBitgardSyncPayload(
    rawBody: string,
    syncSecret: string,
    deliveryId: string = crypto.randomUUID(),
    timestampSeconds: number = Math.floor(Date.now() / 1000)
): {
    'x-bitgard-delivery-id': string;
    'x-bitgard-timestamp': string;
    'x-bitgard-signature': string;
} {
    const signedContent = `${timestampSeconds}.${deliveryId}.${rawBody}`;
    const digest = crypto
        .createHmac('sha256', syncSecret)
        .update(signedContent, 'utf8')
        .digest('base64');

    return {
        'x-bitgard-delivery-id': deliveryId,
        'x-bitgard-timestamp': String(timestampSeconds),
        'x-bitgard-signature': `v1,${digest}`,
    };
}

/**
 * Verifies Vercel / external cron Bearer secret in constant time.
 */
export function verifyCronSecret(
    authHeader: string | null,
    expectedSecret: string | undefined
): { valid: true } | { valid: false; status: 401 | 500; error: string } {
    if (!expectedSecret) {
        return {
            valid: false,
            status: 500,
            error: 'CRON_SECRET is not configured on the server.',
        };
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
            valid: false,
            status: 401,
            error: 'Unauthorized: Missing Bearer token.',
        };
    }

    const provided = authHeader.slice('Bearer '.length).trim();
    if (!provided || !timingSafeEqualStrings(provided, expectedSecret)) {
        return {
            valid: false,
            status: 401,
            error: 'Unauthorized: Invalid cron secret.',
        };
    }

    return { valid: true };
}

/**
 * Checks whether a role has administrative privileges in a tenant.
 */
export function isAdminOrOwnerRole(role?: string | null): boolean {
    return role === 'ADMIN' || role === 'OWNER';
}

/**
 * Escapes a single CSV cell value and neutralizes spreadsheet formula injection
 * (`=`, `+`, `-`, `@`, `\t`, `\r`).
 */
export function escapeCsvCell(value: unknown): string {
    const raw = value === null || value === undefined ? '' : String(value);
    const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
    return `"${safe.replace(/"/g, '""')}"`;
}

/**
 * Extracts client IP address for rate-limit keys.
 */
export function getClientIp(req: Request): string {
    return (
        req.headers.get('x-real-ip')?.trim() ||
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        'unknown-ip'
    );
}

/**
 * Produces a non-reversible pseudonymous identifier for IPs stored in audit logs/rate limits.
 */
export function hashIpAddress(ip: string): string {
    return `ip_${hashOpaqueToken(ip || 'unknown-ip').slice(0, 16)}`;
}

/**
 * Enforces optional comma-separated static source IP allowlisting on privileged routes.
 * When `allowedIpsCsv` is unset/empty (default dynamic serverless egress), returns true.
 */
export function isAllowedSourceIp(req: Request, allowedIpsCsv: string | undefined): boolean {
    const raw = allowedIpsCsv?.trim();
    if (!raw) {
        return true;
    }
    const allowlist = raw
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
    if (allowlist.length === 0) {
        return true;
    }
    const clientIp = getClientIp(req);
    return allowlist.some((allowed) => timingSafeEqualStrings(clientIp, allowed));
}
