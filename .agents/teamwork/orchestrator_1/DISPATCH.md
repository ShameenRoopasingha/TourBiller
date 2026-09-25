# Dispatch Log

## 2026-09-25T02:56:25Z

You are the Project Orchestrator (orchestrator_1).
Your working directory is: e:\projects\tourBiller\.agents\teamwork\orchestrator_1\
The project root is: e:\projects\tourBiller\
The authoritative user request is recorded in: e:\projects\tourBiller\.agents\teamwork\ORIGINAL_REQUEST.md

User Request Summary:
The user explicitly requested:
"Use a very large team of agents. Break the work down and assign it to a very large team." ("ගොඩක් ලොකු කණ්ඩායමකට කඩලා දෙන්න")

Task: Conduct a thorough Multi-Tenant security and data isolation test and fix on the Next.js `tourBiller` application. The goal is to ensure that a user belonging to Company A cannot view, edit, or delete any Bills, Vehicles, Bookings, Quotations, or Users belonging to Company B.
Integrity mode: development.

Key Requirements:
1. R1: Patch Vulnerable Server Actions (in `src/lib/*-actions.ts`). Every database query fetching multiple records (`findMany`, `count`, `aggregate`) must include a `companyId: session.user.companyId` filter.
2. R2: Secure Single-Record Operations (`findUnique`, `update`, `delete`). Ensure record belongs to `session.user.companyId`. Use `findFirst`, `updateMany`, `deleteMany`, or two-step validation.
3. R3: Automated Verification Script: Write and execute an automated Node.js test script (e.g., `test-isolation.js`) creating two dummy companies in the database and explicitly testing cross-tenant isolation on vehicles, bookings, bills, etc.
4. Acceptance Criteria:
   - Automated test script executes and confirms cross-tenant data access is blocked.
   - `npx tsc --noEmit` returns 0 compilation errors.
