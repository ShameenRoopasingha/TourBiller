import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Routes that drivers are NOT allowed to access
const ADMIN_ONLY_ROUTES = [
    '/vehicles',
    '/customers',
    '/tour-schedules',
    '/quotations',
    '/users',
    '/bookings',
    '/calendar',
    '/reports',
    '/live-tracking',
    '/debug-tour-schedules',
    '/api/customers',
    '/api/quotations',
    '/api/bookings',
    '/api/tour-schedules',
    '/api/email/send',
    '/api/vehicles',
    '/api/users',
    '/api/fleet',
    '/api/bills',
    '/api/company',
];

export default auth((req) => {
    const { pathname } = req.nextUrl;

    // Allow public routes
    if (
        pathname.startsWith('/login') ||
        pathname.startsWith('/forgot-password') ||
        pathname.startsWith('/reset-password') ||
        pathname.startsWith('/subscription-required') ||
        pathname.startsWith('/privacy') ||
        pathname.startsWith('/terms') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/api/keepalive') ||
        pathname.startsWith('/api/bitgard/subscription-sync') ||
        pathname.startsWith('/api/bitgard/onboarding-token') ||
        pathname.startsWith('/api/bitgard/live-users') ||
        pathname.startsWith('/api/cron') || // Vercel Cron uses Bearer token auth
        pathname.startsWith('/api/v1/health') || // Health check & load telemetry
        pathname.startsWith('/api/health') || // Base health check
        pathname.startsWith('/api/driver') // Mobile API routes use Bearer token auth, not cookies
    ) {
        return NextResponse.next();
    }

    const sessionUser = req.auth?.user as { id?: string; companyId?: string; role?: string } | undefined;

    // If not authenticated or session was revoked/invalidated, reject cleanly
    if (!req.auth || !sessionUser?.id || !sessionUser?.companyId) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const loginUrl = new URL('/login', req.url);
        if (req.headers.get('x-forwarded-proto') === 'https') {
            loginUrl.protocol = 'https:';
        }
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    const role = sessionUser.role;

    // If driver tries to access admin-only routes, reject or redirect to dashboard
    if (role === 'DRIVER') {
        const isAdminRoute = ADMIN_ONLY_ROUTES.some(
            (route) => pathname === route || pathname.startsWith(`${route}/`)
        );
        const isBlockedBillRoute =
            pathname === '/bills' ||
            pathname === '/bills/new' ||
            /^\/bills\/[^/]+\/edit$/.test(pathname);

        if (isAdminRoute || isBlockedBillRoute) {
            if (pathname.startsWith('/api/')) {
                return NextResponse.json(
                    { success: false, error: 'Forbidden: Admin access required' },
                    { status: 403 }
                );
            }
            return NextResponse.redirect(new URL('/', req.url));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        // Match all routes except static files and _next
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
