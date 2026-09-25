# Multi-Tenant Specification & Architecture Survey Report

**Project**: TourBiller (Vehicle Hire & Tour Billing Application)  
**Date**: 2026-09-25  
**Investigator**: Specification Miner (Survey)  
**Status**: Authoritative Discovery Complete  

---

## 1. Executive Summary

This specification survey establishes the authoritative multi-tenant architecture and security boundary definitions for TourBiller. The objective is strict isolation: **a user belonging to Company A must never view, create, edit, or delete any Bills, Vehicles, Bookings, Quotations, Customers, Vehicle Expenses, Trip Activities, Tour Schedules, or Users belonging to Company B**.

The survey reveals widespread multi-tenant leakage across Server Actions and App Router pages:
1. **Unscoped Reads (`findMany`)**: Operations such as `getVehicles`, `getTourSchedules`, `getVehicleExpenses`, `getDrivers`, and `getDashboardStats` completely omit `companyId`, returning global data across all tenants.
2. **Search Query Bypass (`getBookings`)**: `getBookings` includes `companyId` only when `searchQuery` is omitted; providing any search query causes the `companyId` filter to be dropped entirely.
3. **Unchecked Single-Record Mutations (`update`, `delete`)**: Operations on `Bill`, `Vehicle`, `Booking`, `Customer`, `TourSchedule`, `Quotation`, `VehicleExpense`, and `User` use `where: { id }` without checking if `id` belongs to the authenticated user's `companyId`.
4. **Tenant Hijacking (`updateCustomer`, `updateVehicle`)**: `updateCustomer` and `updateVehicle` allow updating records by `id` while overwriting the record's `companyId` with the caller's `companyId`, enabling cross-tenant record theft.
5. **Cross-Tenant Availability & Leakage**: `checkVehicleAvailability` checks bills, bookings, and quotations without filtering by `companyId`, leaking customer names across companies and erroneously blocking bookings for vehicles sharing the same registration plate in different companies.
6. **Hardcoded First Record Profile**: `getBusinessProfile` and `updateBusinessProfile` use `findFirst()` with no company filter, reading and overwriting the first company profile created in the database.

---

## 2. Authoritative Specification Sources

- **Prisma Schema**: `prisma/schema.prisma` (PostgreSQL provider, models, indices, relations)
- **Authentication & JWT Engine**: `src/lib/auth.ts` (NextAuth v5 beta, credentials provider, jwt & session callbacks)
- **Session Guards**: `src/lib/auth-guard.ts` (`requireAdmin`, `requireAuth`)
- **Server Actions**: `src/lib/*-actions.ts` and `src/lib/actions.ts`
- **Application Pages**: `src/app/**/page.tsx`
- **Dependency Manifest**: `package.json` (Next.js 16.1.5, NextAuth 5.0.0-beta.30, Prisma 5.21.0, React 19.2.3)
- **Project Requirements**: `ORIGINAL_REQUEST.md` (R1: Patch Server Actions, R2: Secure Single-Record Operations, R3: Automated Verification Script)

---

## 3. Prisma Data Models & Multi-Tenant Mapping

### 3.1 Tenant Root Model
- **`BusinessProfile`** (table: `business_profile`):
  - Primary Key: `id` (String, cuid).
  - Represents the tenant/company.
  - Fields: `companyName`, `address`, `phone`, `email`, `website`, `usdRate`, `logoUrl`, `bankName`, `bankBranch`, `bankAccountNo`, `bankAccountName`, `createdAt`, `updatedAt`.
  - Child Relations: Has one-to-many relations with `users`, `bills`, `vehicles`, `customers`, `bookings`, `tourSchedules`, `quotations`, `vehicleExpenses`, and `tripActivities`.

### 3.2 Models With Direct `companyId` Foreign Key
Every model below has a foreign key `companyId String` referencing `BusinessProfile(id)` with `onDelete: Cascade`:

| Model | Table | Primary Key | Unique Constraints | Multi-Tenant Index | Isolation Rule |
|---|---|---|---|---|---|
| **`Bill`** | `bills` | `id` (cuid) | `billNumber` (autoincrement, **global**) | `@@index([companyId])` | Must filter by `companyId`. `billNumber` is global autoincrement. |
| **`Vehicle`** | `vehicles` | `id` (cuid) | `@@unique([companyId, vehicleNo])` | `@@index([companyId])` | Isolated per `companyId`. Multiple companies can have identical `vehicleNo`. |
| **`Customer`** | `customers` | `id` (cuid) | None | `@@index([companyId])` | Must filter by `companyId`. Multiple companies can have customers with identical names. |
| **`User`** | `users` | `id` (cuid) | `email` (**global**) | `@@index([companyId])` | User belongs to one `companyId`. Email must be unique globally across tenants. |
| **`Booking`** | `bookings` | `id` (cuid) | None | `@@index([companyId])` | Must filter by `companyId`. |
| **`TourSchedule`** | `tour_schedules` | `id` (cuid) | `@@unique([companyId, name])` | `@@index([companyId])` | Isolated per `companyId`. Multiple companies can have schedules with same name. |
| **`Quotation`** | `quotations` | `id` (cuid) | `quotationNumber` (autoincrement, **global**) | `@@index([companyId])` | Must filter by `companyId`. `quotationNumber` is global autoincrement. |
| **`VehicleExpense`**| `vehicle_expenses`| `id` (cuid) | None | `@@index([companyId])` | Must filter by `companyId`. |
| **`TripActivity`** | `trip_activities`| `id` (cuid) | None | `@@index([companyId])` | Must filter by `companyId`. |

