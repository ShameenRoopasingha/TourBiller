# Dispatch: Worker M1 (Vehicles, Bookings, Quotations)

## Mandatory Context
- Original Request: `e:\projects\tourBiller\.agents\teamwork\ORIGINAL_REQUEST.md` (read first!)
- Project Plan: `e:\projects\tourBiller\.agents\teamwork\orchestrator_1\PROJECT.md`
- Survey Findings: `e:\projects\tourBiller\.agents\teamwork\explorer_survey_1\report.md`

## Write Ownership
You EXCLUSIVELY own and modify:
- `src/lib/vehicle-actions.ts`
- `src/lib/booking-actions.ts`
- `src/lib/quotation-actions.ts`
Do NOT modify any other files.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Objectives & Remediation Requirements
1. **`src/lib/vehicle-actions.ts`**:
   - `getVehicles(searchQuery)`: Require auth (`await requireAuth()`). Filter by `companyId: authCheck.companyId` in both search and non-search branches.
   - `updateVehicle`: Enforce two-step verification (`findFirst({ where: { id, companyId: authCheck.companyId } })`). If not found, return `{ success: false, error: '...' }`. Do not allow reassigning `companyId`.
   - `deleteVehicle`: Verify vehicle belongs to tenant via `findFirst({ where: { id, companyId: authCheck.companyId } })`. Also verify related vehicle expense count is scoped by `companyId`.
   - `checkVehicleAvailability`: Require auth. Filter all queries (`bill.findMany`, `booking.findMany`, `quotation.findMany`) with `companyId: authCheck.companyId`.
2. **`src/lib/booking-actions.ts`**:
   - `getBookings(searchQuery)`: Fix ternary operator bug! When `searchQuery` is present, `companyId: authCheck.companyId` MUST STILL BE INCLUDED (e.g. `where: { companyId, ...(searchQuery ? { OR: [...] } : {}) }` or `AND: [{ companyId }, ...]`).
   - `cancelBooking`: Enforce two-step check (`findFirst({ where: { id, companyId: authCheck.companyId } })`).
   - `getBookingById`: Require auth. Verify `booking.companyId === authCheck.companyId` or use `findFirst({ where: { id, companyId: authCheck.companyId } })`.
3. **`src/lib/quotation-actions.ts`**:
   - `generateQuotation`: When inserting into database via `prisma.quotation.create`, include `companyId: authCheck.companyId`! Also verify `tourScheduleId` belongs to `companyId` if provided.
   - `getQuotationById`: Require auth. Enforce `companyId` match.
   - `updateQuotation`, `updateQuotationStatus`, `deleteQuotation`: Enforce two-step verification ensuring target quotation belongs to `companyId`.
   - `convertQuotationToBooking`: Verify quotation belongs to `companyId`.

## Verification & Output
- Run `npx tsc --noEmit` to ensure 0 TypeScript compilation errors.
- Document all changes and verification outputs in `e:\projects\tourBiller\.agents\teamwork\worker_m1\changes.md` and write `handoff.md`.

## 2026-09-25T03:04:12Z
You are Worker M1 for the TourBiller Multi-Tenant Security project.
Your working directory is: e:\projects\tourBiller\.agents\teamwork\worker_m1\
Read e:\projects\tourBiller\.agents\teamwork\ORIGINAL_REQUEST.md, e:\projects\tourBiller\.agents\teamwork\orchestrator_1\PROJECT.md, and e:\projects\tourBiller\.agents\teamwork\worker_m1\DISPATCH.md before starting work.
You exclusively own and modify:
- src/lib/vehicle-actions.ts
- src/lib/booking-actions.ts
- src/lib/quotation-actions.ts
Implement R1 (add companyId filters to findMany/count/aggregate in all branches) and R2 (two-step ownership validation before findUnique/update/delete).
MANDATORY INTEGRITY WARNING: DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
Verify your changes by running `npx tsc --noEmit` to ensure 0 compilation errors.
Write your report to e:\projects\tourBiller\.agents\teamwork\worker_m1\changes.md and write e:\projects\tourBiller\.agents\teamwork\worker_m1\handoff.md. Notify me when done.
