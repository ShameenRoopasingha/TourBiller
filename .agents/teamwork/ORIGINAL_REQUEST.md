# Original User Request

## 2026-09-25T02:55:27Z

# Teamwork Project Prompt — Draft

> Status: Ready for launch — awaiting user approval
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: very large team ("ගොඩක් ලොකු කණ්ඩායමකට කඩලා දෙන්න")

Use a very large team of agents. Break the work down and assign it to a very large team.

Conduct a thorough Multi-Tenant security and data isolation test and fix on the Next.js `tourBiller` application. The goal is to ensure that a user belonging to Company A cannot view, edit, or delete any Bills, Vehicles, Bookings, Quotations, or Users belonging to Company B.

Working directory: e:\projects\tourBiller
Integrity mode: development

## Requirements

### R1. Patch Vulnerable Server Actions
The team must fix the multi-tenant data leaks in all Server Actions (`src/lib/*-actions.ts`). Every database query that fetches multiple records (`findMany`, `count`, `aggregate`) must include a `companyId: session.user.companyId` filter.

### R2. Secure Single-Record Operations
For database operations that target a specific ID (`findUnique`, `update`, `delete`), the team must ensure the record belongs to the user's `companyId`. Since Prisma requires unique fields for `findUnique`/`update`/`delete`, the team should change these queries to `findFirst`, `updateMany`, `deleteMany`, or implement a two-step validation (fetch with `findFirst` to verify ownership, then proceed) to safely enforce the `companyId` constraint.

### R3. Automated Verification Script
The team must write and run an automated Node.js test script (e.g., `test-isolation.js`) that creates two dummy companies in the database and explicitly tests that one company cannot access or modify the other company's vehicles, bookings, or bills using the Server Actions.

## Acceptance Criteria

### Security Verification
- [ ] An automated test script successfully executes and confirms that cross-tenant data access is blocked.
- [ ] Running `npx tsc --noEmit` on the codebase returns 0 compilation errors after the fixes are applied.