### 3.3 Models Without Direct `companyId`
1. **`TourScheduleDayItem`** (table: `tour_schedule_day_items`):
   - Primary Key: `id` (cuid)
   - Foreign Key: `tourScheduleId String` referencing `TourSchedule(id)` with `onDelete: Cascade`.
   - Multi-tenant isolation is inherited through `TourSchedule.companyId`. Queries and mutations on day items must ensure the parent `TourSchedule` belongs to the tenant's `companyId`.
2. **`PasswordResetToken`** (table: `password_reset_tokens`):
   - Primary Key: `id` (cuid)
   - Unique constraints: `token` (@unique), `@@unique([email, token])`.
   - Does not have `companyId`. Identity is anchored to `User.email`, which is globally unique.

### 3.4 Prisma Constraint Mechanics & Architectural Limitation
- Prisma's `findUnique`, `update`, and `delete` methods **only accept fields that are marked with `@unique` or `@@unique`**.
- None of the models (`Bill`, `Booking`, `Customer`, etc.) define `@@unique([companyId, id])`.
- Therefore, queries like `prisma.bill.findUnique({ where: { id, companyId } })` will **fail TypeScript compilation**.
- **Approved Implementation Pattern for Single-Record Operations (R2)**:
  - **Pattern 1: Two-Step Ownership Verification** (Recommended for `update` and `delete` returning rich data or triggering side effects):
    ```typescript
    const record = await prisma.model.findFirst({
        where: { id, companyId: authCheck.companyId },
    });
    if (!record) {
        return { success: false, error: 'Record not found or access denied' };
    }
    // Proceed with prisma.model.update({ where: { id }, data: ... }) or delete
    ```
  - **Pattern 2: `updateMany` / `deleteMany`** (For bulk or direct mutations where count is sufficient):
    ```typescript
    const result = await prisma.model.deleteMany({
        where: { id, companyId: authCheck.companyId },
    });
    if (result.count === 0) {
        return { success: false, error: 'Record not found or access denied' };
    }
    ```
  - **Pattern 3: Single-Record Read (`findFirst`)**:
    Change `prisma.model.findUnique({ where: { id } })` to:
    ```typescript
    const record = await prisma.model.findFirst({
        where: { id, companyId: authCheck.companyId },
    });
    ```

---

## 4. Authentication, Session & Context Resolution

### 4.1 NextAuth Engine (`src/lib/auth.ts`)
- NextAuth v5 beta is configured with `Credentials` provider and `jwt` session strategy (`maxAge: 7 days`).
- During authorization (`authorize`):
  ```typescript
  const user = await prisma.user.findUnique({ where: { email: credentials.email } });
  // Returns: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.companyId }
  ```
- In `callbacks.jwt`:
  ```typescript
  if (user) {
      token.role = (user as { role?: string }).role;
      token.id = user.id;
      token.companyId = (user as any).companyId;
  }
  ```
- In `callbacks.session`:
  ```typescript
  if (session.user) {
      (session.user as any).role = token.role as string;
      (session.user as any).id = token.id as string;
      (session.user as any).companyId = token.companyId as string;
  }
  ```

### 4.2 Guard Resolution (`src/lib/auth-guard.ts`)
- `requireAdmin()` and `requireAuth()` resolve the current caller:
  1. Retrieve session via `await auth()`.
  2. If `!session?.user?.email`, return `{ authorized: false, error: 'Not authenticated' }`.
  3. Look up user by email in database: `prisma.user.findUnique({ where: { email }, select: { id: true, role: true, companyId: true } })`.
  4. Return `{ authorized: true, userId: user.id, role: user.role, companyId: user.companyId }`.
- **Anti-Pattern Identified in Actions**: Several actions currently call `requireAdmin()` or `requireAuth()`, but then re-fetch `await auth()` or cast `((await auth())?.user as any)?.companyId` instead of directly using `authCheck.companyId`. This is redundant and error-prone. All actions must standardize on using `authCheck.companyId`.

---

## 5. Comprehensive Audit of Server Actions & Data Access Points

