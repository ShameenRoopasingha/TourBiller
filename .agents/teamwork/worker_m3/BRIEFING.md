# BRIEFING — 2026-09-25T03:04:12Z

## Mission
Implement multi-tenant data isolation (R1) and ownership checks (R2) for Bills, BusinessProfile, Dashboard, Users, and Customers in TourBiller.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: e:\projects\tourBiller\.agents\teamwork\worker_m3\
- Original parent: 63a5aab3-ebb7-4ceb-9a6d-9d5f14464f86
- Milestone: M3 (Bills, BusinessProfile, Dashboard, Users, Customers)

## 🔒 Key Constraints
- Exclusive write ownership: `src/lib/actions.ts`, `src/lib/dashboard-actions.ts`, `src/lib/user-actions.ts`, `src/lib/customer-actions.ts`. Do NOT modify any other files.
- Mandatory integrity: No cheats, no dummy implementations, no hardcoded values.
- Verify with `npx tsc --noEmit` (0 compilation errors).
- Document changes in `changes.md` and write `handoff.md`.

## Current Parent
- Conversation ID: 63a5aab3-ebb7-4ceb-9a6d-9d5f14464f86
- Updated: 2026-09-25T03:04:12Z

## Task Summary
- **What to build**: Secure all server actions in M3 write scope for multi-tenant isolation.
  - `src/lib/actions.ts`: `getBills`, `getBillById`, `updateBill`, `deleteBill`, `createBill` (booking auto-close check), `getBusinessProfile`, `updateBusinessProfile`.
  - `src/lib/dashboard-actions.ts`: `getDashboardStats` (all 7 queries scoped to companyId).
  - `src/lib/user-actions.ts`: `getUsers`, `getDrivers`, `deleteUser`, `checkDriverAvailability`.
  - `src/lib/customer-actions.ts`: `updateCustomer`, `deleteCustomer`.
- **Success criteria**: 0 compilation errors via `npx tsc --noEmit`, all R1 and R2 multi-tenant constraints satisfied.
- **Interface contracts**: `e:\projects\tourBiller\.agents\teamwork\orchestrator_1\PROJECT.md`
- **Code layout**: `src/lib/*-actions.ts`

## Key Decisions Made
- Use `requireAuth` / `requireAdmin` from `@/lib/auth-guard`.
- Single-record mutations / deletes will perform two-step verification (`findFirst({ where: { id, companyId } })`) to ensure record belongs to tenant before proceeding.

## Artifact Index
- `e:\projects\tourBiller\.agents\teamwork\worker_m3\DISPATCH.md` — Assignment & instructions
- `e:\projects\tourBiller\.agents\teamwork\worker_m3\BRIEFING.md` — Agent state index
- `e:\projects\tourBiller\.agents\teamwork\worker_m3\progress.md` — Liveness & progress tracking
- `e:\projects\tourBiller\.agents\teamwork\worker_m3\changes.md` — Detailed change documentation
- `e:\projects\tourBiller\.agents\teamwork\worker_m3\handoff.md` — Handoff report

## Change Tracker
- **Files modified**: None yet.
- **Build status**: Untested.
- **Pending issues**: None.

## Quality Status
- **Build/test result**: Pending.
- **Lint status**: 0.
- **Tests added/modified**: Pending.

## Loaded Skills
- None requested for this task.
