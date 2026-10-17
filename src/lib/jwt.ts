/**
 * Centralized JWT secret management for driver authentication.
 * Ensures fallback secrets are never silently used in production.
 */
export function getJwtSecret(): string {
    const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error(
                'SECURITY CRITICAL ERROR: NEXTAUTH_SECRET or AUTH_SECRET is not configured in production environment variables.'
            );
        }
        return 'development-fallback-secret-key-vigil';
    }
    return secret;
}