| File | Function | Operation | Current Query Pattern | Multi-Tenant Vulnerability | Required Fix |
|---|---|---|---|---|---|
| `actions.ts` | `createBill` | Create Bill | `prisma.bill.create({ data: { companyId: ((await auth())...), ... } })` + `prisma.booking.update({ where: { id: bookingId } })` | Booking update does not verify `bookingId` belongs to `companyId`. Auto-closes other tenant's bookings. | Use `authCheck.companyId`. Validate `bookingId` belongs to `authCheck.companyId` before updating. |
| `actions.ts` | `updateBill` | Update Bill | `prisma.bill.update({ where: { id }, data: ... })` | No `companyId` filter. Admin from Company A can edit bills of Company B. | Pre-check with `findFirst({ where: { id, companyId: authCheck.companyId } })` before updating. |
| `actions.ts` | `getBills` | List Bills | `prisma.bill.findMany({ where: searchQuery ? ... : ... })` | Missing `requireAuth`/`requireAdmin` check. Relies on unvalidated session resolution. | Guard with `requireAuth()`. Enforce `where: { companyId: authCheck.companyId, ...(searchCondition) }`. |
| `actions.ts` | `getBillById` | Read Bill | `prisma.bill.findUnique({ where: { id } })` | **Critical Leak**: No authentication check. No `companyId` check. Public cross-tenant read. | Guard with `requireAuth()`. Query with `prisma.bill.findFirst({ where: { id, companyId: authCheck.companyId } })`. |
| `actions.ts` | `getBusinessProfile` | Read Profile | `prisma.businessProfile.findFirst()` | **Critical Leak**: Returns the first company profile in DB, ignoring user tenant. | Guard with `requireAuth()`. Query `prisma.businessProfile.findUnique({ where: { id: authCheck.companyId } })`. |
| `actions.ts` | `updateBusinessProfile`| Update Profile | `prisma.businessProfile.findFirst() -> update({ where: { id } })` | **Critical Hijack**: Overwrites the first company profile in DB rather than caller's company. | Use `prisma.businessProfile.update({ where: { id: authCheck.companyId }, data: validatedData })`. |
| `actions.ts` | `deleteBill` | Delete Bill | `prisma.bill.delete({ where: { id } })` | **Critical Destruction**: No `companyId` filter. Any admin can delete another tenant's bill. | Pre-check `findFirst({ where: { id, companyId: authCheck.companyId } })` before deleting. |
| `booking-actions.ts` | `createBooking` | Create Booking | `prisma.booking.create({ data: { companyId: ..., ... } })` | Calls unscoped `checkVehicleAvailability`. Uses unverified session companyId. | Use `authCheck.companyId`. Pass `companyId` into vehicle availability check. |
| `booking-actions.ts` | `getBookings` | List Bookings | `where: searchQuery ? { OR: [...] } : { companyId: ... }` | **Massive Leak**: When `searchQuery` is provided, `companyId` is completely excluded from `where`! | Always enforce `{ companyId: authCheck.companyId, AND: searchQuery ? ... : undefined }`. |
| `booking-actions.ts` | `cancelBooking` | Cancel Booking | `prisma.booking.findUnique({ where: { id } })` + `update({ where: { id } })` | **Critical Vulnerability**: No `companyId` check. Any admin can cancel any booking. | Verify ownership with `findFirst({ where: { id, companyId: authCheck.companyId } })`. |
| `booking-actions.ts` | `getBookingById` | Read Booking | `prisma.booking.findUnique({ where: { id } })` | **Critical Leak**: No auth check, no `companyId` check. Public cross-tenant read. | Guard with `requireAuth()`. Query `findFirst({ where: { id, companyId: authCheck.companyId } })`. |
| `customer-actions.ts`| `createCustomer` | Create Customer | `prisma.customer.create({ data: { companyId, ... } })` | Relies on raw session companyId before `requireAdmin()` check. | Use `authCheck.companyId` returned by `requireAdmin()`. |
| `customer-actions.ts`| `getCustomers` | List Customers | `prisma.customer.findMany({ where: ... })` | Missing auth guard. If unauthenticated, `companyId` is undefined. | Guard with `requireAuth()`. Filter by `authCheck.companyId`. |
| `customer-actions.ts`| `updateCustomer` | Update Customer | `prisma.customer.update({ where: { id }, data: { companyId: ..., ... } })` | **Tenant Hijacking**: Updates record by `id` and reassigns `companyId` to caller! | Verify ownership with `findFirst({ where: { id, companyId: authCheck.companyId } })`. Never mutate `companyId`. |
| `customer-actions.ts`| `deleteCustomer` | Delete Customer | `prisma.customer.findUnique({ where: { id } })` + related count + `delete` | **Critical Vulnerability**: `findUnique`, `delete`, and `count` (bills/bookings/quotes) lack `companyId`. | Scope `findFirst`, related counts (`where: { companyId, customerName }`), and `delete` to `authCheck.companyId`. |
| `dashboard-actions.ts`| `getDashboardStats` | Dashboard KPIs | Sequential `count`, `aggregate`, `findMany` across vehicles, bookings, bills | **Total Leak**: Zero `companyId` filters. Aggregates revenue, counts, and recent items system-wide. | Guard with `requireAuth()`. Inject `companyId: authCheck.companyId` into ALL vehicle, booking, and bill queries. |
| `quotation-actions.ts`| `generateQuotation` | Create Quote | `prisma.tourSchedule.findUnique({ where: { id } })` + `quotation.create` | Tour schedule lookup ignores `companyId`. Quotation creation omits `companyId` field! | Verify tour schedule belongs to `companyId`. Set `companyId: authCheck.companyId` on quotation. |
| `quotation-actions.ts`| `getQuotations` | List Quotes | `prisma.quotation.findMany({ where: { companyId, ... } })` | Missing auth guard. If session is missing, `companyId` is undefined. | Guard with `requireAuth()`. Enforce `authCheck.companyId`. |
| `quotation-actions.ts`| `getQuotationById` | Read Quote | `prisma.quotation.findUnique({ where: { id } })` | **Critical Leak**: No auth check, no `companyId` check. Public cross-tenant read. | Guard with `requireAuth()`. Query `findFirst({ where: { id, companyId: authCheck.companyId } })`. |
| `quotation-actions.ts`| `updateQuotation` | Update Quote | `prisma.quotation.update({ where: { id } })` | **Critical Vulnerability**: No `companyId` check on quotation or tourSchedule. | Verify ownership of quotation and tourSchedule with `authCheck.companyId`. |
| `quotation-actions.ts`| `updateQuotationStatus`| Status Change | `prisma.quotation.update({ where: { id }, data: { status } })` | **Critical Vulnerability**: Zero authentication check! Anyone can change any quotation status. | Guard with `requireAuth()`. Verify ownership with `findFirst({ where: { id, companyId: authCheck.companyId } })`. |
| `quotation-actions.ts`| `deleteQuotation` | Delete Quote | `prisma.quotation.delete({ where: { id } })` | **Critical Vulnerability**: No `companyId` check. Can delete another tenant's quote. | Verify ownership with `findFirst({ where: { id, companyId: authCheck.companyId } })`. |
| `quotation-actions.ts`| `convertQuotationToBooking`| Convert Quote | `tx.quotation.findUnique({ where: { id } })` | Does not verify quotation belongs to caller's `companyId`. | Check `where: { id, companyId: authCheck.companyId }`. |
| `tour-schedule-actions.ts`| `createTourSchedule`| Create Schedule | `prisma.tourSchedule.create({ data: { companyId: ((await auth())...), ... } })` | Calls `auth()` inside transaction instead of using `authCheck.companyId`. | Use `authCheck.companyId`. |
| `tour-schedule-actions.ts`| `getTourSchedules`| List Schedules | `prisma.tourSchedule.findMany({ where: { AND: [ { isActive: true }, ... ] } })` | **Massive Leak**: No `companyId` filter whatsoever! All schedules shared across tenants. | Guard with `requireAuth()`. Enforce `where: { companyId: authCheck.companyId, isActive: true, ... }`. |
| `tour-schedule-actions.ts`| `getTourScheduleById`| Read Schedule | `prisma.tourSchedule.findUnique({ where: { id } })` | **Critical Leak**: No `companyId` filter. Any tenant can view another tenant's schedule. | Guard with `requireAuth()`. Query `findFirst({ where: { id, companyId: authCheck.companyId } })`. |
| `tour-schedule-actions.ts`| `updateTourSchedule`| Update Schedule | `tx.tourSchedule.update({ where: { id } })` + `tx.tourScheduleDayItem.deleteMany` | **Critical Vulnerability**: Can overwrite and delete day items of another tenant's schedule. | Verify ownership of `tourSchedule` before updating and deleting items. |
| `tour-schedule-actions.ts`| `deleteTourSchedule`| Soft Delete | `prisma.tourSchedule.update({ where: { id }, data: { isActive: false } })` | **Critical Vulnerability**: No `companyId` check. Can disable another tenant's schedule. | Verify ownership with `findFirst({ where: { id, companyId: authCheck.companyId } })`. |
| `trip-activity-actions.ts`| `logTripActivity` | Log Activity | Admin check bypasses booking ownership: `if (!booking && authCheck.role !== 'ADMIN')` | Admin can log trip activity against Company B's booking with Company A's `companyId`. | Ensure booking belongs to `authCheck.companyId` even for admins. |
| `trip-activity-actions.ts`| `getTripActivities`| List Activities | `prisma.tripActivity.findMany({ where: { bookingId } })` | **Critical Leak**: `companyId` extracted on line 83 and ignored on line 85! | Query `where: { bookingId, companyId: authCheck.companyId }`. |
| `user-actions.ts` | `checkDriverAvailability`| Check Driver | Queries `booking` and `quotation` conflicts by `driverId` | Missing `companyId` filter on conflict queries and missing verification of driver ownership. | Enforce `companyId: authCheck.companyId` on driver, booking, and quotation queries. |
| `user-actions.ts` | `getUsers` | List Users | `prisma.user.findMany({ where: { companyId } })` | Missing auth guard. If unauthenticated, `companyId` is undefined. | Guard with `requireAdmin()`. Use `authCheck.companyId`. |
| `user-actions.ts` | `deleteUser` | Delete User | `prisma.user.delete({ where: { id } })` | **Critical Destruction**: Caller role checked, but `user.companyId` NOT checked. Admin A can delete User B! | Verify target user has `companyId === authCheck.companyId` before deleting. |
| `user-actions.ts` | `getDrivers` | List Drivers | `prisma.user.findMany({ where: { role: 'DRIVER' } })` | **Massive Leak**: Zero `companyId` filter. Drivers from all tenants exposed in dropdowns! | Guard with `requireAuth()`. Query `where: { companyId: authCheck.companyId, role: 'DRIVER' }`. |
| `vehicle-actions.ts` | `createVehicle` | Create Vehicle | `prisma.vehicle.create({ data: { companyId, ... } })` | Uses raw session companyId instead of `authCheck.companyId`. | Use `authCheck.companyId`. |
| `vehicle-actions.ts` | `getVehicles` | List Vehicles | `prisma.vehicle.findMany({ where: ... })` | **Massive Leak**: Zero `companyId` filter! All vehicles from all tenants exposed to everyone. | Guard with `requireAuth()`. Query `where: { companyId: authCheck.companyId, ...(searchCondition) }`. |
| `vehicle-actions.ts` | `updateVehicle` | Update Vehicle | `prisma.vehicle.update({ where: { id }, data: { companyId: ..., ... } })` | **Tenant Hijacking**: Updates record by `id` and reassigns `companyId` to caller! | Verify ownership with `findFirst({ where: { id, companyId: authCheck.companyId } })`. Never mutate `companyId`. |
| `vehicle-actions.ts` | `deleteVehicle` | Delete Vehicle | `prisma.vehicle.findUnique({ where: { id } })` + expense count + `delete` | **Critical Vulnerability**: `findUnique`, `count`, and `delete` lack `companyId` filter. | Verify vehicle ownership and scope expense count and delete to `authCheck.companyId`. |
| `vehicle-actions.ts` | `checkVehicleAvailability`| Vehicle Availability | Queries bills, bookings, and quotations by `vehicleNo` | **Critical Leak & False Conflict**: Checks across all tenants! Leaks customer names and cross-blocks plates. | Accept `companyId` (or resolve from session) and filter all queries with `companyId`. |
| `vehicle-expense-actions.ts`| `addVehicleExpense`| Add Expense | `prisma.booking.findFirst` for driver does not filter `companyId`. | Driver validation does not scope booking to `companyId`. | Add `companyId: authCheck.companyId` to active booking query. |
| `vehicle-expense-actions.ts`| `getVehicleExpenses`| List Expenses | `companyId` retrieved on line 109, completely ignored on line 110! | **Critical Leak**: `findMany({ where: vehicleNo ? { vehicleNo } : undefined })`. Global expense leak. | Guard with `requireAuth()`. Query `where: { companyId: authCheck.companyId, ...(vehicleNo ? { vehicleNo } : {}) }`. |
| `vehicle-expense-actions.ts`| `deleteVehicleExpense`| Delete Expense | `prisma.vehicleExpense.delete({ where: { id } })` | **Critical Vulnerability**: No `companyId` filter. Any admin can delete any expense in the DB. | Verify ownership with `findFirst({ where: { id, companyId: authCheck.companyId } })`. |

