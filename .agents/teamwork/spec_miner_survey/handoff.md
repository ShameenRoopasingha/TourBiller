# Handoff Report: Multi-Tenant Specification & Architecture Survey

**Agent**: Specification Miner (Survey)  
**Working Directory**: `e:\projects\tourBiller\.agents\teamwork\spec_miner_survey\`  
**Target Milestone**: Multi-Tenant Isolation Architecture Survey  
**Handoff Type**: Hard (Task Complete)  

---

## 1. Observation

Direct observations from inspecting codebase files and executing baseline verification:

1. **Prisma Schema (`prisma/schema.prisma`)**:
   - `BusinessProfile` (lines 14–41) is the tenant entity with primary key `id String @id @default(cuid())`.
   - Models with direct `companyId` referencing `BusinessProfile(id)` with `onDelete: Cascade`:
     - `Bill` (line 45, lines 78–80)
     - `Vehicle` (line 89, lines 112–115, `@@unique([companyId, vehicleNo])`)
     - `Customer` (line 121, lines 129–131)
     - `User` (line 139, lines 147–153, `email String @unique`)
     - `Booking` (line 170, lines 184–192)
     - `TourSchedule` (line 197, lines 215–221, `@@unique([companyId, name])`)
     - `Quotation` (line 243, lines 278–283)
     - `VehicleExpense` (line 288, lines 299–305)
     - `TripActivity` (line 310, lines 318–325)
   - Models without direct `companyId`:
     - `TourScheduleDayItem` (lines 224–239, references `tourScheduleId String` with `onDelete: Cascade`)
     - `PasswordResetToken` (lines 157–166, references `email String` and `token String @unique`)
   - Unique constraints: None of the models with `companyId` define a composite unique constraint `@@unique([companyId, id])`. `billNumber` on `Bill` (line 46) and `quotationNumber` on `Quotation` (line 244) are globally `@unique @default(autoincrement())`.

2. **NextAuth & Session Resolution (`src/lib/auth.ts`, `src/lib/auth-guard.ts`)**:
   - `auth.ts` lines 43–49: `authorize` returns `{ id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.companyId }`.
   - `auth.ts` lines 59–74: `jwt` callback sets `token.companyId = (user as any).companyId`, and `session` callback copies `(session.user as any).companyId = token.companyId as string`.
   - `auth-guard.ts` lines 20–40 (`requireAdmin`) and lines 46–62 (`requireAuth`) retrieve session via `await auth()`, look up `prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true, companyId: true } })`, and return `{ authorized: true, userId, role, companyId }`.

3. **Verbatim Code Leaks & Vulnerabilities in Server Actions**:
   - `src/lib/booking-actions.ts` lines 79–88 (`getBookings`):
     ```typescript
     where: searchQuery ? {
         OR: [
             { vehicleNo: { contains: searchQuery, mode: 'insensitive' } },
             { customerName: { contains: searchQuery, mode: 'insensitive' } },
             { destination: { contains: searchQuery, mode: 'insensitive' } },
         ],
     } : { companyId: ((await auth())?.user as any)?.companyId as string },
     ```
   - `src/lib/vehicle-actions.ts` lines 69–77 (`getVehicles`):
     ```typescript
     where: searchQuery ? {
         OR: [
             { vehicleNo: { contains: searchQuery, mode: 'insensitive' } },
             { model: { contains: searchQuery, mode: 'insensitive' } },
         ],
     } : undefined,
     ```
   - `src/lib/tour-schedule-actions.ts` lines 132–146 (`getTourSchedules`):
     ```typescript
     where: {
         AND: [
             { isActive: true },
             searchQuery ? { OR: [...] } : {},
         ],
     },
     ```
   - `src/lib/vehicle-expense-actions.ts` lines 108–114 (`getVehicleExpenses`):
     ```typescript
     let session = await auth();
     const companyId = (session?.user as any)?.companyId;
     const expenses = await prisma.vehicleExpense.findMany({
         where: vehicleNo ? { vehicleNo } : undefined,
         orderBy: { date: 'desc' },
     });
     ```
   - `src/lib/user-actions.ts` lines 257–261 (`getDrivers`):
     ```typescript
     const drivers = await prisma.user.findMany({
         where: { role: 'DRIVER' },
         select: { id: true, name: true, email: true },
         orderBy: { name: 'asc' },
     });
     ```
   - `src/lib/dashboard-actions.ts` lines 45–93 (`getDashboardStats`): Zero `companyId` filters across `prisma.vehicle.count`, `prisma.booking.count`, `prisma.bill.aggregate` (yearly, weekly, today), `prisma.bill.findMany` (recent bills), and `prisma.booking.findMany` (ongoing bookings).
   - `src/lib/actions.ts` lines 341–350 (`getBusinessProfile`):
     ```typescript
     const profile = await prisma.businessProfile.findFirst();
     ```
   - `src/lib/actions.ts` lines 387–394 (`updateBusinessProfile`):
     ```typescript
     const existingProfile = await prisma.businessProfile.findFirst();
     let profile;
     if (existingProfile) {
       profile = await prisma.businessProfile.update({
         where: { id: existingProfile.id },
         data: validatedData,
       });
     }
     ```
   - `src/lib/quotation-actions.ts` lines 98–130 (`generateQuotation`): `data` passed to `prisma.quotation.create` omits `companyId`.
   - Single-record mutations without ownership verification:
     - `actions.ts:224`: `prisma.bill.update({ where: { id }, data: ... })`
     - `actions.ts:423`: `prisma.bill.delete({ where: { id } })`
     - `booking-actions.ts:130`: `prisma.booking.update({ where: { id }, data: ... })`
     - `customer-actions.ts:96`: `prisma.customer.update({ where: { id }, data: ... })`
     - `customer-actions.ts:150`: `prisma.customer.delete({ where: { id } })`
     - `quotation-actions.ts:294`: `prisma.quotation.update({ where: { id }, data: ... })`
     - `quotation-actions.ts:357`: `prisma.quotation.update({ where: { id }, data: { status } })`
     - `quotation-actions.ts:380`: `prisma.quotation.delete({ where: { id } })`
     - `tour-schedule-actions.ts:226`: `tx.tourSchedule.update({ where: { id }, data: ... })`
     - `tour-schedule-actions.ts:286`: `prisma.tourSchedule.update({ where: { id }, data: { isActive: false } })`
     - `user-actions.ts:238`: `prisma.user.delete({ where: { id } })`
     - `vehicle-actions.ts:124`: `prisma.vehicle.update({ where: { id }, data: ... })`
     - `vehicle-actions.ts:162`: `prisma.vehicle.delete({ where: { id } })`
     - `vehicle-expense-actions.ts:133`: `prisma.vehicleExpense.delete({ where: { id } })`

4. **Baseline TypeScript Check**:
   - Command: `npx tsc --noEmit`
   - Exit code: `0` (clean, 0 compile errors).

---

## 2. Logic Chain

1. **Step 1: Tenant Mapping**: From `prisma/schema.prisma` lines 14–327, `BusinessProfile` is the root tenant model. 9 models have foreign key `companyId` pointing directly to `BusinessProfile.id`. One model (`TourScheduleDayItem`) relates via its parent `tourScheduleId`. `PasswordResetToken` relates via `email`.
2. **Step 2: Session Resolution**: From `src/lib/auth.ts` lines 48, 63, 71 and `src/lib/auth-guard.ts` lines 39, 61, both the NextAuth session and the auth guard functions return `companyId`. Calling `requireAuth()` or `requireAdmin()` provides a verified `{ authorized: true, userId, role, companyId }` object.
3. **Step 3: Identification of Data Leaks**: From `actions.ts`, `booking-actions.ts`, `customer-actions.ts`, `dashboard-actions.ts`, `quotation-actions.ts`, `tour-schedule-actions.ts`, `trip-activity-actions.ts`, `user-actions.ts`, `vehicle-actions.ts`, and `vehicle-expense-actions.ts`, multi-record queries either omit `companyId` completely (`getVehicles`, `getTourSchedules`, `getDrivers`, `getVehicleExpenses`, `getDashboardStats`) or drop it when a search query is passed (`getBookings`), directly violating Requirement R1.
4. **Step 4: Identification of Unauthorized Mutations & Tenant Hijacking**: Direct mutations using `where: { id }` without verifying that the record's `companyId` matches `authCheck.companyId` allow cross-tenant modification or deletion. In `updateCustomer` (line 98) and `updateVehicle` (line 126), passing another company's record ID rewrites its `companyId` to the caller's `companyId`, executing a tenant hijacking attack. This directly violates Requirement R2.
5. **Step 5: Architectural Constraint for Single-Record Operations**: Because `prisma/schema.prisma` does not define `@@unique([companyId, id])`, Prisma will reject `findUnique`, `update`, and `delete` queries that pass `where: { id, companyId }`. Therefore, single-record queries must use `findFirst({ where: { id, companyId } })` to verify ownership prior to `update`/`delete`, or use `updateMany`/`deleteMany` with `where: { id, companyId }`.
6. **Step 6: Vehicle Availability Collision**: Because `checkVehicleAvailability` in `src/lib/vehicle-actions.ts:182` checks bills, bookings, and quotations without scoping by `companyId`, two separate companies operating vehicles with the same registration number will conflict with each other and leak customer names. Availability checks must be scoped by `companyId`.

---

## 3. Caveats

1. **Stripe / PayHere Webhook**: `src/app/api/webhooks/subscription/route.ts` creates new tenants (`BusinessProfile`) and owner users (`User`) from payment webhook events. It does not perform existing tenant operations, but requires valid payloads for onboarding.
2. **Database Migration Not Required for Basic Fixes**: While adding `@@unique([companyId, id])` to `schema.prisma` would allow Prisma `findUnique({ where: { companyId_id } })`, modifying the database schema might require generating and applying migrations to production PostgreSQL databases. The two-step validation pattern (`findFirst` check followed by operation) or `updateMany`/`deleteMany` completely secures the application at the software layer without altering the database schema or running migrations.
3. **App Router Pages**: Some page components (`src/app/customers/[id]/page.tsx`, `src/app/vehicles/[id]/page.tsx`) perform direct read queries. While the primary requirement is Server Actions (`src/lib/*-actions.ts`), these pages should also be protected or refactored to use secured server actions.

---

## 4. Conclusion

The TourBiller codebase has a robust foundational multi-tenant data model in Prisma and session pipeline in NextAuth, but suffers from widespread missing tenant filters in data access layers.

A successful implementation phase requires:
1. **Patching All Server Actions (R1 & R2)** across the 12 files identified in Section 5 of `report.md`.
2. **Standardizing Session & Guard Consumption**: Always obtain `companyId` from `await requireAuth()` or `await requireAdmin()`.
3. **Securing Single-Record Operations**: Apply Two-Step Verification (`findFirst` ownership check) or `updateMany`/`deleteMany`.
4. **Scoping Vehicle Availability Checks**: Pass `companyId` to `checkVehicleAvailability` and filter all conflict queries.
5. **Creating Automated Verification Test Script (R3)**: Implement `test-isolation.js` to create dummy Company A and Company B, assert cross-tenant isolation across all actions, verify `npx tsc --noEmit` exits with code 0, and clean up test data.

---

## 5. Verification Method

To verify the findings of this report:

1. **Verify Baseline TypeScript Health**:
   ```powershell
   npx tsc --noEmit
   ```
   *Expected outcome*: Exits with code 0.

2. **Inspect Specification Sources**:
   - Inspect `prisma/schema.prisma` models and indices: verify `companyId` foreign keys and absence of `@@unique([companyId, id])`.
   - Inspect `src/lib/booking-actions.ts:80-86`: verify dropped `companyId` filter when `searchQuery` is truthy.
   - Inspect `src/lib/vehicle-actions.ts:69-75`: verify lack of `companyId` in `getVehicles`.
   - Inspect `src/lib/dashboard-actions.ts:45-93`: verify global aggregations in `getDashboardStats`.
   - Inspect `src/lib/actions.ts:341-394`: verify `findFirst()` with no company filter in `getBusinessProfile` and `updateBusinessProfile`.

3. **Check Discovered Report Artifacts**:
   - Open and review `e:\projects\tourBiller\.agents\teamwork\spec_miner_survey\report.md`.
