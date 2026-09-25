# Dispatch: Worker M2 (Tour Schedules, Vehicle Expenses, Trip Activities)

## Mandatory Context
- Original Request: `e:\projects\tourBiller\.agents\teamwork\ORIGINAL_REQUEST.md` (read first!)
- Project Plan: `e:\projects\tourBiller\.agents\teamwork\orchestrator_1\PROJECT.md`
- Survey Findings: `e:\projects\tourBiller\.agents\teamwork\explorer_survey_1\report.md` and `explorer_survey_2\report.md`

## Write Ownership
You EXCLUSIVELY own and modify:
- `src/lib/tour-schedule-actions.ts`
- `src/lib/vehicle-expense-actions.ts`
- `src/lib/trip-activity-actions.ts`
Do NOT modify any other files.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Objectives & Remediation Requirements
1. **`src/lib/tour-schedule-actions.ts`**:
   - `getTourSchedules(searchQuery)`: Require auth. Include `companyId: authCheck.companyId` in `where` query.
   - `getTourScheduleById`: Require auth. Enforce `companyId: authCheck.companyId` check via `findFirst` or ownership validation.
   - `updateTourSchedule`: Enforce two-step check verifying target tour schedule belongs to `authCheck.companyId` before updating.
   - `deleteTourSchedule`: Enforce two-step check verifying target tour schedule belongs to `authCheck.companyId` before soft-deleting.
2. **`src/lib/vehicle-expense-actions.ts`**:
   - `getVehicleExpenses`: Enforce `companyId: authCheck.companyId` in `prisma.vehicleExpense.findMany({ where: { companyId, ...(vehicleNo ? { vehicleNo } : {}) } })`. Ensure `companyId` is not ignored!
   - `deleteVehicleExpense`: Enforce two-step verification (`findFirst({ where: { id, companyId: authCheck.companyId } })`) before deleting.
3. **`src/lib/trip-activity-actions.ts`**:
   - `getTripActivities`: Verify booking belongs to `companyId` before returning activities.
   - `logTripActivity`: Enforce tenant check for all roles (do not bypass tenant check for ADMIN of another company).

## Verification & Output
- Run `npx tsc --noEmit` to ensure 0 TypeScript compilation errors.
- Document all changes and verification outputs in `e:\projects\tourBiller\.agents\teamwork\worker_m2\changes.md` and write `handoff.md`.

## 2026-09-25T03:04:12Z
You are Worker M2 for the TourBiller Multi-Tenant Security project.
Your working directory is: e:\projects\tourBiller\.agents\teamwork\worker_m2\
Read e:\projects\tourBiller\.agents\teamwork\ORIGINAL_REQUEST.md, e:\projects\tourBiller\.agents\teamwork\orchestrator_1\PROJECT.md, and e:\projects\tourBiller\.agents\teamwork\worker_m2\DISPATCH.md before starting work.
You exclusively own and modify:
- src/lib/tour-schedule-actions.ts
- src/lib/vehicle-expense-actions.ts
- src/lib/trip-activity-actions.ts
Implement R1 (add companyId filters to getTourSchedules, getVehicleExpenses, getTripActivities) and R2 (two-step ownership check before updateTourSchedule, deleteTourSchedule, deleteVehicleExpense, logTripActivity).
MANDATORY INTEGRITY WARNING: DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
Verify your changes by running `npx tsc --noEmit` to ensure 0 compilation errors.
Write your report to e:\projects\tourBiller\.agents\teamwork\worker_m2\changes.md and write e:\projects\tourBiller\.agents\teamwork\worker_m2\handoff.md. Notify me when done.