---

## 6. Direct Database Access in App Router Pages (`src/app/`)

Besides Server Actions, multiple Server Component pages execute direct Prisma queries:

1. **`src/app/customers/[id]/page.tsx`**:
   - Query: `prisma.customer.findUnique({ where: { id } })`
   - Vulnerability: No session check, no `companyId` check. Anyone navigating to `/customers/<other-company-customer-id>` can view the customer's personal data (name, mobile, email, address).
   - Fix: Resolve session, enforce `prisma.customer.findFirst({ where: { id, companyId: session.user.companyId } })`, return `notFound()` if unauthorized.

2. **`src/app/vehicles/[id]/page.tsx`**:
   - Query: `prisma.vehicle.findUnique({ where: { id } })`
   - Vulnerability: No session check, no `companyId` check. Exposes vehicle details across tenants.
   - Fix: Resolve session, enforce `prisma.vehicle.findFirst({ where: { id, companyId: session.user.companyId } })`.

3. **`src/app/quotations/[id]/page.tsx`**:
   - Calls `getQuotationById(id)` (which has no `companyId` check).
   - Fix: Securing `getQuotationById` automatically protects this page, but page should also ensure 404 is returned when cross-tenant access is attempted.

4. **`src/app/settings/page.tsx`**:
   - Calls `getBusinessProfile()` from `src/lib/actions.ts`.
   - Vulnerability: Displays the business profile of the first registered company in the database.
   - Fix: Once `getBusinessProfile()` is scoped to the user's `companyId`, this page will correctly display the current tenant's profile.

