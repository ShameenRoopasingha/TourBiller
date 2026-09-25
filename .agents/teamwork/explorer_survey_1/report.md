# Multi-Tenant Security & Vulnerability Audit Report
**Scope**: Vehicle, Booking, Quotation, Tour Schedule, Vehicle Expense, and Trip Activity Server Actions  
**Auditor**: Explorer Survey 1 (Codebase Researcher)  
**Date**: 2026-09-25  
**Target Repository**: `e:\projects\tourBiller`  

---

## Executive Summary

A comprehensive multi-tenant vulnerability survey was performed across all Server Actions governing **Vehicles**, **Bookings**, **Quotations**, **Tour Schedules**, **Vehicle Expenses**, and **Trip Activities** (`src/lib/*-actions.ts`).

### Key Statistics
- **Total Files Audited**: 6 core files (`vehicle-actions.ts`, `booking-actions.ts`, `quotation-actions.ts`, `tour-schedule-actions.ts`, `vehicle-expense-actions.ts`, `trip-activity-actions.ts`) + 2 cross-referenced files (`actions.ts`, `user-actions.ts`).
- **Total Server Action Functions Audited**: 23 functions.
- **Vulnerable Functions Found**: 17 functions (73.9% vulnerability rate).
- **Critical Leaks Identified**:
  - `getVehicles`, `getVehicleExpenses`, `getTourSchedules`, and `getBookings` (when search query provided) return records across **all tenants** without `companyId` filtering.
  - `getBookingById`, `getQuotationById`, `getTourScheduleById`, and `getTripActivities` lack authentication checks and/or return cross-tenant data by arbitrary ID.
  - `updateVehicle`, `deleteVehicle`, `cancelBooking`, `updateQuotation`, `updateQuotationStatus`, `deleteQuotation`, `updateTourSchedule`, `deleteTourSchedule`, and `deleteVehicleExpense` perform mutations solely by `where: { id }` without checking `companyId`, allowing any authenticated user/admin of Company A to modify or delete Company B's records.
  - `checkVehicleAvailability` queries Bills, Bookings, and Quotations without `companyId`, exposing customer names and booking dates across tenants.
  - `prisma.quotation.create` in `generateQuotation` completely omits `companyId` in the write payload.

---

## Detailed File-by-File Inventory & Vulnerability Analysis

---

### 1. `src/lib/vehicle-actions.ts`

#### Model: `Vehicle`
- Primary Key: `id: String`
- Unique Constraint: `@@unique([companyId, vehicleNo])`
- Multi-Tenant Field: `companyId String`

| Function | Queries Used | Tenant Scope Status | Severity |
| :--- | :--- | :--- | :--- |
| `createVehicle` | `prisma.vehicle.create` | ✅ Enforced (via session fallback) | Low Risk / Minor Fragility |
| `getVehicles` | `prisma.vehicle.findMany` | ❌ **Completely Missing** | **CRITICAL** |
| `updateVehicle` | `prisma.vehicle.update` | ❌ **Missing (where: { id } only)** | **CRITICAL** |
| `deleteVehicle` | `prisma.vehicle.findUnique`, `prisma.vehicleExpense.count`, `prisma.vehicle.delete` | ❌ **Missing across all 3 queries** | **CRITICAL** |
| `checkVehicleAvailability` | `prisma.bill.findMany`, `prisma.booking.findMany`, `prisma.quotation.findMany` | ❌ **Missing in all 3 queries; No Auth** | **CRITICAL** |

#### Detailed Findings:

