# Handoff Report: Explorer Survey 2 (Bill, User, Company, Dashboard & Auxiliary Server Actions)

## 1. Observation
Direct source code examination across `src/lib/` revealed multiple multi-tenant data leaks and missing `companyId` ownership constraints:

1. **`src/lib/actions.ts`**:
   - `updateBill(id, formData)` (lines 224-231): Calls `prisma.bill.update({ where: { id }, data: { ... } })` without scoping to `authCheck.companyId`.
   - `deleteBill(id)` (lines 423-425): Calls `prisma.bill.delete({ where: { id } })` without checking `companyId`.
   - `getBillById(id)` (lines 309-311): Calls `prisma.bill.findUnique({ where: { id } })` with no authentication and no tenant filter.
   - `createBill(formData)` (lines 112-115): Calls `prisma.booking.update({ where: { id: bookingId }, data: { status: 'COMPLETED' } })` using untrusted `bookingId` without verifying `booking.companyId`.
   - `getBusinessProfile()` (line 341): Calls `prisma.businessProfile.findFirst()`, unconditionally retrieving the first business profile in the database.
   - `updateBusinessProfile(formData)` (lines 387, 391-394): Calls `prisma.businessProfile.findFirst()` followed by `prisma.businessProfile.update({ where: { id: existingProfile.id }, data: validatedData })`, overwriting Tenant A's profile when Tenant B saves settings.
   - `getBills(searchQuery)` (lines 275-288): Lacks `requireAuth()`. Uses `{ companyId: ((await auth())?.user as any)?.companyId }`. When unauthenticated, `companyId` is `undefined`, causing Prisma to omit the tenant filter and return all bills.

2. **`src/lib/user-actions.ts`**:
   - `deleteUser(id)` (line 238): Calls `prisma.user.delete({ where: { id } })` without verifying target user's `companyId`.
   - `getDrivers()` (lines 257-261): Calls `prisma.user.findMany({ where: { role: 'DRIVER' } })` without any `companyId` filter or authentication.
   - `checkDriverAvailability` (lines 29-44, 55-66): Queries `prisma.booking.findMany` and `prisma.quotation.findMany` for conflicts without filtering by `companyId`.
   - `getUsers()` (lines 123-133): Lacks auth guard; `where: { companyId }` evaluates to empty where clause if `companyId` is undefined.

3. **`src/lib/dashboard-actions.ts`**:
   - `getDashboardStats()` (lines 45-92): All 7 database queries (`vehicle.count`, `booking.count`, 3x `bill.aggregate`, `bill.findMany`, `booking.findMany`) lack authentication and contain zero `companyId` filters.

4. **`src/lib/customer-actions.ts`**:
   - `updateCustomer(id, formData)` (lines 96-99): Calls `prisma.customer.update({ where: { id }, data: { companyId: ..., ... } })`, allowing cross-tenant customer takeover.
   - `deleteCustomer(id)` (lines 150-152): Calls `prisma.customer.delete({ where: { id } })` without verifying customer's `companyId`.

5. **`src/lib/vehicle-expense-actions.ts` & `src/lib/tour-schedule-actions.ts` & `src/lib/trip-activity-actions.ts`**:
   - `getVehicleExpenses` (lines 110-113): Omits `companyId` from `findMany({ where: vehicleNo ? { vehicleNo } : undefined })`.
   - `deleteVehicleExpense` (line 133): Deletes expense using `where: { id }` alone.
   - `getTourSchedules` (line 132): Unscoped `findMany` returns all tour schedules across all tenants.
   - `updateTourSchedule` (line 226) & `deleteTourSchedule` (line 286): Unscoped `update` targeting `where: { id }`.
   - `getTripActivities` (lines 84-87): Queries activities by `bookingId` without checking tenant ownership.