5. **`src/app/api/keepalive/route.ts`**:
   - Query: `prisma.vehicle.count()`
   - Non-sensitive operational ping: Keepalive endpoint for database connection pooler. Does not leak tenant identifiers.

---

## 7. Multi-Tenant Invariants & Security Boundaries

To maintain strict multi-tenant isolation, the system must enforce these non-negotiable invariants:

1. **Tenant Context Invariant**: Every Server Action and Server Component that performs a database query MUST resolve the caller's identity via `requireAuth()`, `requireAdmin()`, or `auth()` and obtain `companyId`.
2. **List Query Invariant**: Every `findMany`, `count`, `aggregate`, and `groupBy` operation MUST include `companyId: authCheck.companyId` in its top-level `where` clause. Any `OR` search conditions must be nested inside `AND` alongside `companyId`.
3. **Single-Record Read Invariant**: Every single-record lookup by `id` MUST replace `findUnique({ where: { id } })` with `findFirst({ where: { id, companyId: authCheck.companyId } })`.
4. **Single-Record Mutation Invariant**: Before executing `update` or `delete` on a record by `id`, the system MUST verify ownership via `findFirst({ where: { id, companyId: authCheck.companyId } })`, or use `updateMany`/`deleteMany` with `{ id, companyId: authCheck.companyId }`.
5. **Foreign Key Integrity Invariant**: When creating or updating a record that references another model (e.g. `Bill` referencing `Booking`, `Quotation` referencing `TourSchedule`, `Booking` referencing `Vehicle`), the system MUST verify that the referenced record also belongs to the caller's `companyId`.
6. **Vehicle Collision Invariant**: Vehicle availability checks (`checkVehicleAvailability`) MUST be scoped to `companyId`. Two separate companies are legally permitted to operate vehicles with the same plate number in this software, and their bookings must never conflict.
7. **Immutable Tenant Key Invariant**: The `companyId` of an existing record must NEVER be modifiable via update payloads.