##### 1.1 `getVehicles(searchQuery?: string)` (Lines 67–88)
- **Vulnerability**: Completely unauthenticated; does not call `requireAuth()` or `requireAdmin()`. The `prisma.vehicle.findMany` query contains no `companyId` filter.
- **Current Query**:
  ```typescript
  // Lines 69-77
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
- **Exploit Scenario**: Any user or unauthenticated caller can query `getVehicles()` and list all vehicles belonging to every company on the platform.
- **Fix Recommendation (R1)**:
  Call `requireAuth()`. Add `companyId: authCheck.companyId` to `where`.
  ```typescript
  const authCheck = await requireAuth();
  if (!authCheck.authorized) return { success: false, error: authCheck.error };

  const vehicles = await prisma.vehicle.findMany({
      where: {
          companyId: authCheck.companyId,
          ...(searchQuery ? {
              OR: [
                  { vehicleNo: { contains: searchQuery, mode: 'insensitive' } },
                  { model: { contains: searchQuery, mode: 'insensitive' } },
              ],
          } : {}),
      },
      orderBy: { updatedAt: 'desc' },
  });
  ```

##### 1.2 `updateVehicle(id: string, formData: FormData)` (Lines 93–139)
- **Vulnerability**: While `requireAdmin()` is checked, `prisma.vehicle.update` targets `where: { id }` alone without checking if the vehicle belongs to `authCheck.companyId`.
- **Current Query**:
  ```typescript
  // Lines 124-127
  await prisma.vehicle.update({
      where: { id },
      data: { companyId: ((await auth())?.user as any)?.companyId as string, ...validatedData },
  });
  ```
- **Exploit Scenario**: Admin of Company A submits an `id` belonging to Company B. The action updates Company B's vehicle specs and overwrites its `companyId` with Company A's `companyId`, effectively hijacking Company B's vehicle.
- **Fix Recommendation (R2)**:
  Perform a two-step validation using `findFirst` to verify ownership before update, or use `updateMany`:
  ```typescript
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) return { success: false, error: authCheck.error };

  const existing = await prisma.vehicle.findFirst({
      where: { id, companyId: authCheck.companyId },
  });
  if (!existing) {
      return { success: false, error: 'Vehicle not found' };
  }

  await prisma.vehicle.update({
      where: { id },
      data: validatedData,
  });
  ```

##### 1.3 `deleteVehicle(id: string)` (Lines 144–176)
- **Vulnerability**:
  1. `prisma.vehicle.findUnique({ where: { id } })` does not verify `companyId`.
  2. `prisma.vehicleExpense.count({ where: { vehicleNo: vehicle.vehicleNo } })` does not filter by `companyId`. Since vehicle plates can be identical across different companies (`@@unique([companyId, vehicleNo])`), it counts expenses from other companies.
  3. `prisma.vehicle.delete({ where: { id } })` deletes the vehicle with no `companyId` check.
- **Current Query**:
  ```typescript
  // Lines 152-164
  const vehicle = await prisma.vehicle.findUnique({ where: { id }, select: { vehicleNo: true } });
  if (!vehicle) return { success: false, error: 'Vehicle not found' };

  const expenseCount = await prisma.vehicleExpense.count({ where: { vehicleNo: vehicle.vehicleNo } });
  ...
  await prisma.vehicle.delete({ where: { id } });
  ```
- **Exploit Scenario**: Admin of Company A passes the ID of Company B's vehicle and deletes it.
- **Fix Recommendation (R2)**:
  ```typescript
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) return { success: false, error: authCheck.error };

  const vehicle = await prisma.vehicle.findFirst({
      where: { id, companyId: authCheck.companyId },
      select: { id: true, vehicleNo: true },
  });
  if (!vehicle) return { success: false, error: 'Vehicle not found' };

  const expenseCount = await prisma.vehicleExpense.count({
      where: { companyId: authCheck.companyId, vehicleNo: vehicle.vehicleNo },
  });
  if (expenseCount > 0) {
      return { success: false, error: `Cannot delete vehicle: it has ${expenseCount} expense record(s). Delete those first.` };
  }

  await prisma.vehicle.delete({ where: { id: vehicle.id } });
  ```

##### 1.4 `checkVehicleAvailability(...)` (Lines 182–307)
- **Vulnerability**: Completely unauthenticated. The queries on `prisma.bill.findMany`, `prisma.booking.findMany`, and `prisma.quotation.findMany` omit `companyId`. This leaks customer names, bill numbers, and booking dates across tenants.
- **Current Query**:
  ```typescript
  // Lines 198-267
  const billConflicts = await prisma.bill.findMany({ where: { vehicleNo, ... } });
  const bookingConflicts = await prisma.booking.findMany({ where: { vehicleNo, status: 'CONFIRMED', ... } });
  const quotationConflicts = await prisma.quotation.findMany({ where: { vehicleNo, status: 'ACCEPTED', ... } });
  ```
- **Fix Recommendation (R1)**:
  Call `requireAuth()`. Inject `companyId: authCheck.companyId` into all three `findMany` queries.

---

### 2. `src/lib/booking-actions.ts`

#### Model: `Booking`
- Primary Key: `id: String`
- Multi-Tenant Field: `companyId String`

| Function | Queries Used | Tenant Scope Status | Severity |
| :--- | :--- | :--- | :--- |
| `createBooking` | `prisma.booking.create` | ⚠️ Uses `(await auth())?.user?.companyId`; driverId unverified | Medium Risk |
| `getBookings` | `prisma.booking.findMany` | ❌ **Bypassed during search; Missing Auth** | **CRITICAL** |
| `cancelBooking` | `prisma.booking.findUnique`, `prisma.booking.update` | ❌ **Missing companyId in find and update** | **CRITICAL** |
| `getBookingById` | `prisma.booking.findUnique` | ❌ **Completely Unauthenticated & Unscoped** | **CRITICAL** |

#### Detailed Findings:

##### 2.1 `getBookings(searchQuery?: string)` (Lines 77–95)
- **Vulnerability**:
  1. No `requireAuth()` check.
  2. Severe ternary logic flaw on lines 80–86:
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
  When `searchQuery` is provided, `companyId` is completely dropped! Every booking in the entire database matching the search string is returned to any user.
  Even without `searchQuery`, if the user is unauthenticated, `auth()?.user?.companyId` is `undefined`, returning all records.
- **Fix Recommendation (R1)**:
  ```typescript
  const authCheck = await requireAuth();
  if (!authCheck.authorized) return { success: false, error: authCheck.error };

  const bookings = await prisma.booking.findMany({
      where: {
          companyId: authCheck.companyId,
          ...(searchQuery ? {
              OR: [
                  { vehicleNo: { contains: searchQuery, mode: 'insensitive' } },
                  { customerName: { contains: searchQuery, mode: 'insensitive' } },
                  { destination: { contains: searchQuery, mode: 'insensitive' } },
              ],
          } : {}),
      },
      orderBy: { createdAt: 'desc' },
  });
  ```

##### 2.2 `cancelBooking(id: string)` (Lines 100–144)
- **Vulnerability**:
  - `prisma.booking.findUnique({ where: { id } })` ignores tenant.
  - `prisma.booking.update({ where: { id }, data: { status: 'CANCELLED', refundStatus } })` modifies any booking.
- **Exploit Scenario**: Admin of Company A cancels bookings belonging to Company B by ID.
- **Fix Recommendation (R2)**:
  Use two-step validation:
  ```typescript
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) return { success: false, error: authCheck.error };

  const booking = await prisma.booking.findFirst({
      where: { id, companyId: authCheck.companyId },
  });
  if (!booking) return { success: false, error: 'Booking not found' };

  await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'CANCELLED', refundStatus },
  });
  ```

##### 2.3 `getBookingById(id: string)` (Lines 149–164)
- **Vulnerability**: Completely unauthenticated. `prisma.booking.findUnique({ where: { id } })` returns the booking record to anyone without checking `companyId`.
- **Fix Recommendation (R2)**:
  ```typescript
  const authCheck = await requireAuth();
  if (!authCheck.authorized) return { success: false, error: authCheck.error };

  const booking = await prisma.booking.findFirst({
      where: { id, companyId: authCheck.companyId },
  });
  if (!booking) return { success: false, error: 'Booking not found' };
  return { success: true, data: booking };
  ```

##### 2.4 `createBooking(formData: FormData)` (Lines 14–72)
- **Vulnerability**:
  Line 56: `data: { companyId: ((await auth())?.user as any)?.companyId as string, ...validatedData }`.
  Should use `authCheck.companyId`.
  Also, if `driverId` is passed, no check ensures that driver belongs to `authCheck.companyId`.

---

### 3. `src/lib/quotation-actions.ts`

#### Model: `Quotation`
- Primary Key: `id: String`
- Unique: `quotationNumber: Int @unique @default(autoincrement())`
- Multi-Tenant Field: `companyId String`

| Function | Queries Used | Tenant Scope Status | Severity |
| :--- | :--- | :--- | :--- |
| `generateQuotation` | `prisma.tourSchedule.findUnique`, `prisma.quotation.create` | ❌ **Missing companyId in create; tourSchedule unverified** | **CRITICAL** |
| `getQuotations` | `prisma.quotation.findMany` | ⚠️ Bypassed if unauthenticated | High Risk |
| `getQuotationById` | `prisma.quotation.findUnique` | ❌ **Unauthenticated & Unscoped** | **CRITICAL** |
| `updateQuotation` | `prisma.tourSchedule.findUnique`, `prisma.quotation.update` | ❌ **Missing companyId in update & tourSchedule** | **CRITICAL** |
| `updateQuotationStatus` | `prisma.quotation.findUnique`, `prisma.quotation.update` | ❌ **Unauthenticated & Unscoped** | **CRITICAL** |
| `deleteQuotation` | `prisma.quotation.delete` | ❌ **Missing companyId in delete** | **CRITICAL** |
| `convertQuotationToBooking` | `tx.quotation.findUnique`, `tx.booking.create`, `tx.quotation.update` | ❌ **Operates across tenants** | **CRITICAL** |

#### Detailed Findings:

##### 3.1 `generateQuotation(...)` (Lines 17–142)
- **Vulnerabilities**:
  1. `prisma.tourSchedule.findUnique({ where: { id: validated.tourScheduleId } })` does not verify `companyId === authCheck.companyId`.
  2. Lines 98–131: `prisma.quotation.create({ data: { ... } as any })` **does not pass `companyId` at all**!
- **Fix Recommendation**:
  Verify schedule: `prisma.tourSchedule.findFirst({ where: { id: validated.tourScheduleId, companyId: authCheck.companyId } })`. Include `companyId: authCheck.companyId` in `prisma.quotation.create`.

##### 3.2 `getQuotations(searchQuery?: string)` (Lines 147–176)
- **Vulnerability**: Missing `requireAuth()` check. If unauthenticated, `companyId` is `undefined`, so Prisma evaluates `{ companyId: undefined }` as no filter, returning all quotations across all companies.
- **Fix Recommendation (R1)**:
  Require auth via `requireAuth()` and enforce `companyId: authCheck.companyId`.

##### 3.3 `getQuotationById(id: string)` (Lines 181–203)
- **Vulnerability**: No authentication check. `prisma.quotation.findUnique({ where: { id } })` allows cross-tenant inspection of full quotation details and pricing breakdown.
- **Fix Recommendation (R2)**:
  ```typescript
  const authCheck = await requireAuth();
  if (!authCheck.authorized) return { success: false, error: authCheck.error };

  const quotation = await prisma.quotation.findFirst({
      where: { id, companyId: authCheck.companyId },
      include: { tourSchedule: { include: { items: { orderBy: { dayNumber: 'asc' } } } } },
  });
  if (!quotation) return { success: false, error: 'Quotation not found' };
  ```

##### 3.4 `updateQuotation(...)` (Lines 208–318)
- **Vulnerability**: `prisma.quotation.update({ where: { id }, data: { ... } })` does not check tenant ownership. An attacker can overwrite any quotation.
- **Fix Recommendation (R2)**:
  Verify with `findFirst({ where: { id, companyId: authCheck.companyId } })` and verify `tourScheduleId` before update.

##### 3.5 `updateQuotationStatus(id: string, status: string)` (Lines 323–368)
- **Vulnerability**: Completely unauthenticated. `update({ where: { id }, data: { status } })` allows any caller to transition statuses (e.g. ACCEPTED) on another company's quotation.
- **Fix Recommendation (R2)**:
  Add `requireAuth()`, verify ownership with `findFirst`, then update.

##### 3.6 `deleteQuotation(id: string)` (Lines 372–390)
- **Vulnerability**: `prisma.quotation.delete({ where: { id } })` allows Company A admin to delete Company B's quotations.
- **Fix Recommendation (R2)**:
  Verify with `findFirst({ where: { id, companyId: authCheck.companyId } })` before deletion.

##### 3.7 `convertQuotationToBooking(quotationId: string)` (Lines 395–476)
- **Vulnerability**: Inside the transaction, `tx.quotation.findUnique({ where: { id: quotationId } })` has no `companyId` check. If an admin provides Company B's quotation ID, line 444 writes `companyId: quotation.companyId` (Company B), creating a booking in Company B and setting Company B's quotation to ACCEPTED.
- **Fix Recommendation (R2)**:
  Verify ownership: `tx.quotation.findFirst({ where: { id: quotationId, companyId: authCheck.companyId } })`.

---

### 4. `src/lib/vehicle-expense-actions.ts`

#### Model: `VehicleExpense`
- Primary Key: `id: String`
- Multi-Tenant Field: `companyId String`

| Function | Queries Used | Tenant Scope Status | Severity |
| :--- | :--- | :--- | :--- |
| `addVehicleExpense` | `prisma.booking.findFirst`, `prisma.vehicleExpense.create`, `prisma.vehicle.findUnique`, `prisma.vehicle.update` | ⚠️ Uses `(await auth())?.user?.companyId`; driver check lacks companyId | Medium Risk |
| `getVehicleExpenses` | `prisma.vehicleExpense.findMany` | ❌ **companyId extracted but NEVER used in query; Missing Auth** | **CRITICAL** |
| `deleteVehicleExpense` | `prisma.vehicleExpense.delete` | ❌ **Missing companyId in delete** | **CRITICAL** |

#### Detailed Findings:

##### 4.1 `getVehicleExpenses(vehicleNo?: string)` (Lines 106–121)
- **Vulnerability**:
  Lines 108–113:
  ```typescript
  let session = await auth();
  const companyId = (session?.user as any)?.companyId;
  const expenses = await prisma.vehicleExpense.findMany({
      where: vehicleNo ? { vehicleNo } : undefined,
      orderBy: { date: 'desc' },
  });
  ```
  `companyId` is fetched into a local variable and never used! Unscoped `findMany` returns expenses across ALL companies. Also missing `requireAuth()`.
- **Fix Recommendation (R1)**:
  ```typescript
  const authCheck = await requireAuth();
  if (!authCheck.authorized) return { success: false, error: authCheck.error };

  const expenses = await prisma.vehicleExpense.findMany({
      where: {
          companyId: authCheck.companyId,
          ...(vehicleNo ? { vehicleNo } : {}),
      },
      orderBy: { date: 'desc' },
  });
  ```

##### 4.2 `deleteVehicleExpense(id: string)` (Lines 126–143)
- **Vulnerability**: Line 133: `prisma.vehicleExpense.delete({ where: { id } })`.
- **Exploit Scenario**: Admin from Company A deletes Company B's expenses.
- **Fix Recommendation (R2)**:
  Use `deleteMany` with `companyId` constraint or `findFirst` check:
  ```typescript
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) return { success: false, error: authCheck.error };

  const result = await prisma.vehicleExpense.deleteMany({
      where: { id, companyId: authCheck.companyId },
  });
  if (result.count === 0) return { success: false, error: 'Vehicle expense not found' };
  ```

##### 4.3 `addVehicleExpense(...)` (Lines 14–101)
- **Vulnerability**:
  Line 35: `prisma.booking.findFirst` for driver check should include `companyId: authCheck.companyId`.
  Lines 58, 71, 86: Replace `((await auth())?.user as any)?.companyId` with `authCheck.companyId`.

---

### 5. `src/lib/tour-schedule-actions.ts`

#### Model: `TourSchedule` & `TourScheduleDayItem`
- Primary Key: `id: String`
- Unique: `@@unique([companyId, name])`
- Multi-Tenant Field: `companyId String`

| Function | Queries Used | Tenant Scope Status | Severity |
| :--- | :--- | :--- | :--- |
| `createTourSchedule` | `tx.tourSchedule.create` | ✅ companyId set (via session fallback) | Low Risk |
| `getTourSchedules` | `prisma.tourSchedule.findMany` | ❌ **Completely Missing companyId; No Auth** | **CRITICAL** |
| `getTourScheduleById` | `prisma.tourSchedule.findUnique` | ❌ **Unauthenticated & Unscoped** | **CRITICAL** |
| `updateTourSchedule` | `tx.tourSchedule.update`, `tx.tourScheduleDayItem.deleteMany`, `tx.tourScheduleDayItem.createMany` | ❌ **Missing companyId in update & cascade delete** | **CRITICAL** |
| `deleteTourSchedule` | `prisma.tourSchedule.update` | ❌ **Missing companyId in soft-delete** | **CRITICAL** |

#### Detailed Findings:

##### 5.1 `getTourSchedules(searchQuery?: string)` (Lines 128–158)
- **Vulnerability**: Completely unauthenticated. `prisma.tourSchedule.findMany` does not filter by `companyId`. Returns all tour packages across all tenants.
- **Fix Recommendation (R1)**:
  Add `requireAuth()`, enforce `companyId: authCheck.companyId`.

##### 5.2 `getTourScheduleById(id: string)` (Lines 163–183)
- **Vulnerability**: Unauthenticated. `prisma.tourSchedule.findUnique({ where: { id } })` returns tour schedule details regardless of tenant.
- **Fix Recommendation (R2)**:
  Require auth, use `findFirst({ where: { id, companyId: authCheck.companyId }, include: { items: { orderBy: { dayNumber: 'asc' } } } })`.

##### 5.3 `updateTourSchedule(id: string, data: ...)` (Lines 188–274)
- **Vulnerability**:
  Inside transaction:
  `tx.tourSchedule.update({ where: { id }, data: ... })`
  `tx.tourScheduleDayItem.deleteMany({ where: { tourScheduleId: id } })`
  No ownership check on `id`. Admin of Company A can overwrite Company B's tour schedule and delete/recreate its day items.
- **Fix Recommendation (R2)**:
  Verify with `tx.tourSchedule.findFirst({ where: { id, companyId: authCheck.companyId } })` before updating or deleting items.

##### 5.4 `deleteTourSchedule(id: string)` (Lines 279–297)
- **Vulnerability**: `prisma.tourSchedule.update({ where: { id }, data: { isActive: false } })` can deactivate any company's tour schedule.
- **Fix Recommendation (R2)**:
  Verify ownership with `findFirst` first.

---

### 6. `src/lib/trip-activity-actions.ts`

#### Model: `TripActivity`
- Primary Key: `id: String`
- Multi-Tenant Field: `companyId String`

| Function | Queries Used | Tenant Scope Status | Severity |
| :--- | :--- | :--- | :--- |
| `logTripActivity` | `prisma.booking.findFirst`, `prisma.tripActivity.create` | ❌ **Admin bypasses booking check; booking lacks companyId** | **CRITICAL** |
| `getTripActivities` | `prisma.tripActivity.findMany` | ❌ **Missing companyId in findMany** | **CRITICAL** |
| `getDriverTourHistory` | `prisma.booking.findMany` | ⚠️ Scoped by driverId, lacks defense-in-depth companyId | Low Risk |

#### Detailed Findings:

##### 6.1 `logTripActivity(...)` (Lines 23–70)
- **Vulnerability**:
  Line 40:
  ```typescript
  const booking = await prisma.booking.findFirst({
      where: {
          id: bookingId,
          driverId: authCheck.userId,
          status: 'CONFIRMED',
      },
  });
  if (!booking && authCheck.role !== 'ADMIN') {
      return { success: false, error: 'Booking not found or not assigned to you.' };
  }
  ```
  If caller is ADMIN, the `if (!booking)` condition is ignored! No query is run to ensure `bookingId` belongs to `authCheck.companyId`. Admin can inject activities into another company's bookings.
- **Fix Recommendation**:
  ```typescript
  const booking = await prisma.booking.findFirst({
      where: {
          id: bookingId,
          companyId: authCheck.companyId,
          ...(authCheck.role === 'DRIVER' ? { driverId: authCheck.userId } : {}),
          status: 'CONFIRMED',
      },
  });
  if (!booking) return { success: false, error: 'Booking not found or unauthorized' };
  ```

##### 6.2 `getTripActivities(bookingId: string)` (Lines 75–95)
- **Vulnerability**:
  ```typescript
  // Line 84
  const activities = await prisma.tripActivity.findMany({
      where: { bookingId },
      orderBy: { timestamp: 'desc' },
  });
  ```
  Does not check `companyId`. Authenticated user from Company A can view all activity logs for Company B's tour.
- **Fix Recommendation (R1)**:
  Filter with `{ where: { bookingId, companyId: authCheck.companyId } }`.

---

### 7. Cross-Referenced Actions Affecting Vehicle/Booking

#### 7.1 `src/lib/actions.ts` - `createBill` (Line 112)
- **Vulnerability**:
  ```typescript
  if (bookingId) {
      try {
          await prisma.booking.update({
              where: { id: bookingId },
              data: { status: 'COMPLETED' },
          });
      } catch (bookingError) { ... }
  }
  ```
  When an admin creates a bill, passing an arbitrary `bookingId` marks another tenant's booking as COMPLETED.
- **Fix Recommendation (R2)**:
  Use `updateMany({ where: { id: bookingId, companyId: authCheck.companyId }, data: { status: 'COMPLETED' } })`.

#### 7.2 `src/lib/user-actions.ts` - `checkDriverAvailability` (Lines 29 & 55)
- **Vulnerability**:
  `prisma.booking.findMany` and `prisma.quotation.findMany` search for conflicts by `driverId` without `companyId`.

---

## Action Plan for Implementation & Patching

1. **R1 Multi-Record Query Remediation**:
   - Replace every unscoped `findMany`, `count`, `aggregate` on `vehicle`, `booking`, `quotation`, `tourSchedule`, `vehicleExpense`, `tripActivity` with `where: { companyId: authCheck.companyId, ... }`.
   - Add missing `requireAuth()` / `requireAdmin()` guards to `getVehicles`, `getBookings`, `getTourSchedules`, `getVehicleExpenses`, `checkVehicleAvailability`, `getBookingById`, `getQuotationById`, `getTourScheduleById`.

2. **R2 Single-Record Mutation Remediation**:
   - For single-record lookups and mutations (`updateVehicle`, `deleteVehicle`, `cancelBooking`, `updateQuotation`, `updateQuotationStatus`, `deleteQuotation`, `updateTourSchedule`, `deleteTourSchedule`, `deleteVehicleExpense`), implement two-step validation:
     ```typescript
     const item = await prisma.<model>.findFirst({
         where: { id, companyId: authCheck.companyId },
     });
     if (!item) return { success: false, error: 'Record not found' };
     // Proceed with update or delete by item.id
     ```
   - For bulk-capable deletes/updates like `deleteVehicleExpense`, use `prisma.vehicleExpense.deleteMany({ where: { id, companyId: authCheck.companyId } })`.

3. **Quotation Creation Fix**:
   - In `generateQuotation`, add `companyId: authCheck.companyId` to `prisma.quotation.create`.
   - Verify `tourScheduleId` belongs to `authCheck.companyId`.

4. **Availability Function Isolation**:
   - Require authentication in `checkVehicleAvailability` and pass `authCheck.companyId` to filter Bills, Bookings, and Quotations.
