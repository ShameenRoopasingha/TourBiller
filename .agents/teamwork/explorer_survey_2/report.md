# Multi-Tenant Security & Isolation Audit Report: Explorer Survey 2
**Scope**: Bill, Invoice, Payment, User, Company/Profile, Dashboard, Customer, Expense, Tour Schedule, and Trip Activity Server Actions  
**Target Codebase**: `e:\projects\tourBiller\`  
**Investigator**: Explorer Survey 2 (Codebase Researcher)  
**Date**: 2026-09-25  

---

## Executive Summary

A comprehensive multi-tenant vulnerability survey of TourBiller's server actions and data access layers revealed widespread cross-tenant data leaks and tampering vectors. In TourBiller, every tenant is represented by a `BusinessProfile` record (`prisma.businessProfile`), and every tenant entity (`Bill`, `Customer`, `User`, `Booking`, `Vehicle`, `TourSchedule`, `VehicleExpense`, `TripActivity`) possesses a foreign key `companyId: String` referencing `BusinessProfile.id`.

### Core Critical Vulnerabilities Identified:
1. **Unscoped Single-Record Deletion & Mutation (Violating Requirement R2)**:
   - `deleteBill`: Deletes records via `prisma.bill.delete({ where: { id } })` without checking `companyId`. Company A admins can delete Company B bills.
   - `updateBill`: Mutates bills via `prisma.bill.update({ where: { id } })` without verifying `companyId`. Company A admins can overwrite Company B bills.
   - `createBill`: Accepts an arbitrary `bookingId` from client form data and calls `prisma.booking.update({ where: { id: bookingId } })` without checking `companyId`, allowing cross-tenant booking status manipulation.
   - `deleteUser`: Calls `prisma.user.delete({ where: { id } })` without verifying the target user belongs to the caller's `companyId`.
   - `updateCustomer` & `deleteCustomer`: Calls `customer.update({ where: { id } })` and `customer.delete({ where: { id } })` without tenant verification. Additionally, `updateCustomer` allows reassigning `companyId`, effectively stealing customers across tenants.
   - `deleteVehicleExpense`: Calls `prisma.vehicleExpense.delete({ where: { id } })` with zero tenant verification.
   - `updateTourSchedule` & `deleteTourSchedule`: Modifies and soft-deletes tour schedules using `where: { id }` with no `companyId` validation.
   - `getBillById` & `getTourScheduleById`: Uses `findUnique({ where: { id } })` without authentication or `companyId` filtering, exposing full records across tenants.

2. **Unscoped Multi-Record Queries & Aggregations (Violating Requirement R1)**:
   - `getDashboardStats`: Performs 6 database queries (`vehicle.count`, `booking.count`, 3x `bill.aggregate`, `bill.findMany`, `booking.findMany`) with **ZERO** `companyId` filtering and **NO** authentication. Any tenant sees global revenue, active vehicle counts, and recent bills/bookings from all companies.
   - `getDrivers`: Fetches `prisma.user.findMany({ where: { role: 'DRIVER' } })` without tenant filtering, exposing all drivers across all companies.
   - `getVehicleExpenses`: Reads `companyId` into a local variable but completely omits it from `prisma.vehicleExpense.findMany({ where: vehicleNo ? { vehicleNo } : undefined })`, leaking all company expenses.
   - `getTripActivities`: Does not filter by `companyId`, allowing any user to read activities and logs from other tenants' bookings.
   - `getTourSchedules`: Does not filter by `companyId`, leaking all tour itineraries across tenants.
   - `checkDriverAvailability`: Does not filter conflict queries by `companyId`, leaking customer names and tour dates.
   - **Prisma `undefined` Filter Bypass in `getBills`, `getCustomers`, `getUsers`**: These functions use `{ companyId: ((await auth())?.user as any)?.companyId }`. When an unauthenticated caller or unpopulated session executes this, `companyId` is `undefined`. Prisma omits undefined fields in SQL `WHERE` clauses (`WHERE 1=1`), executing an unscoped query that leaks the entire table across all tenants!

3. **Global Company / BusinessProfile Flaw**:
   - `getBusinessProfile()`: Performs `prisma.businessProfile.findFirst()` without an `id: session.user.companyId` filter. It always returns the first record in the database, meaning Company B sees Company A's company name, bank accounts, and invoice branding.
   - `updateBusinessProfile()`: Performs `prisma.businessProfile.findFirst()` followed by `update({ where: { id: existingProfile.id } })`. When Company B's admin saves business settings, it overwrites Company A's business profile record!

---

## Detailed Vulnerability Inventory by File

### 1. `src/lib/actions.ts` (Bills & Business Profile Actions)

| Function | Line Numbers | Query Type | Target Model | Current `where` Clause | Vulnerability Description | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `createBill` | 89-96 | `create` | `Bill` | N/A (data insert) | Uses `((await auth())?.user as any)?.companyId` instead of verified `authCheck.companyId`. | Medium |
| `createBill` | 112-115 | `update` | `Booking` | `{ where: { id: bookingId } }` | **R2 Violation**: Does not verify `booking.companyId === authCheck.companyId`. An admin can supply another tenant's `bookingId` to mark it `COMPLETED`. | **High** |
| `updateBill` | 224-231 | `update` | `Bill` | `{ where: { id } }` | **R2 Violation**: Direct update by `id` without verifying tenant ownership. An admin from Company A can overwrite Company B's bill data. | **Critical** |
| `getBills` | 275-288 | `findMany` | `Bill` | `{ companyId: ((await auth())?.user as any)?.companyId, ... }` | **R1 Violation**: No `requireAuth()` check. If `companyId` evaluates to `undefined`, Prisma strips the condition from SQL, dumping all bills across all companies. | **Critical** |
| `getBillById` | 309-311 | `findUnique` | `Bill` | `{ where: { id } }` | **R2 Violation**: No authentication and no `companyId` filter. Any user can view full bill/invoice details of any company by ID. | **Critical** |
| `getBusinessProfile` | 341 | `findFirst` | `BusinessProfile` | `{}` (none) | Unscoped query. Returns the first profile in the database regardless of the tenant. | **Critical** |
| `updateBusinessProfile` | 387, 391-394 | `findFirst`, `update` | `BusinessProfile` | `{ where: { id: existingProfile.id } }` | **R2 Violation**: Updates the first business profile in the DB rather than `authCheck.companyId`. Tenant B overwrites Tenant A's business profile! | **Critical** |
| `deleteBill` | 423-425 | `delete` | `Bill` | `{ where: { id } }` | **R2 Violation**: Direct deletion by `id` without checking `companyId`. Company A admin can delete Company B's bills. | **Critical** |

#### Code Evidence & Flaws:
```typescript
// src/lib/actions.ts:224-231 (updateBill)
// VULNERABLE: Direct update by ID allows cross-tenant modification
const updatedBill = await prisma.bill.update({
  where: { id },
  data: {
    ...validatedData,
    totalAmount,
    itinerary: itinerary || null,
  },
});