---

## 8. Discovered Features & Edge Cases

### 8.1 Features Discovered
| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| 1 | Billing | `createBill` | Generates a new bill, updates vehicle mileage, and optionally closes linked booking | FormData (vehicle, route, meters, charges, bookingId) | `ActionResult<string>` (bill.id) | Throws error or returns `{ success: false, error }` | `src/lib/actions.ts:14` |
| 2 | Billing | `updateBill` | Updates existing bill data and calculates new totals | `id: string`, FormData | `ActionResult<string>` (bill.id) | Returns error if validation fails or bill not found | `src/lib/actions.ts:148` |
| 3 | Billing | `getBills` | Lists bills with optional text or numeric search | `searchQuery?: string` | `ActionResult<Bill[]>` | Returns `{ success: false, error }` on catch | `src/lib/actions.ts:270` |
| 4 | Billing | `getBillById` | Retrieves single bill by primary key | `id: string` | `ActionResult<Bill>` | Returns `{ success: false, error: 'Bill not found' }` | `src/lib/actions.ts:307` |
| 5 | Billing | `deleteBill` | Deletes a bill by primary key | `id: string` | `ActionResult<void>` | Returns `{ success: false, error }` on catch | `src/lib/actions.ts:416` |
| 6 | Business Profile | `getBusinessProfile` | Fetches company settings (name, address, bank info) | None | `ActionResult<BusinessProfile>` | Auto-creates default if DB empty | `src/lib/actions.ts:339` |
| 7 | Business Profile | `updateBusinessProfile` | Updates company info for invoices/settings | FormData | `ActionResult<BusinessProfile>` | Returns error on validation failure | `src/lib/actions.ts:363` |
| 8 | Bookings | `createBooking` | Creates confirmed booking after checking vehicle availability | FormData | `ActionResult<string>` (booking.id) | Fails if vehicle occupied during dates | `src/lib/booking-actions.ts:14` |
| 9 | Bookings | `getBookings` | Lists bookings with search filtering | `searchQuery?: string` | `ActionResult<Booking[]>` | Returns error on catch | `src/lib/booking-actions.ts:77` |
| 10 | Bookings | `cancelBooking` | Cancels booking and calculates refund status (>7d = REFUNDED) | `id: string` | `ActionResult<void>` | Returns error if booking not found | `src/lib/booking-actions.ts:100` |
| 11 | Bookings | `getBookingById` | Retrieves single booking by ID | `id: string` | `ActionResult<Booking>` | Returns `{ success: false, error: 'Booking not found' }` | `src/lib/booking-actions.ts:149` |
| 12 | Customers | `createCustomer` | Adds customer to company directory | FormData (name, mobile, email, address) | `ActionResult<string>` (customer.id) | Returns validation error | `src/lib/customer-actions.ts:12` |
| 13 | Customers | `getCustomers` | Lists customers with search filtering | `searchQuery?: string` | `ActionResult<Customer[]>` | Returns error on catch | `src/lib/customer-actions.ts:52` |
| 14 | Customers | `updateCustomer` | Edits customer details | `id: string`, FormData | `ActionResult<string>` (id) | Returns validation error | `src/lib/customer-actions.ts:78` |
| 15 | Customers | `deleteCustomer` | Deletes customer if no linked bills/bookings/quotations | `id: string` | `ActionResult<void>` | Returns error if linked records exist | `src/lib/customer-actions.ts:116` |
| 16 | Dashboard | `getDashboardStats` | Aggregates active vehicles, occupied vehicles, revenue, recent bills | None | `ActionResult<DashboardStats>` | Returns error on catch | `src/lib/dashboard-actions.ts:6` |
| 17 | Quotations | `generateQuotation` | Calculates quotation costs from tour schedule day items and creates quote | `tourScheduleId: string`, FormData | `ActionResult<string>` (quotation.id) | Fails if schedule missing or vehicle occupied | `src/lib/quotation-actions.ts:17` |
| 18 | Quotations | `getQuotations` | Lists quotations with schedule details | `searchQuery?: string` | `ActionResult<QuotationWithSchedule[]>` | Returns error on catch | `src/lib/quotation-actions.ts:148` |
| 19 | Quotations | `getQuotationById` | Fetches quotation with full schedule and day items | `id: string` | `ActionResult<QuotationWithSchedule>` | Returns error if not found | `src/lib/quotation-actions.ts:181` |
| 20 | Quotations | `updateQuotation` | Updates quotation pricing and recalculates totals | `id: string`, `tourScheduleId: string`, FormData | `ActionResult<string>` (quotation.id) | Fails if vehicle conflict or schedule missing | `src/lib/quotation-actions.ts:208` |
| 21 | Quotations | `updateQuotationStatus` | Updates quotation status (DRAFT, SENT, ACCEPTED, EXPIRED) | `id: string`, `status: string` | `ActionResult<void>` | Fails if invalid status or vehicle conflict | `src/lib/quotation-actions.ts:323` |
| 22 | Quotations | `deleteQuotation` | Deletes a quotation | `id: string` | `ActionResult<void>` | Returns error on catch | `src/lib/quotation-actions.ts:373` |
| 23 | Quotations | `convertQuotationToBooking` | Converts accepted quotation into confirmed booking in transaction | `quotationId: string` | `ActionResult<string>` (booking.id) | Fails if already accepted or missing dates/vehicle | `src/lib/quotation-actions.ts:395` |
| 24 | Tour Schedules | `createTourSchedule` | Creates template tour schedule with day items | Object with schedule fields and `items[]` | `ActionResult<{ id, name }>` | Returns validation error | `src/lib/tour-schedule-actions.ts:46` |
| 25 | Tour Schedules | `getTourSchedules` | Lists active tour schedules with item counts | `searchQuery?: string` | `ActionResult<TourScheduleWithItems[]>` | Returns error on catch | `src/lib/tour-schedule-actions.ts:128` |
| 26 | Tour Schedules | `getTourScheduleById` | Fetches tour schedule with sorted day items | `id: string` | `ActionResult<TourScheduleWithItems>` | Returns error if not found | `src/lib/tour-schedule-actions.ts:163` |
| 27 | Tour Schedules | `updateTourSchedule` | Updates schedule and replaces day items in transaction | `id: string`, data object | `ActionResult<{ id, name }>` | Returns error on catch | `src/lib/tour-schedule-actions.ts:188` |
| 28 | Tour Schedules | `deleteTourSchedule` | Soft deletes tour schedule (`isActive: false`) | `id: string` | `ActionResult<void>` | Returns error on catch | `src/lib/tour-schedule-actions.ts:279` |
| 29 | Trip Activities | `logTripActivity` | Logs driver activity for active booking (fuel, stops, etc.) | `bookingId`, `type`, `note`, `expenseId` | `ActionResult<string>` (activity.id) | Fails if booking not assigned to driver | `src/lib/trip-activity-actions.ts:23` |
| 30 | Trip Activities | `getTripActivities` | Retrieves all activity records for a booking | `bookingId: string` | `ActionResult<TripActivity[]>` | Returns error on catch | `src/lib/trip-activity-actions.ts:75` |
| 31 | Trip Activities | `getDriverTourHistory` | Fetches upcoming or completed bookings for driver | `'upcoming' \| 'completed'` | `ActionResult<TourHistoryBooking[]>` | Returns error on catch | `src/lib/trip-activity-actions.ts:111` |
| 32 | Users | `getUsers` | Lists company users (ADMIN, DRIVER, OWNER) without passwords | None | `ActionResult<UserData[]>` | Returns error on catch | `src/lib/user-actions.ts:119` |
| 33 | Users | `createUser` | Registers user (Admin only) | FormData (name, email, password, role) | `ActionResult<string>` (user.id) | Fails if email exists or unauthorized | `src/lib/user-actions.ts:144` |
| 34 | Users | `deleteUser` | Deletes user if no linked bookings/quotations/expenses | `id: string` | `ActionResult<void>` | Fails if user has linked records or is self | `src/lib/user-actions.ts:199` |
| 35 | Users | `getDrivers` | Fetches list of users with role DRIVER for dropdown assignment | None | `ActionResult<DriverOption[]>` | Returns error on catch | `src/lib/user-actions.ts:255` |
| 36 | Users | `checkDriverAvailability` | Checks driver conflicts across bookings and accepted quotes | `driverId`, `startDate`, `endDate`, `currentId`, `currentType` | `ActionResult<{ available, conflicts }>` | Returns error if dates invalid | `src/lib/user-actions.ts:13` |
| 37 | Vehicles | `createVehicle` | Adds vehicle to company fleet | FormData | `ActionResult<string>` (vehicle.id) | Returns validation error | `src/lib/vehicle-actions.ts:12` |
| 38 | Vehicles | `getVehicles` | Lists vehicles with optional search | `searchQuery?: string` | `ActionResult<Vehicle[]>` | Returns error on catch | `src/lib/vehicle-actions.ts:67` |
| 39 | Vehicles | `updateVehicle` | Edits vehicle specifications and intervals | `id: string`, FormData | `ActionResult<string>` (id) | Returns validation error | `src/lib/vehicle-actions.ts:93` |
| 40 | Vehicles | `deleteVehicle` | Deletes vehicle if no linked expenses | `id: string` | `ActionResult<void>` | Fails if vehicle has linked expenses | `src/lib/vehicle-actions.ts:144` |
| 41 | Vehicles | `checkVehicleAvailability` | Checks vehicle conflicts across bills, bookings, quotes | `vehicleNo`, `startDate`, `endDate`, `currentId`, `currentType` | `ActionResult<{ available, conflicts }>` | Returns error if dates invalid | `src/lib/vehicle-actions.ts:182` |
| 42 | Expenses | `addVehicleExpense` | Records vehicle maintenance/fuel expense and updates vehicle service mileage | `VehicleExpenseFormData` | `ActionResult<string>` (expense.id) | Fails if driver not assigned to vehicle | `src/lib/vehicle-expense-actions.ts:14` |
| 43 | Expenses | `getVehicleExpenses` | Lists expenses, optionally filtered by vehicleNo | `vehicleNo?: string` | `ActionResult<VehicleExpense[]>` | Returns error on catch | `src/lib/vehicle-expense-actions.ts:106` |
| 44 | Expenses | `deleteVehicleExpense` | Deletes a vehicle expense record | `id: string` | `ActionResult<boolean>` | Returns error on catch | `src/lib/vehicle-expense-actions.ts:126` |
| 45 | Auth | `requestPasswordReset` | Generates password reset token and logs link | FormData (email) | `ActionResult<void>` | Rate limited (5 per 15 min) | `src/lib/auth-actions.ts:12` |
| 46 | Auth | `verifyResetToken` | Validates reset token and expiration | `token: string` | `boolean` | Returns false if expired/invalid | `src/lib/auth-actions.ts:76` |
| 47 | Auth | `resetPassword` | Hashes new password, updates user, deletes tokens in transaction | FormData (token, password) | `ActionResult<void>` | Fails if token invalid or expired | `src/lib/auth-actions.ts:101` |
| 48 | Webhook | `POST /api/webhooks/subscription` | Creates new `BusinessProfile` tenant and initial Owner `User` | Webhook request payload | JSON response | Returns 400 on invalid payment status | `src/app/api/webhooks/subscription/route.ts:6` |

