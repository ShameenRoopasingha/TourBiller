# Dispatch: Spec Miner (Survey)

## Mission
Analyze the data model, Prisma schema, NextAuth configuration, and session structures for multi-tenant isolation in TourBiller.

## Working Directory
`e:\projects\tourBiller\.agents\teamwork\spec_miner_survey\`

## Mandatory Inputs
- Original Request: `e:\projects\tourBiller\.agents\teamwork\ORIGINAL_REQUEST.md` (read this first!)
- Prisma Schema: `prisma/schema.prisma`
- Auth configuration: check NextAuth/session files (e.g. `src/lib/auth.ts` or similar)
- Package configuration: `package.json`

## Objectives
1. Map all Prisma models and their multi-tenant relationships (which models have `companyId`, which relate via a parent model).
2. Determine how `session.user.companyId` is defined and passed in Server Actions.
3. Document exact requirements, invariants, and edge cases for tenant isolation across the entire system.
4. Output your comprehensive analysis and specifications to `e:\projects\tourBiller\.agents\teamwork\spec_miner_survey\report.md` and write `handoff.md`.

## 2026-09-25T02:57:37Z
You are the Specification Investigator for the TourBiller Multi-Tenant project.
Your working directory is: e:\projects\tourBiller\.agents\teamwork\spec_miner_survey\
Read e:\projects\tourBiller\.agents\teamwork\ORIGINAL_REQUEST.md and e:\projects\tourBiller\.agents\teamwork\spec_miner_survey\DISPATCH.md before starting work.
Analyze prisma/schema.prisma, NextAuth / auth session structures (e.g. src/lib/auth.ts), and package configurations.
Map out all Prisma models with companyId relations, tenant isolation boundaries, session resolution, and write your findings to e:\projects\tourBiller\.agents\teamwork\spec_miner_survey\report.md.
Also write e:\projects\tourBiller\.agents\teamwork\spec_miner_survey\handoff.md and notify me when complete.

