# Project: TourBiller Multi-Tenant Security & Isolation

## Architecture
- **Tenant Root Model**: `BusinessProfile` (`id` is primary tenant key).
- **Session Authentication & Tenancy Resolution**: `src/lib/auth-guard.ts` (`requireAuth`, `requireAdmin`) and `src/lib/auth.ts` resolve authenticated `session.user.companyId`.
- **Tenancy Boundary Principle**: No tenant may read, modify, delete, count, or aggregate records belonging to another tenant (`companyId: session.user.companyId`).
- **Prisma Strategy**: Because composite unique index `@@unique([companyId, id])` is not present in `schema.prisma`, single-record queries (`findUnique`, `update`, `delete`) must enforce tenancy via:
  1. Two-Step Verification: `findFirst({ where: { id, companyId } })` to confirm ownership, returning not found/unauthorized if null; followed by the operation.
  2. Or `updateMany` / `deleteMany` with `{ where: { id, companyId } }`.
- **Multi-Record Operations**: Every `findMany`, `count`, `aggregate` must include `where: { ...otherFilters, companyId: authCheck.companyId }`.

## Feature Inventory
| # | Feature / Action Area | Description | Milestone | Source |
|---|-----------------------|-------------|-----------|--------|
| 1 | Vehicle Actions | `getVehicles`, `updateVehicle`, `deleteVehicle`, `checkVehicleAvailability` | M1 | Survey 1 |
| 2 | Booking Actions | `getBookings` (all search branches), `getBookingById`, `cancelBooking` | M1 | Survey 1 |
| 3 | Quotation Actions | `generateQuotation` (save companyId), `getQuotationById`, `updateQuotation`, `updateQuotationStatus`, `deleteQuotation`, `convertQuotationToBooking` | M1 | Survey 1 |
| 4 | Tour Schedule Actions | `getTourSchedules`, `getTourScheduleById`, `updateTourSchedule`, `deleteTourSchedule` | M2 | Survey 1 & 2 |
| 5 | Vehicle Expense Actions | `getVehicleExpenses`, `deleteVehicleExpense` | M2 | Survey 1 & 2 |
| 6 | Trip Activity Actions | `getTripActivities`, `logTripActivity` tenant scoping | M2 | Survey 1 |
| 7 | Bill Actions | `getBills`, `getBillById`, `updateBill`, `deleteBill`, `createBill` (booking auto-close check) | M3 | Survey 2 |
| 8 | BusinessProfile Actions | `getBusinessProfile`, `updateBusinessProfile` (scoped by tenant companyId instead of findFirst) | M3 | Survey 2 |
| 9 | Dashboard Stats Actions | `getDashboardStats` (7 queries: vehicle count, booking count, bill aggregates, recent lists) | M3 | Survey 2 |
| 10 | User Actions | `getUsers`, `getDrivers`, `deleteUser`, `checkDriverAvailability` | M3 | Survey 2 |
| 11 | Customer Actions | `updateCustomer`, `deleteCustomer` | M3 | Survey 2 |
| 12 | Automated Verification Harness (R3) | `test-isolation.js` script with two dummy companies testing cross-tenant read/write/delete isolation | M4 | ORIGINAL_REQUEST R3 |
| 13 | Final E2E Suite, Challenger & Audit | Run test suite, adversarial challenge tests, forensic integrity audit | M5 | ORIGINAL_REQUEST Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Vehicles, Bookings & Quotations Actions | `src/lib/vehicle-actions.ts`, `src/lib/booking-actions.ts`, `src/lib/quotation-actions.ts` | Survey | READY |
| M2 | Tour Schedules, Expenses & Trip Activities | `src/lib/tour-schedule-actions.ts`, `src/lib/vehicle-expense-actions.ts`, `src/lib/trip-activity-actions.ts` | Survey | READY |
| M3 | Bills, Profile, Dashboard, Users & Customers | `src/lib/actions.ts`, `src/lib/dashboard-actions.ts`, `src/lib/user-actions.ts`, `src/lib/customer-actions.ts` | Survey | READY |
| M4 | Automated Isolation Verification Script (R3) | `test-isolation.js` automated test suite executing cross-tenant tests | Survey | READY |
| M5 | Final E2E Verification, Adversarial Hardening & Audit | 100% test pass, Challenger stress testing, Forensic Auditor verification | M1, M2, M3, M4 | PENDING |

## Code Layout & Write Boundaries
- **Milestone 1 Worker**: Exclusive write access to `src/lib/vehicle-actions.ts`, `src/lib/booking-actions.ts`, `src/lib/quotation-actions.ts`.
- **Milestone 2 Worker**: Exclusive write access to `src/lib/tour-schedule-actions.ts`, `src/lib/vehicle-expense-actions.ts`, `src/lib/trip-activity-actions.ts`.
- **Milestone 3 Worker**: Exclusive write access to `src/lib/actions.ts`, `src/lib/dashboard-actions.ts`, `src/lib/user-actions.ts`, `src/lib/customer-actions.ts`.
- **Milestone 4 Test Writer**: Exclusive write access to `test-isolation.js` and any auxiliary test harness files.

## Interface Contracts
- **Auth Guard**:
  ```typescript
  const authCheck = await requireAuth(); // or requireAdmin()
  if (!authCheck.authorized || !authCheck.companyId) {
    return { success: false, error: 'Unauthorized: Access denied' };
  }
  const companyId = authCheck.companyId;
  ```
- **R1 Pattern (Multi-Record Queries)**:
  ```typescript
  const records = await prisma.model.findMany({
    where: {
      AND: [
        { companyId },
        additionalFilter ? { ... } : {},
      ],
    },
    ...
  });
  ```
- **R2 Pattern (Single-Record Ownership & Mutation)**:
  ```typescript
  const existing = await prisma.model.findFirst({
    where: { id, companyId },
  });
  if (!existing) {
    return { success: false, error: 'Record not found or access denied' };
  }
  // Proceed with update or delete
  ```