### 8.2 Edge Cases
| # | Feature | Input | Observed Behavior |
|---|---|---|---|
| 1 | `getBookings` with search query | `searchQuery = "van"` | Drops `companyId` filter completely, returning matching bookings across all companies. |
| 2 | `getVehicles` without search query | `getVehicles()` | Queries `prisma.vehicle.findMany({ where: undefined })`, returning fleet of every company in the DB. |
| 3 | `checkVehicleAvailability` across companies | Same `vehicleNo = "CAB-1234"` in Company A and Company B | Company A's booking falsely blocks Company B's vehicle and leaks Company A's customer name. |
| 4 | `deleteUser` on cross-tenant ID | Admin of Company A passes `id` of User in Company B | Deletes Company B's user because query is `prisma.user.delete({ where: { id } })`. |
| 5 | `updateCustomer` on cross-tenant ID | Admin A passes Customer B's ID | Customer B's name/data updated AND Customer B's `companyId` overwritten to Company A. |
| 6 | `getBusinessProfile` for newly onboarded tenant | Company B calls `getBusinessProfile()` | Returns Company A's profile (the first record created in `business_profile`). |
| 7 | `getDashboardStats` for new empty company | Admin of Company B views dashboard | Sees revenue, bill numbers, and bookings from Company A aggregated into their dashboard. |
| 8 | `deleteTourSchedule` on cross-tenant ID | Admin A passes TourSchedule B's ID | Soft-deletes Company B's tour schedule without permission. |
| 9 | `convertQuotationToBooking` on cross-tenant ID | Admin A passes Quotation B's ID | Creates a booking under Company B using Quotation B and marks Quotation B ACCEPTED. |
| 10 | `updateQuotationStatus` by unauthenticated caller | Direct server action invocation with Quote ID and `status="ACCEPTED"` | Changes quote status with zero authentication or ownership verification. |
| 11 | `generateQuotation` creation | Valid form data and tourScheduleId | Fails or throws DB constraint error because `companyId` is omitted from `prisma.quotation.create`. |
| 12 | Customer deletion with identical customer name | Customer named "John" in Company A and Customer named "John" in Company B | `deleteCustomer` in Company A counts bills across all companies with name "John", erroneously blocking deletion. |

