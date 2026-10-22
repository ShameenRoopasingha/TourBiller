---
title: Reports & Financial Analytics
tags:
  - module
  - reports
  - analytics
  - finance
  - backup
  - csv
created: 2026-10-13
status: evergreen
---

# 📊 Reports & Financial Analytics

Related Hub: [[00 - TourBiller Hub (MOC)]]  
Upstream Sources: [[Billing and Invoicing Engine]], [[Fleet and VOC Engine]], [[Driver Mobile Portal]]  
Schema: [[Database Schema and Entities]]

---

## 📌 Overview
The **Reports & Financial Analytics** module delivers macro-level business intelligence. It measures top-line revenue, aggregates operational expenses, computes true net profit margins, evaluates vehicle efficiency, and provides full data portability via ZIP and CSV backups.

---

## 🔑 Key Features & Components

### 1. Financial Intelligence Dashboard
- **Gross Revenue**: Aggregates all bill totals across selectable time horizons (daily, weekly, monthly, annual).
- **Multi-Currency Breakdown**: Separates LKR earnings from foreign currency inflows (USD/EUR).
- **Expense Aggregation**: Pulls from `VehicleExpense` entries (Fuel, Breakdown repairs, Tyre replacements, Routine maintenance).
- **Net Operating Margin**:
$$\text{Net Profit} = \text{Gross Billing Revenue} - \text{Total Operating Expenses}$$

### 2. Fleet Utilization & Health
- **Mileage Accumulation**: Identifies which vehicles are generating the most distance and revenue.
- **Maintenance Urgency Index**: Highlights vehicles approaching or past their 5,000 km oil change or 10,000 km filter replacement thresholds.

### 3. Data Portability & Disaster Recovery
- **Full ZIP / JSON Backup**:
  - Endpoint `/api/company/backup-zip` compresses all bills, bookings, vehicles, customers, and quotations into a secure downloadable archive.
- **CSV Import & Export Engine**:
  - Bulk import and export for customer contact directories (`/api/customers/export`).
  - Import historical company records without database manipulation.

### 4. Background Automation & Health Crons
- **Keep-alive Ping (`/api/keepalive`)**: Prevents PostgreSQL cold starts.
- **Reminder Crons (`/api/cron/reminders`)**: Automated dispatch notifications for upcoming tours.

---

## 📂 Source Code References
- Dashboard UI: `src/app/reports/ReportsDashboard.tsx`
- Backup Component: `src/components/BackupButton.tsx`, `src/components/CsvImport.tsx`
- Routes: `src/app/reports/page.tsx`, `src/app/api/company/backup-zip/route.ts`
