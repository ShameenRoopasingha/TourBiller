# BRIEFING — 2026-09-28T15:58:47Z

## Mission
Audit and fix all CRUD operations, database queries for PgBouncer compatibility, and polling/data loading across the Next.js tourBiller app.

## 🔒 My Identity
- Archetype: sentinel
- Working directory: e:\projects\tourBiller\.agents\teamwork\sentinel
- Orchestrator: TBD
- Victory Auditor: to be spawned on victory claim

## 🔒 Key Constraints
- No technical decisions — relay only
- Victory Audit is MANDATORY before reporting completion
- Keep context ultra-light; do not write code or make technical decisions
- Monitor orchestrator with 2 crons (Progress Reporting every 8m, Liveness Check every 10m)

## Routing Decision
- Route: General (teamwork_preview_orchestrator)
- Rationale: Multi-component SWE refactor and audit across CRUD mutations, API route migration, PgBouncer compatibility, and polling optimization. Not a document review, not a math/proof task, and not a single self-contained light change. Pre-flight dependency audit not required.

## User Context
- **Last user request**: Audit and fix all CRUD operations and data loading across Next.js 16 + Prisma 5 + Supabase PgBouncer app: migrate mutation server actions to API routes, ensure PgBouncer compatibility, optimize polling (>= 60s), preserve existing functionality, pass tsc and next build.
- **Pending clarifications**: none
- **Delivered results**: none

## Project Status
- **Phase**: not started

## Victory Audit Status
- **Triggered**: no
- **Verdict**: pending
- **Retry count**: 0

## Artifact Index
- e:\projects\tourBiller\.agents\teamwork\ORIGINAL_REQUEST.md — Authoritative record of user request