## 2. Logic Chain
1. *Premise*: Requirement R1 stipulates that every database query fetching multiple records (`findMany`, `count`, `aggregate`) must include a `companyId: session.user.companyId` filter.
2. *Observation Reference*: In `dashboard-actions.ts:45-92`, `user-actions.ts:257`, `vehicle-expense-actions.ts:110`, `tour-schedule-actions.ts:132`, and `trip-activity-actions.ts:84`, queries omit `companyId`.
3. *Inference*: Any user from Company A can view financial aggregates, active vehicle counts, driver directories, vehicle expenses, tour schedules, and trip logs belonging to Company B.
4. *Premise*: Requirement R2 stipulates that for database operations targeting a specific ID (`findUnique`, `update`, `delete`), tenant ownership must be verified via `findFirst`, `updateMany`, `deleteMany`, or two-step validation.
5. *Observation Reference*: In `actions.ts:224, 423, 309`, `user-actions.ts:238`, `customer-actions.ts:96, 150`, `vehicle-expense-actions.ts:133`, and `tour-schedule-actions.ts:226, 286`, operations target `{ where: { id } }` directly with no `companyId` validation.
6. *Inference*: A malicious or rogue tenant administrator in Company A can read, modify, or delete bills, users, customers, expenses, and tour schedules belonging to Company B simply by supplying Company B entity IDs.
7. *Premise*: In `actions.ts:341-394`, `BusinessProfile` is queried with `findFirst()`.
8. *Inference*: All tenants share and overwrite the first `BusinessProfile` row, destroying multi-tenant separation for invoices, branding, and bank details.

## 3. Caveats
- Explorer Survey 1 is concurrently surveying `vehicle-actions.ts`, `booking-actions.ts`, and `quotation-actions.ts`. While auxiliary booking references in `actions.ts` (e.g., auto-closing bookings) and `user-actions.ts` (driver availability) were audited here, primary booking and vehicle actions are owned by Survey 1.
- Authentication callback in `src/lib/auth.ts` correctly embeds `companyId` in the JWT token and session object, so `session.user.companyId` and `authCheck.companyId` are available once `requireAuth()` or `requireAdmin()` is invoked.

## 4. Conclusion
The analyzed server actions are critically vulnerable to cross-tenant data leaks and unauthorized cross-tenant mutations. To remediate:
1. Wrap all server actions with `requireAuth()` or `requireAdmin()`.
2. Replace all `prisma.businessProfile.findFirst()` calls with `where: { id: authCheck.companyId }`.
3. Add `companyId: authCheck.companyId` to all `findMany`, `count`, and `aggregate` queries.
4. Replace single-record operations on `Bill`, `User`, `Customer`, `VehicleExpense`, and `TourSchedule` with two-step validation (`findFirst` with `companyId` check) or `updateMany` / `deleteMany`.

Full inventory and line-by-line remediation details are documented in `e:\projects\tourBiller\.agents\teamwork\explorer_survey_2\report.md`.

## 5. Verification Method
1. **Independent File Inspection**:
   - Inspect `src/lib/actions.ts` lines 224, 309, 341, 387, 423.
   - Inspect `src/lib/dashboard-actions.ts` lines 45-92.
   - Inspect `src/lib/user-actions.ts` lines 123, 238, 257.
   - Inspect `src/lib/customer-actions.ts` lines 96, 150.
2. **Automated Cross-Tenant Isolation Script**:
   - Run the automated test script specified in R3 (`node test-isolation.js` or `npm run test`):
     - Create Company A and Company B.
     - Call `getDashboardStats`, `getBills`, `getDrivers`, `getTourSchedules` as Company A -> verify no Company B data is returned.
     - Attempt `updateBill`, `deleteBill`, `deleteUser`, `updateCustomer` from Company A using Company B IDs -> verify action fails with 401/404/Access Denied.
3. **TypeScript Compilation Check**:
   - Execute `npx tsc --noEmit` from the root directory to confirm 0 compilation errors.
