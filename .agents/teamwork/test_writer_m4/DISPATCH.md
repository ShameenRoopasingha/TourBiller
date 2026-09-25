# Dispatch: Test Writer M4 (Automated Multi-Tenant Isolation Test Suite - R3)

## Mandatory Context
- Original Request: `e:\projects\tourBiller\.agents\teamwork\ORIGINAL_REQUEST.md` (read first!)
- Project Plan: `e:\projects\tourBiller\.agents\teamwork\orchestrator_1\PROJECT.md`
- Survey Findings: `e:\projects\tourBiller\.agents\teamwork\spec_miner_survey\report.md`

## Write Ownership
You EXCLUSIVELY own and modify:
- `test-isolation.js` (at project root `e:\projects\tourBiller\test-isolation.js`)
- Any helper test scripts (e.g. `scripts/test-isolation.js`)
Do NOT modify application source code in `src/`.

## Mandatory Integrity Warning
DO NOT CHEAT. All test implementations must be genuine. The test suite must rigorously exercise actual server actions or Prisma queries against real database instances (or mock NextAuth session contexts) to verify true cross-tenant data isolation.

## Objectives & Requirements
Requirement R3:
"Write and run an automated Node.js test script (e.g., test-isolation.js) that creates two dummy companies in the database and explicitly tests that one company cannot access or modify the other company's vehicles, bookings, or bills using the Server Actions."

Test Architecture & Scenarios:
1. **Setup**:
   - Connect using Prisma Client (`@prisma/client`).
   - Create Company A (`BusinessProfile`) and Company B (`BusinessProfile`).
   - Create Admin User A (belonging to Company A) and Admin User B (belonging to Company B).
2. **Entity Seeding**:
   - Seed test data for Company A: Vehicle A, Booking A, Quotation A, Bill A, Customer A, Vehicle Expense A, Tour Schedule A.
   - Seed test data for Company B: Vehicle B, Booking B, Quotation B, Bill B, Customer B.
3. **Cross-Tenant Attack Vectors (Assert Blocked/Contained)**:
   - **Vector 1 (Vehicles)**: Company B user cannot see Vehicle A in `getVehicles()`. Company B cannot `updateVehicle` or `deleteVehicle` belonging to Company A.
   - **Vector 2 (Bookings)**: Company B user cannot see Booking A in `getBookings()` (with and without searchQuery). Company B cannot `cancelBooking` or view `getBookingById` of Booking A.
   - **Vector 3 (Bills)**: Company B user cannot see Bill A in `getBills()`. Company B cannot `updateBill`, `deleteBill`, or view `getBillById` of Bill A.
   - **Vector 4 (Quotations)**: Company B user cannot view or mutate Quotation A. `generateQuotation` properly attaches caller's `companyId`.
   - **Vector 5 (Company Profile)**: Company B cannot overwrite Company A's `BusinessProfile`.
   - **Vector 6 (Dashboard Stats)**: Company B's `getDashboardStats()` aggregates only Company B's vehicles, bookings, and revenue, showing 0 or Company B values, not Company A values.
   - **Vector 7 (Customers & Expenses)**: Company B cannot take over Customer A or delete Expense A.
4. **Teardown / Cleanup**:
   - Ensure clean cascading deletion of all dummy test records so the database is left pristine.
5. **Execution & Runner**:
   - Ensure `node test-isolation.js` runs cleanly from command line and exits with code 0 on all tests passing, or non-zero on failure.
   - Run the script to verify.
   - Publish `TEST_READY.md` summarizing test counts across Tiers 1-4.

Document your test implementation in `e:\projects\tourBiller\.agents\teamwork\test_writer_m4\report.md` and write `handoff.md`.

## 2026-09-25T03:04:12Z
You are the Test Suite Designer & Writer for Milestone 4 (E2E Multi-Tenant Isolation Testing Track) in TourBiller.
Your working directory is: e:\projects\tourBiller\.agents\teamwork\test_writer_m4\
Read e:\projects\tourBiller\.agents\teamwork\ORIGINAL_REQUEST.md, e:\projects\tourBiller\.agents\teamwork\orchestrator_1\PROJECT.md, and e:\projects\tourBiller\.agents\teamwork\test_writer_m4\DISPATCH.md before starting work.
You exclusively own and create:
- test-isolation.js (at project root e:\projects\tourBiller\test-isolation.js)
Design and implement an automated Node.js test script using Prisma Client and the actual Server Actions / session contexts that:
1. Creates two dummy companies (Company A and Company B) and respective admin users in the database.
2. Seeds test entities (vehicles, bookings, quotations, bills, customers, expenses, tour schedules) for Company A.
3. Rigorously executes cross-tenant security attack vectors: verifying Company B cannot read, search, update, delete, or aggregate Company A's data.
4. Cleans up all test data reliably on exit (pass or fail).
5. Exits with code 0 on success.
Run `node test-isolation.js` to verify test execution and results.
Publish `TEST_READY.md` summarizing test counts across Tiers 1-4.
Write your report to e:\projects\tourBiller\.agents\teamwork\test_writer_m4\report.md and write e:\projects\tourBiller\.agents\teamwork\test_writer_m4\handoff.md. Notify me when done.
