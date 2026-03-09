import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Routes that drivers are NOT allowed to access
const ADMIN_ONLY_ROUTES = [
    '/vehicles',
    '/customers',
    '/tour-schedules',
    '/quotations',
    '/users',
];

export default auth((req) => {
    const { pathname } = req.nextUrl;

    // Allow public routes
    if (
        pathname.startsWith('/login') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/api/keepalive')
    ) {
        return NextResponse.next();
    }

    // If not authenticated, redirect to login
    if (!req.auth) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    const role = (req.auth.user as any)?.role;

    // If driver tries to access admin-only routes, redirect to dashboard
    if (role === 'DRIVER') {
        const isAdminRoute = ADMIN_ONLY_ROUTES.some(
            (route) => pathname.startsWith(route)
        );
        if (isAdminRoute) {
            return NextResponse.redirect(new URL('/', req.url));
        }

        // Block drivers from creating new bills (but allow viewing/printing)
        if (pathname === '/bills/new') {
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
