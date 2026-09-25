# Dispatch: Worker M3 (Bills, BusinessProfile, Dashboard, Users, Customers)

## Mandatory Context
- Original Request: `e:\projects\tourBiller\.agents\teamwork\ORIGINAL_REQUEST.md` (read first!)
- Project Plan: `e:\projects\tourBiller\.agents\teamwork\orchestrator_1\PROJECT.md`
- Survey Findings: `e:\projects\tourBiller\.agents\teamwork\explorer_survey_2\report.md`

## Write Ownership
You EXCLUSIVELY own and modify:
- `src/lib/actions.ts`
- `src/lib/dashboard-actions.ts`
- `src/lib/user-actions.ts`
- `src/lib/customer-actions.ts`
Do NOT modify any other files.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Objectives & Remediation Requirements
1. **`src/lib/actions.ts`**:
   - `getBills(searchQuery)`: Require auth. Filter by `companyId: authCheck.companyId` consistently in all branches.
   - `getBillById(id)`: Require auth. Ensure bill belongs to `authCheck.companyId`.
   - `updateBill(id, formData)`: Require auth. Enforce two-step check (`findFirst({ where: { id, companyId: authCheck.companyId } })`) before updating.
   - `deleteBill(id)`: Require auth. Enforce two-step check (`findFirst({ where: { id, companyId: authCheck.companyId } })`) before deleting.
   - `createBill(formData)`: When auto-closing booking (`status: 'COMPLETED'`), verify that `booking.companyId === authCheck.companyId` so Tenant A cannot alter Tenant B's booking status.
   - `getBusinessProfile()`: Scope by `authCheck.companyId` (`findFirst({ where: { id: authCheck.companyId } })` or `findUnique({ where: { id: authCheck.companyId } })`), NEVER unscoped `findFirst()`.
   - `updateBusinessProfile(formData)`: Ensure profile belongs to `authCheck.companyId` and updates only that tenant's profile.
2. **`src/lib/dashboard-actions.ts`**:
   - `getDashboardStats()`: Require auth! Add `companyId: authCheck.companyId` to all 7 queries (`vehicle.count`, `booking.count`, 3x `bill.aggregate`, `bill.findMany`, `booking.findMany`).
3. **`src/lib/user-actions.ts`**:
   - `getUsers()`: Require auth. Ensure `companyId: authCheck.companyId`.
   - `getDrivers()`: Require auth. Filter `prisma.user.findMany({ where: { role: 'DRIVER', companyId: authCheck.companyId } })`.
   - `deleteUser(id)`: Require admin auth. Verify target user belongs to `authCheck.companyId` before deleting.
   - `checkDriverAvailability`: Require auth. Filter booking/quotation conflict queries by `companyId: authCheck.companyId`.
4. **`src/lib/customer-actions.ts`**:
   - `updateCustomer(id, formData)`: Enforce two-step check (`findFirst({ where: { id, companyId: authCheck.companyId } })`) to prevent cross-tenant customer takeover. Do not allow reassigning `companyId`.
   - `deleteCustomer(id)`: Enforce two-step check (`findFirst({ where: { id, companyId: authCheck.companyId } })`) before deleting.

## Verification & Output
- Run `npx tsc --noEmit` to ensure 0 TypeScript compilation errors.
- Document all changes and verification outputs in `e:\projects\tourBiller\.agents\teamwork\worker_m3\changes.md` and write `handoff.md`.

## 2026-09-25T03:04:12Z
You are Worker M3 for the TourBiller Multi-Tenant Security project.
Your working directory is: e:\projects\tourBiller\.agents\teamwork\worker_m3\
Read e:\projects\tourBiller\.agents\teamwork\ORIGINAL_REQUEST.md, e:\projects\tourBiller\.agents\teamwork\orchestrator_1\PROJECT.md, and e:\projects\tourBiller\.agents\teamwork\worker_m3\DISPATCH.md before starting work.
You exclusively own and modify:
- src/lib/actions.ts
- src/lib/dashboard-actions.ts
- src/lib/user-actions.ts
- src/lib/customer-actions.ts
Implement R1 (add companyId filters in getBills, all 7 queries in getDashboardStats, getDrivers, getUsers, checkDriverAvailability) and R2 (two-step verification before updateBill, deleteBill, getBillById, updateBusinessProfile, deleteUser, updateCustomer, deleteCustomer, booking auto-close ownership verification in createBill).
MANDATORY INTEGRITY WARNING: DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
Verify your changes by running `npx tsc --noEmit` to ensure 0 compilation errors.
Write your report to e:\projects\tourBiller\.agents\teamwork\worker_m3\changes.md and write e:\projects\tourBiller\.agents\teamwork\worker_m3\handoff.md. Notify me when done.