---

## 9. Verification & Testing Requirements (R3)

To fulfill Requirement R3 of `ORIGINAL_REQUEST.md`, an automated test script (e.g. `test-isolation.js` or `test-isolation.ts`) must be created and executed using Node.js:

1. **Test Setup**:
   - Create Company 1 (`BusinessProfile` 1) and User 1 (Admin 1).
   - Create Company 2 (`BusinessProfile` 2) and User 2 (Admin 2).
   - Seed Company 1 with: 1 Vehicle, 1 Customer, 1 TourSchedule, 1 Quotation, 1 Booking, 1 Bill, 1 VehicleExpense.
2. **Cross-Tenant Attack Vectors to Assert**:
   - **Vector 1 (List Reads)**: When querying vehicles, bills, bookings, quotations, customers, tour schedules, expenses, and drivers as User 2, 0 items belonging to Company 1 must be returned.
   - **Vector 2 (Search Reads)**: When searching bookings (`getBookings("test")`) or vehicles (`getVehicles("test")`) as User 2, 0 items from Company 1 must be returned.
   - **Vector 3 (Direct ID Reads)**: Calling `getBillById`, `getBookingById`, `getQuotationById`, `getTourScheduleById` with Company 1 IDs as User 2 must return `success: false` or error.
   - **Vector 4 (Updates)**: Calling `updateBill`, `updateVehicle`, `updateCustomer`, `updateBooking`, `updateQuotation`, `updateTourSchedule` with Company 1 IDs as User 2 must be rejected.
   - **Vector 5 (Deletes)**: Calling `deleteBill`, `deleteVehicle`, `deleteCustomer`, `deleteUser`, `deleteQuotation`, `deleteTourSchedule`, `deleteVehicleExpense` with Company 1 IDs as User 2 must fail, and Company 1's records must remain intact.
   - **Vector 6 (Dashboard Isolation)**: Calling `getDashboardStats` as User 2 must return 0 revenue, 0 bills, and 0 vehicles from Company 1.
   - **Vector 7 (Vehicle Availability Isolation)**: Checking availability for a vehicle in Company 2 must not be blocked by an active booking for a vehicle with the same plate in Company 1.
3. **Compilation Verification**:
   - Execute `npx tsc --noEmit` and assert 0 TypeScript compilation errors.
4. **Cleanup**:
   - Delete dummy companies and all cascaded child records created during testing.
