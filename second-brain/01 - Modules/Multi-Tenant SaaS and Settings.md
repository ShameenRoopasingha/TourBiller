---
title: Multi-Tenant SaaS, Roles & Settings
tags:
  - module
  - saas
  - rbac
  - settings
  - tauri
  - security
created: 2026-10-13
status: evergreen
---

# ⚙️ Multi-Tenant SaaS, Roles & Settings

Related Hub: [[00 - TourBiller Hub (MOC)]]  
Governs: All Modules  
Rules: [[Dual Audience and Currency Engine]]

---

## 📌 Overview
The **Multi-Tenant SaaS & Settings** module manages organization identities, multi-currency baselines, role-based security permissions, error tracking, and cross-platform native execution via Tauri.

---

## 🔑 Key Features & Components

### 1. Business Profile & Official Branding (`BusinessProfile`)
- **Branding**: Company legal name, logo upload (`logoUrl`), corporate address, email, telephone, website.
- **Official Banking Details for Invoice Settlements**:
  - `bankName` (e.g., Bank of Ceylon, Commercial Bank).
  - `bankBranch` (e.g., Delgoda, Colombo 03).
  - `bankAccountNo` and `bankAccountName`.
  - Automatically rendered on client quotation PDFs and invoices.

### 2. First-Time Currency Onboarding Wizard
- Pops up for new companies (`currencyConfigured == false`).
- Allows operators to choose primary currency (`LKR`, `USD`, `EUR`) and establishes the baseline exchange rate (`usdRate`).

### 3. Role-Based Access Control (RBAC)
Security enforced at both the UI navigation layer and server action guard layer:
- **`ADMIN`**: Complete system control — fleet management, quotation creation, billing, company settings, user provisioning.
- **`OWNER`**: Unrestricted access with strategic focus on reports, financial margins, and subscription tiers.
- **`DRIVER`**: Restricted strictly to the mobile-optimized `/driver` route; cannot view company-wide financials, other drivers' bookings, or quotation margins.

### 4. Cross-Platform Desktop Native Architecture (Tauri)
- Packaged as a lightweight native Windows executable using Rust & Tauri (`src-tauri/`).
- Allows local transport offices to run TourBiller as an installed desktop desktop app with local hardware integration.

### 5. Production Observability & Error Monitoring
- **Sentry SDK Integration**: Configured across client, edge, and server runtimes (`sentry.client.config.ts`, `sentry.server.config.ts`) to capture uncaught exceptions in real time.

---

## 📂 Source Code References
- Settings UI: `src/app/settings/page.tsx`, `src/components/BusinessProfileForm.tsx`
- First Time Modal: `src/components/FirstTimeCurrencyModal.tsx`
- User Management: `src/app/users/page.tsx`
- Auth Guards: `src/lib/auth-guard.ts`, `src/lib/auth.ts`
