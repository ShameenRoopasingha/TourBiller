# Original User Request

## 2026-09-25T02:55:27Z

# Teamwork Project Prompt — Draft

> Status: Ready for launch — awaiting user approval
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: very large team ("ගොඩක් ලොකු කණ්ඩායමකට කඩලා දෙන්න")

Use a very large team of agents. Break the work down and assign it to a very large team.

Conduct a thorough Multi-Tenant security and data isolation test and fix on the Next.js `tourBiller` application. The goal is to ensure that a user belonging to Company A cannot view, edit, or delete any Bills, Vehicles, Bookings, Quotations, or Users belonging to Company B.

Working directory: e:\projects\tourBiller
Integrity mode: development

## Requirements

### R1. Patch Vulnerable Server Actions
The team must fix the multi-tenant data leaks in all Server Actions (`src/lib/*-actions.ts`). Every database query that fetches multiple records (`findMany`, `count`, `aggregate`) must include a `companyId: session.user.companyId` filter.

### R2. Secure Single-Record Operations
For database operations that target a specific ID (`findUnique`, `update`, `delete`), the team must ensure the record belongs to the user's `companyId`. Since Prisma requires unique fields for `findUnique`/`update`/`delete`, the team should change these queries to `findFirst`, `updateMany`, `deleteMany`, or implement a two-step validation (fetch with `findFirst` to verify ownership, then proceed) to safely enforce the `companyId` constraint.

### R3. Automated Verification Script
The team must write and run an automated Node.js test script (e.g., `test-isolation.js`) that creates two dummy companies in the database and explicitly tests that one company cannot access or modify the other company's vehicles, bookings, or bills using the Server Actions.

## Acceptance Criteria

### Security Verification
- [ ] An automated test script successfully executes and confirms that cross-tenant data access is blocked.
- [ ] Running `npx tsc --noEmit` on the codebase returns 0 compilation errors after the fixes are applied.

## 2026-09-28T15:58:47Z

Audit and fix all CRUD operations and data loading across a production Next.js 16 + Prisma 5 + Supabase PostgreSQL (PgBouncer transaction mode, port 6543) app deployed on Vercel serverless. The app is a vehicle hire billing system. Currently, mutations via Next.js Server Actions crash with "An error occurred in the Server Components render" because server actions automatically re-render the full server component tree (including the dashboard with 11+ DB queries), which exhausts the connection pool or times out. Data loading pages also hang due to aggressive polling (every 10 seconds) from multiple components hitting the same expensive endpoint.

Working directory: e:\projects\tourBiller
Integrity mode: development

## Root Cause Context

These bugs all share the same root causes — the team must understand them before making changes:

1. **Server Actions trigger server component re-renders.** In Next.js App Router, calling a server action from a client component causes the framework to re-render all server components in the current route's tree as part of the response. If any server component in that tree makes DB queries that fail (timeout, pool exhaustion), the entire action appears to fail on the client — even if the mutation itself succeeded.

2. **PgBouncer transaction mode limitations.** The app uses Supabase's transaction pooler (port 6543 with `?pgbouncer=true`). `$queryRaw` with prepared statements doesn't work reliably. `connection_limit` must stay at 2 or lower per Prisma client instance to avoid exhausting the pool across concurrent Vercel serverless functions.

3. **Aggressive polling.** `AutoRefresh` component (page.tsx) and `NotificationBell` component both call `getDashboardStats()` (11+ sequential DB queries) on intervals. Combined, they were firing 22+ DB queries every 10 seconds per connected user.

## Requirements

### R1. Migrate all mutation server actions to API routes

Every create/update/delete server action that is called from a client component must be converted to an API route handler (`src/app/api/...`). The client component must use `fetch()` to call it, then `router.refresh()` on success. This eliminates the server component re-render crash.

Server action files to audit: `src/lib/vehicle-actions.ts`, `src/lib/customer-actions.ts`, `src/lib/bill-actions.ts`, `src/lib/booking-actions.ts`, `src/lib/quotation-actions.ts`, `src/lib/tour-schedule-actions.ts`, `src/lib/vehicle-expense-actions.ts`, `src/lib/dashboard-actions.ts`.

Client components that call these actions must be updated to use `fetch()` instead.

Server actions used only by other server components (e.g., `getVehicles()` called in `src/app/vehicles/page.tsx`) should remain as server actions — they don't trigger re-renders.

### R2. Ensure all database access is PgBouncer-compatible

- No `$queryRaw` or `$executeRaw` with parameterized queries (prepared statements break in PgBouncer transaction mode).
- `connection_limit` in `src/lib/prisma.ts` must remain at 2 or lower.
- No `Promise.all()` with more than 2 concurrent Prisma queries (exceeds `connection_limit=2`).
- All queries must be sequential or use at most 2 parallel queries.

### R3. Optimize polling and data loading

- `AutoRefresh` in `src/app/page.tsx` must poll at 60 seconds or longer.
- `NotificationBell` in `src/components/NotificationBell.tsx` must poll at 60 seconds or longer.
- Any other polling/interval patterns across the app must be identified and set to 60 seconds minimum.
- The `getDashboardStats()` function in `src/lib/dashboard-actions.ts` has 11+ sequential queries — consolidate where possible.

### R4. Preserve existing functionality

All existing features must continue to work: vehicle CRUD, customer CRUD, bill CRUD, booking CRUD, quotation CRUD, tour schedule CRUD, vehicle expense CRUD, dashboard stats, notification bell, calendar view, reports. No regressions.

## Acceptance Criteria

### CRUD Operations
- [ ] Every create/update/delete operation called from a client component uses an API route (`src/app/api/...`) with `fetch()`, not a direct server action call
- [ ] Every mutation returns proper JSON with `{ success: true/false, error?: string, data?: any }`
- [ ] No server action is imported in any `'use client'` component for mutation purposes
- [ ] `router.refresh()` is called on the client after every successful mutation

### Database Compatibility
- [ ] No `$queryRaw` or `$executeRaw` calls anywhere in the codebase
- [ ] `connection_limit` in `prisma.ts` is 2 or lower
- [ ] No `Promise.all()` with more than 2 concurrent Prisma calls
- [ ] The app connects to Supabase via port 6543 with `pgbouncer=true` in DATABASE_URL

### Performance
- [ ] No polling interval shorter than 60 seconds anywhere in the codebase
- [ ] Dashboard loads within 10 seconds on Vercel Hobby plan

### Build & Type Safety
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npx next build` completes successfully
- [ ] No TypeScript `any` types introduced in new code (existing ones are acceptable)

### No Regressions
- [ ] All existing pages render without errors (/, /vehicles, /customers, /bookings, /bills, /quotations, /tour-schedules, /reports, /settings)
- [ ] Auth flow (login/logout) still works
- [ ] Read operations (listing, searching, filtering) still work on all pages

