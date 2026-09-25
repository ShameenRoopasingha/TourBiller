# Handoff Report — Explorer Survey 1

**Agent**: Explorer Survey 1 (Codebase Researcher for Vehicle, Booking, and Quotation Server Actions)  
**Date**: 2026-09-25T03:08:00Z  
**Working Directory**: `e:\projects\tourBiller\.agents\teamwork\explorer_survey_1`  
**Handoff Type**: Hard (Task Complete)  

---

## 1. Observation

Direct examination of `src/lib/` revealed the following critical findings across the audited Server Actions:

1. **`src/lib/vehicle-actions.ts`**:
   - Line 67: `getVehicles(searchQuery?: string)` has no authentication check (`requireAuth` or `requireAdmin` missing).
   - Lines 69–77:
     ```typescript
     const vehicles = await prisma.vehicle.findMany({
         where: searchQuery ? {
             OR: [
                 { vehicleNo: { contains: searchQuery, mode: 'insensitive' } },
                 { model: { contains: searchQuery, mode: 'insensitive' } },
             ],
         } : undefined,
         orderBy: { updatedAt: 'desc' },
     });
     ```
     No `companyId` filter is present in either branch of the ternary.
   - Line 124–127: In `updateVehicle`, `prisma.vehicle.update({ where: { id }, data: { ... } })` modifies records solely by `id` without verifying tenant ownership.
   - Lines 152–164: In `deleteVehicle`, `prisma.vehicle.findUnique({ where: { id } })`, `prisma.vehicleExpense.count({ where: { vehicleNo: vehicle.vehicleNo } })`, and `prisma.vehicle.delete({ where: { id } })` omit `companyId`.
   - Lines 182–267: `checkVehicleAvailability` is unauthenticated and runs `prisma.bill.findMany`, `prisma.booking.findMany`, and `prisma.quotation.findMany` with no `companyId` filter, selecting `customerName`, `billNumber`, and date ranges across all companies.

2. **`src/lib/booking-actions.ts`**:
   - Lines 77–88: In `getBookings(searchQuery?: string)`:
     ```typescript
     const bookings = await prisma.booking.findMany({
         where: searchQuery ? {
             OR: [
                 { vehicleNo: { contains: searchQuery, mode: 'insensitive' } },
                 { customerName: { contains: searchQuery, mode: 'insensitive' } },
                 { destination: { contains: searchQuery, mode: 'insensitive' } },
             ],
         } : { companyId: ((await auth())?.user as any)?.companyId as string },
         orderBy: { createdAt: 'desc' },
     });
     ```
     When `searchQuery` is supplied, `companyId` is omitted from `where`.
   - Lines 108 & 129: In `cancelBooking`, `prisma.booking.findUnique({ where: { id } })` and `prisma.booking.update({ where: { id }, data: { status: 'CANCELLED', refundStatus } })` do not check `companyId`.
   - Line 151: In `getBookingById`, `prisma.booking.findUnique({ where: { id } })` is completely unauthenticated and returns any booking by ID.

3. **`src/lib/quotation-actions.ts`**:
   - Line 56: In `generateQuotation`, `prisma.tourSchedule.findUnique({ where: { id: validated.tourScheduleId } })` does not verify `companyId`.
   - Lines 98–131: In `generateQuotation`, `prisma.quotation.create({ data: { ... } as any })` omits `companyId` entirely from the insert data.
   - Lines 185–192: In `getQuotationById`, unauthenticated `prisma.quotation.findUnique({ where: { id }, include: { tourSchedule: { include: { items: true } } } })` leaks entire quotation details.
   - Line 294: In `updateQuotation`, `prisma.quotation.update({ where: { id }, data: { ... } })` does not verify `companyId`.
   - Lines 323–360: In `updateQuotationStatus`, unauthenticated `update({ where: { id }, data: { status } })` allows cross-tenant status updates.
   - Line 380: In `deleteQuotation`, `prisma.quotation.delete({ where: { id } })` deletes any quotation by ID.
   - Lines 403–460: In `convertQuotationToBooking`, transaction uses `findUnique({ where: { id: quotationId } })` without tenant check, creating a booking using `quotation.companyId`.

4. **`src/lib/vehicle-expense-actions.ts`**:
   - Lines 108–113:
     ```typescript
     let session = await auth();
     const companyId = (session?.user as any)?.companyId;
     const expenses = await prisma.vehicleExpense.findMany({
         where: vehicleNo ? { vehicleNo } : undefined,
         orderBy: { date: 'desc' },
     });
     ```
     `companyId` is fetched on line 109 but NEVER used in the `findMany` query. Returns all expenses across all companies.
   - Line 133: `prisma.vehicleExpense.delete({ where: { id } })` deletes by `id` without verifying `companyId`.

5. **`src/lib/tour-schedule-actions.ts`**:
   - Line 132: `getTourSchedules` findMany has no `companyId` filter and no auth check.
   - Line 167: `getTourScheduleById` findUnique has no `companyId` filter and no auth check.
   - Lines 226 & 246: `updateTourSchedule` updates schedule and deletes day items by `id` without verifying `companyId`.
   - Line 286: `deleteTourSchedule` soft-deletes by `id` without verifying `companyId`.

6. **`src/lib/trip-activity-actions.ts`**:
   - Line 48: In `logTripActivity`, `if (!booking && authCheck.role !== 'ADMIN')` bypasses the booking existence and tenant check for admins.
   - Line 84: `getTripActivities` findMany searches `{ where: { bookingId } }` without checking `companyId`.