// src/lib/actions.ts:307-312 (getBillById)
// VULNERABLE: No auth, no tenant constraint allows ID-enumeration data leak
export async function getBillById(id: string): Promise<ActionResult<Bill>> {
  try {
    const bill = await prisma.bill.findUnique({
      where: { id },
    });
...

// src/lib/actions.ts:423-425 (deleteBill)
// VULNERABLE: Unscoped delete allows cross-tenant deletion
await prisma.bill.delete({
  where: { id },
});

// src/lib/actions.ts:341-353 (getBusinessProfile)
// VULNERABLE: Finds first profile globally instead of current company
const profile = await prisma.businessProfile.findFirst();
```

---

### 2. `src/lib/user-actions.ts` (User & Driver Actions)

| Function | Line Numbers | Query Type | Target Model | Current `where` Clause | Vulnerability Description | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `checkDriverAvailability` | 29-44 | `findMany` | `Booking` | `{ driverId, status: 'CONFIRMED', ... }` | **R1 Violation**: No auth check, no `companyId` filter. Exposes customer names and dates from other tenants' bookings. | **High** |
| `checkDriverAvailability` | 55-66 | `findMany` | `Quotation` | `{ driverId, status: 'ACCEPTED', ... }` | **R1 Violation**: No `companyId` filter. Exposes quotation customer names and numbers from other tenants. | **High** |
| `getUsers` | 123-133 | `findMany` | `User` | `{ where: { companyId } }` | **R1 Violation**: If `companyId` is `undefined`, Prisma omits `companyId`, dumping all user credentials metadata (id, name, email, role) across all tenants. | **Critical** |
| `createUser` | 178-186 | `create` | `User` | N/A (data insert) | Uses `(session?.user as any)?.companyId` instead of `callerUser.companyId`. If undefined, user is orphaned or creation fails. | Medium |
| `deleteUser` | 218-223 | `count` (x4) | `Booking`, `Quotation`, `VehicleExpense`, `TripActivity` | `{ where: { driverId: id } }` | Counts are not scoped to `callerUser.companyId`. | Medium |
| `deleteUser` | 238 | `delete` | `User` | `{ where: { id } }` | **R2 Violation**: Does not check that target user belongs to `callerUser.companyId`. Admin A can delete Admin B or Company B drivers. | **Critical** |
| `getDrivers` | 257-261 | `findMany` | `User` | `{ where: { role: 'DRIVER' } }` | **R1 Violation**: Zero auth, zero `companyId` check. Leaks all drivers across all companies. | **Critical** |

#### Code Evidence & Flaws:
```typescript
// src/lib/user-actions.ts:255-262 (getDrivers)
// VULNERABLE: Global query without tenant isolation
export async function getDrivers(): Promise<ActionResult<DriverOption[]>> {
    try {
        const drivers = await prisma.user.findMany({
            where: { role: 'DRIVER' },
            select: { id: true, name: true, email: true },
            orderBy: { name: 'asc' },
        });
        return { success: true, data: drivers };

// src/lib/user-actions.ts:238 (deleteUser)
// VULNERABLE: No ownership validation before deletion
await prisma.user.delete({ where: { id } });
```

---

### 3. `src/lib/dashboard-actions.ts` (Dashboard Metrics & Analytics)

| Function | Line Numbers | Query Type | Target Model | Current `where` Clause | Vulnerability Description | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `getDashboardStats` | 45 | `count` | `Vehicle` | `{ where: { status: 'ACTIVE' } }` | **R1 Violation**: Counts active vehicles across ALL companies. | **Critical** |
| `getDashboardStats` | 46 | `count` | `Booking` | `{ where: ongoingBookingFilter }` | **R1 Violation**: Counts occupied vehicles/bookings across ALL companies. | **Critical** |
| `getDashboardStats` | 48-51 | `aggregate` | `Bill` | `{ where: { createdAt: { gte: startOfYear, lte: endOfYear } } }` | **R1 Violation**: Sums annual revenue across ALL companies. Total breach of financial confidentiality. | **Critical** |
| `getDashboardStats` | 53-56 | `aggregate` | `Bill` | `{ where: { createdAt: { gte: startOfWeek, lte: endOfWeek } } }` | **R1 Violation**: Sums weekly revenue across ALL companies. | **Critical** |
| `getDashboardStats` | 58-61 | `aggregate` | `Bill` | `{ where: { createdAt: { gte: startOfToday, lte: endOfToday } } }` | **R1 Violation**: Sums daily revenue across ALL companies. | **Critical** |
| `getDashboardStats` | 63-77 | `findMany` | `Bill` | `{ take: 5, orderBy: { createdAt: 'desc' } }` | **R1 Violation**: Returns top 5 bills across ALL companies (reveals customer names, vehicles, routes, revenue). | **Critical** |
| `getDashboardStats` | 79-92 | `findMany` | `Booking` | `{ where: ongoingBookingFilter, take: 5 }` | **R1 Violation**: Returns top 5 bookings across ALL companies (reveals customer names, vehicles, destinations). | **Critical** |

#### Code Evidence & Flaws:
```typescript
// src/lib/dashboard-actions.ts:45-63
// VULNERABLE: Total lack of tenant isolation in dashboard metrics
const totalVehicles = await prisma.vehicle.count({ where: { status: 'ACTIVE' } });
const occupiedVehicles = await prisma.booking.count({ where: ongoingBookingFilter });

const yearlyResult = await prisma.bill.aggregate({
    _sum: { totalAmount: true },
    where: { createdAt: { gte: startOfYear, lte: endOfYear } }
});

const recentBills = await prisma.bill.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, billNumber: true, customerName: true, vehicleNo: true, totalAmount: true, ... }
});
```

---

### 4. `src/lib/customer-actions.ts` (Customer Actions)

| Function | Line Numbers | Query Type | Target Model | Current `where` Clause | Vulnerability Description | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `createCustomer` | 30-32 | `create` | `Customer` | N/A (data insert) | Uses `(session?.user as any)?.companyId` without ensuring it matches `authCheck.companyId`. | Low |
| `getCustomers` | 56-66 | `findMany` | `Customer` | `{ where: searchQuery ? { companyId, ... } : { companyId } }` | **R1 Violation**: If `companyId` is `undefined`, returns all customers across all tenants. | **Critical** |
| `updateCustomer` | 96-99 | `update` | `Customer` | `{ where: { id } }` | **R2 Violation**: Directly updates customer by `id`. Allows Company A to modify Company B's customer and overwrite `companyId`, stealing the customer. | **Critical** |
| `deleteCustomer` | 126 | `findUnique` | `Customer` | `{ where: { id } }` | Lookup lacks `companyId` constraint. | Medium |
| `deleteCustomer` | 132-136 | `count` (x3) | `Bill`, `Booking`, `Quotation` | `{ where: { customerName: customer.name } }` | Checks foreign references across ALL tenants rather than scoped to caller's company. | Medium |
| `deleteCustomer` | 150-152 | `delete` | `Customer` | `{ where: { id } }` | **R2 Violation**: Deletes customer by `id` without verifying `companyId`. Company A can delete Company B's customer. | **Critical** |

#### Code Evidence & Flaws:
```typescript
// src/lib/customer-actions.ts:96-99 (updateCustomer)
// VULNERABLE: Updates by ID alone and overwrites companyId to caller's company!
await prisma.customer.update({
    where: { id },
    data: { companyId: ((await auth())?.user as any)?.companyId as string, ...validatedData },
});

// src/lib/customer-actions.ts:150-152 (deleteCustomer)
// VULNERABLE: Deletes by ID alone without tenant verification
await prisma.customer.delete({
    where: { id },
});
```

---

### 5. `src/lib/vehicle-expense-actions.ts` (Vehicle Expenses)

| Function | Line Numbers | Query Type | Target Model | Current `where` Clause | Vulnerability Description | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `addVehicleExpense` | 35-46 | `findFirst` | `Booking` | `{ driverId, vehicleNo, status: 'CONFIRMED', ... }` | Missing `companyId: authCheck.companyId` filter. | Low |
| `getVehicleExpenses` | 110-113 | `findMany` | `VehicleExpense` | `{ where: vehicleNo ? { vehicleNo } : undefined }` | **R1 Violation**: `companyId` is extracted on line 109 but completely omitted from the query. Returns all expenses across all companies! | **Critical** |
| `deleteVehicleExpense` | 133-135 | `delete` | `VehicleExpense` | `{ where: { id } }` | **R2 Violation**: Deletes expense by `id` without verifying `companyId`. Company A admin can delete Company B expenses. | **Critical** |

#### Code Evidence & Flaws:
```typescript
// src/lib/vehicle-expense-actions.ts:109-113 (getVehicleExpenses)
// VULNERABLE: companyId variable is unused in query!
const companyId = (session?.user as any)?.companyId;
const expenses = await prisma.vehicleExpense.findMany({
    where: vehicleNo ? { vehicleNo } : undefined,
    orderBy: { date: 'desc' },
});

// src/lib/vehicle-expense-actions.ts:133-135 (deleteVehicleExpense)
// VULNERABLE: Unscoped delete by ID
await prisma.vehicleExpense.delete({
    where: { id },
});
```

---

### 6. `src/lib/trip-activity-actions.ts` (Trip Activities)

| Function | Line Numbers | Query Type | Target Model | Current `where` Clause | Vulnerability Description | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `logTripActivity` | 40-46, 48 | `findFirst`, `create` | `Booking`, `TripActivity` | `{ where: { id: bookingId, driverId, ... } }` | Admin bypass (`if (!booking && authCheck.role !== 'ADMIN')`) permits admin to create trip activities for ANY booking in the DB. | Medium |
| `getTripActivities` | 84-87 | `findMany` | `TripActivity` | `{ where: { bookingId } }` | **R1 Violation**: No `companyId` filter on query. Any user can view activities of any booking across tenants. | **High** |
| `getDriverTourHistory` | 125-133, 135-143 | `findMany` (x2) | `Booking` | `{ where: { driverId, status, ... } }` | **R1 Violation**: Does not filter by `companyId: authCheck.companyId`. | Medium |

#### Code Evidence & Flaws:
```typescript
// src/lib/trip-activity-actions.ts:84-87 (getTripActivities)
// VULNERABLE: companyId unused, bookingId query leaks across tenants
let session = await auth();
const companyId = (session?.user as any)?.companyId;
const activities = await prisma.tripActivity.findMany({
    where: { bookingId },
    orderBy: { timestamp: 'desc' },
});
```

---

### 7. `src/lib/tour-schedule-actions.ts` (Tour Schedules & Day Items)

| Function | Line Numbers | Query Type | Target Model | Current `where` Clause | Vulnerability Description | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `getTourSchedules` | 132-151 | `findMany` | `TourSchedule` | `{ where: { AND: [ { isActive: true }, ... ] } }` | **R1 Violation**: No `companyId` filter. All companies see each other's custom tour itineraries and prices. | **Critical** |
| `getTourScheduleById` | 167-172 | `findUnique` | `TourSchedule` | `{ where: { id } }` | **R2 Violation**: No auth, no `companyId` check. Exposes tour schedule by ID across tenants. | **Critical** |
| `updateTourSchedule` | 226-243 | `update` | `TourSchedule` | `{ where: { id } }` | **R2 Violation**: Updates schedule by `id` without verifying `companyId`. Company A can modify Company B's tour schedules. | **Critical** |
| `deleteTourSchedule` | 286-289 | `update` (soft delete) | `TourSchedule` | `{ where: { id } }` | **R2 Violation**: Sets `isActive: false` on schedule by `id` without checking `companyId`. | **Critical** |

#### Code Evidence & Flaws:
```typescript
// src/lib/tour-schedule-actions.ts:132-145 (getTourSchedules)
// VULNERABLE: No companyId filter
const schedules = await prisma.tourSchedule.findMany({
    where: {
        AND: [
            { isActive: true },
            searchQuery ? { ... } : {},
        ],
    },
    include: { items: true, _count: true }
});

// src/lib/tour-schedule-actions.ts:226-228 (updateTourSchedule)
// VULNERABLE: No companyId check
await tx.tourSchedule.update({
    where: { id },
    data: { ... }
});
```

---

### 8. `src/lib/profile-actions.ts` & `src/lib/auth-actions.ts`

- **`profile-actions.ts`**:
  - `updateProfile`: Updates `session.user.id` directly. Safe from cross-tenant mutation because it targets the authenticated user's own session ID.
  - `updatePassword`: Updates `session.user.id` directly after verifying old password with `bcrypt.compare`. Safe.
- **`auth-actions.ts`**:
  - `requestPasswordReset`: Public endpoint. Looks up `user` by `email` (globally unique), generates a secure token in `PasswordResetToken`, and logs or emails the link. Rate-limited.
  - `resetPassword`: Atomic transaction verifying token, updating password for `user.email`, and deleting the reset token. Safe.
- **`src/app/api/webhooks/subscription/route.ts`**:
  - PayHere webhook creates a new `BusinessProfile` (tenant) and an admin `User` linked to it via `companyId`. Properly sets up tenant isolation at creation.

---

## Action Plan & Remediation Blueprint

To comply with Requirements R1 and R2 from `ORIGINAL_REQUEST.md`:

### Requirement R1 Compliance Blueprint (Multi-Record Queries)
Every multi-record query (`findMany`, `count`, `aggregate`) must strictly filter by `companyId`:

1. **Enforce Authentication First**:
   ```typescript
   const authCheck = await requireAuth(); // or requireAdmin()
   if (!authCheck.authorized) {
       return { success: false, error: authCheck.error };
   }
   const companyId = authCheck.companyId;
   ```
2. **Inject `companyId` into all `where` clauses**:
   - `prisma.bill.findMany({ where: { companyId, ... } })`
   - `prisma.vehicle.count({ where: { companyId, status: 'ACTIVE' } })`
   - `prisma.booking.count({ where: { companyId, ...ongoingBookingFilter } })`
   - `prisma.bill.aggregate({ _sum: { totalAmount: true }, where: { companyId, createdAt: ... } })`
   - `prisma.user.findMany({ where: { companyId, role: 'DRIVER' } })`
   - `prisma.vehicleExpense.findMany({ where: { companyId, ...(vehicleNo ? { vehicleNo } : {}) } })`
   - `prisma.tourSchedule.findMany({ where: { companyId, isActive: true, ... } })`
   - `prisma.tripActivity.findMany({ where: { companyId, bookingId } })`

### Requirement R2 Compliance Blueprint (Single-Record Operations)
For all single-record operations (`findUnique`, `update`, `delete`):

1. **For Single Record Lookups**:
   Replace `findUnique({ where: { id } })` with `findFirst`:
   ```typescript
   const bill = await prisma.bill.findFirst({
       where: { id, companyId: authCheck.companyId }
   });
   if (!bill) return { success: false, error: 'Bill not found' };
   ```
2. **For Updates**:
   Use two-step ownership verification:
   ```typescript
   const existing = await prisma.bill.findFirst({
       where: { id, companyId: authCheck.companyId }
   });
   if (!existing) return { success: false, error: 'Bill not found' };

   const updated = await prisma.bill.update({
       where: { id },
       data: validatedData,
   });
   ```
   Or use `updateMany`:
   ```typescript
   const result = await prisma.customer.updateMany({
       where: { id, companyId: authCheck.companyId },
       data: validatedData,
   });
   if (result.count === 0) return { success: false, error: 'Customer not found' };
   ```
3. **For Deletions**:
   ```typescript
   const result = await prisma.bill.deleteMany({
       where: { id, companyId: authCheck.companyId }
   });
   if (result.count === 0) return { success: false, error: 'Bill not found' };
   ```
   Or verify ownership via `findFirst` and then delete.
4. **For Business Profile (`actions.ts`)**:
   Query and update specifically by the user's tenant ID:
   ```typescript
   const profile = await prisma.businessProfile.findUnique({
       where: { id: authCheck.companyId }
   });
   ```
   And on update:
   ```typescript
   const profile = await prisma.businessProfile.update({
       where: { id: authCheck.companyId },
       data: validatedData,
   });
   ```

---

## Conclusion

The server actions covering Bills, Users, Company Profile, Dashboard, Customers, Expenses, Tour Schedules, and Trip Activities suffer from critical cross-tenant vulnerabilities violating both R1 and R2. By applying the standardized `requireAuth()`/`requireAdmin()` guard, enforcing strict `companyId` filters on all multi-record queries, and adopting two-step validation or `updateMany`/`deleteMany` on single-record operations, full multi-tenant isolation will be achieved.
