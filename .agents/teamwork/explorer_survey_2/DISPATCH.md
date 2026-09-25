# Dispatch: Explorer Survey 2 (Bill, Payment, User, Company & Other Actions)

## Mission
Survey and audit all Server Actions related to Bills, Invoices, Payments, Users, Company, Settings, and other models (e.g. `src/lib/bill-actions.ts`, `src/lib/user-actions.ts`, `src/lib/company-actions.ts`, and any other server action or data-access files) for multi-tenant leaks and missing `companyId` security constraints.

## Working Directory
`e:\projects\tourBiller\.agents\teamwork\explorer_survey_2\`

## Mandatory Inputs
- Original Request: `e:\projects\tourBiller\.agents\teamwork\ORIGINAL_REQUEST.md` (read this first!)
- Target files: `src/lib/*actions*.ts`, particularly bills, users, companies, settings, payments, etc.

## Objectives
1. Enumerate every exported server action function in these files.
2. For each function, document the current database queries (`findMany`, `findUnique`, `findFirst`, `count`, `aggregate`, `update`, `delete`, `create`, `upsert`).
3. Identify whether tenant verification (`companyId: session.user.companyId`) is present, missing, or bypassable.
4. Detail the exact vulnerability and recommended fix pattern (R1: companyId filter; R2: findFirst / updateMany / deleteMany or two-step validation).
5. Output detailed findings to `e:\projects\tourBiller\.agents\teamwork\explorer_survey_2\report.md` and write `handoff.md`.

## 2026-09-25T02:57:37Z
You are the Codebase Researcher for Bill, Payment, User, and Company Server Actions in TourBiller.
Your working directory is: e:\projects\tourBiller\.agents\teamwork\explorer_survey_2\
Read e:\projects\tourBiller\.agents\teamwork\ORIGINAL_REQUEST.md and e:\projects\tourBiller\.agents\teamwork\explorer_survey_2\DISPATCH.md before starting work.
Examine src/lib/*-actions.ts (focusing on bill-actions.ts, user-actions.ts, company-actions.ts, and any other action/data files).
Inventory all queries (findMany, count, aggregate, findUnique, update, delete) and document every multi-tenant vulnerability and missing companyId check.
Write your findings to e:\projects\tourBiller\.agents\teamwork\explorer_survey_2\report.md.
Also write e:\projects\tourBiller\.agents\teamwork\explorer_survey_2\handoff.md and notify me when complete.