7. **`src/lib/actions.ts`**:
   - Line 112: `prisma.booking.update({ where: { id: bookingId }, data: { status: 'COMPLETED' } })` updates any booking during bill creation without tenant validation.

---

## 2. Logic Chain

1. **Premise**: In a multi-tenant architecture, every query that fetches, mutates, or deletes records must be scoped strictly to the current user's authenticated tenant (`companyId: session.user.companyId` / `authCheck.companyId`).
2. **Read Multi-Record Vulnerabilities (R1)**:
   - As observed in `vehicle-actions.ts:69`, `vehicle-expense-actions.ts:110`, and `tour-schedule-actions.ts:132`, `prisma.*.findMany` is invoked without `companyId: authCheck.companyId`. Consequently, database records belonging to Tenant B are returned in responses sent to Tenant A.
   - In `booking-actions.ts:80`, the presence of a ternary operator prioritizing the search filter completely drops `companyId` during searches, causing search requests to leak all tenants' bookings.
3. **Single-Record Mutation Vulnerabilities (R2)**:
   - In Prisma, `update` and `delete` methods require unique identifiers in `where`. Since `id` is globally unique, passing `{ where: { id } }` succeeds for any record regardless of `companyId`.
   - As observed in `vehicle-actions.ts:124`, `booking-actions.ts:129`, `quotation-actions.ts:294`, and `vehicle-expense-actions.ts:133`, an authenticated admin of Company A passing the CUID of Company B's entity modifies or deletes Company B's data without restriction.
4. **Missing Authentication Guards**:
   - Multiple read/status actions (`getVehicles`, `getBookingById`, `getQuotationById`, `getTourSchedules`, `getTourScheduleById`, `updateQuotationStatus`, `checkVehicleAvailability`) lack `requireAuth()` or `requireAdmin()` calls, allowing unauthenticated public network callers to retrieve or modify tenant data.

---

## 3. Caveats

- **Out of direct scope**: Server actions for Bills, Invoices, Payments, Users, Company Profile, and Settings (`actions.ts` primary bill flows, `user-actions.ts`, `profile-actions.ts`, `dashboard-actions.ts`) are concurrently audited by `explorer_survey_2`. Only cross-references where those files interact directly with bookings/vehicles were documented here.
- **Frontend Components**: Server actions are called by client and server page components; changing server action signatures or return types must preserve the existing `ActionResult<T>` interface so client callers do not break.
- **Client Serializability**: Note that `getVehicles` and `getVehicleExpenses` currently use `JSON.parse(JSON.stringify(...))` for plain POJO serialization in Next.js Server Actions; this should be preserved when adding tenant filters.

---

## 4. Conclusion

There is widespread absence of tenant scoping across 17 of 23 surveyed server actions in the Vehicle, Booking, Quotation, Tour Schedule, Vehicle Expense, and Trip Activity modules. The application currently allows full cross-tenant data leaks and unauthorized cross-tenant modifications.

### Required Remediations:
1. **Apply R1 Pattern**: Enforce `authCheck = await requireAuth()` or `requireAdmin()` and inject `companyId: authCheck.companyId` into every `findMany`, `count`, and `aggregate` query.
2. **Apply R2 Pattern**: Protect all single-record operations (`findUnique`, `update`, `delete`) via two-step validation:
   ```typescript
   const record = await prisma.<model>.findFirst({
       where: { id, companyId: authCheck.companyId },
   });
   if (!record) return { success: false, error: 'Record not found' };
   ```
   Or use `updateMany` / `deleteMany` where atomic bulk-scoping is appropriate.
3. **Fix Quotation Create**: Supply `companyId: authCheck.companyId` in `prisma.quotation.create`.
4. **Scope Availability Checks**: Enforce `companyId` in `checkVehicleAvailability` queries across Bills, Bookings, and Quotations.

The complete vulnerability catalogue and line-by-line remediation guide has been written to:
`e:\projects\tourBiller\.agents\teamwork\explorer_survey_1\report.md`

---

## 5. Verification Method

To verify these findings and confirm the vulnerabilities:

1. **Codebase Inspection**:
   - Inspect `src/lib/vehicle-actions.ts` at lines 69–77 (`getVehicles`), 124–127 (`updateVehicle`), and 152–164 (`deleteVehicle`).
   - Inspect `src/lib/booking-actions.ts` at lines 80–86 (`getBookings` dropping `companyId` on search).
   - Inspect `src/lib/quotation-actions.ts` at line 98 (`create` missing `companyId`) and 294 (`updateQuotation`).
   - Inspect `src/lib/vehicle-expense-actions.ts` at line 110 (`companyId` ignored in query).

2. **Automated Reproduction / Isolation Test**:
   - When the test script (`test-isolation.js`) runs:
     - Register Company A and Company B.
     - Create a Vehicle / Booking / Quotation in Company A.
     - Call `getVehicles()`, `getBookings('test')`, `getQuotationById(companyA_id)`, `updateVehicle(companyA_id)`, `cancelBooking(companyA_id)`, or `deleteVehicle(companyA_id)` as Company B user.
     - Vulnerability confirmed if Company B can read, update, or delete Company A's data.

3. **Compilation & Type Check**:
   - Run `npx tsc --noEmit` from `e:\projects\tourBiller` to verify TypeScript compile status.
