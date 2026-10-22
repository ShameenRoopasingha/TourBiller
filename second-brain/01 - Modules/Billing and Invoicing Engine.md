---
title: Billing & Invoicing Engine
tags:
  - module
  - billing
  - invoicing
  - printing
  - thermal
  - odometer
created: 2026-10-13
status: evergreen
---

# 🧾 Billing & Invoicing Engine

Related Hub: [[00 - TourBiller Hub (MOC)]]  
Upstream Sources: [[Booking and Operations Hub]], [[Fleet and VOC Engine]]  
Downstream Target: [[Reports and Financial Analytics]]  
Formulas: [[Calculation Formulas and Algorithms]]  
Schema: [[Database Schema and Entities#Bill]]

---

## 📌 Overview
The **Billing & Invoicing Engine** handles checkout and revenue capture. It supports **Dual Pricing Modes** (Package vs Per-Km), captures exact odometer differences, applies operational incidentals, and issues both formal A4 Tax Invoices and 58mm mobile thermal receipts.

---

## 🔑 Key Features & Components

### 1. Dual Pricing Modes

#### Mode A: Per-Day Package Mode
Used for multi-day tours or daily car rentals where a baseline package charge includes a fixed mileage quota:
- Inputs: `scheduledDays`, `packageCharge`, `allowedKm`, `startMeter`, `endMeter`.
- Distance = $\text{endMeter} - \text{startMeter}$.
- Excess Km = $\max(0, \text{Distance} - \text{allowedKm})$.
- Excess Charge = $\text{Excess Km} \times \text{hireRate}$.
- Base = $\text{packageCharge} + \text{Excess Charge}$.

#### Mode B: Per-Km Flat Rate Mode
Used for on-demand transfers, day drops, or taxi hires where the client pays purely per kilometer run:
- Activated when vehicle `ratePerDay == 0` or operator toggles Flat Rate.
- System automatically hides package/daily fields.
- Total Distance Charge = $(\text{endMeter} - \text{startMeter}) \times \text{hireRate}$.

### 2. Incidental & Operational Charges
- **Extra Hours / Waiting Charge (`waitingCharge`)**: Compensates driver waiting time during client stops.
- **Highway Tolls & Parking Fees (`gatePass`)**: Expressway toll tickets and airport/attraction parking charges.
- **Driver Accommodation & Meals (`accommodationCharge`, `mealsCharge`)**: Night lodging when staying out of town.
- **Advance Payment Deduction (`advanceAmount`)**: Automatically credited against the final balance due.

### 3. Automatic Odometer & Fleet Sync
When an invoice is saved:
- Validates that $\text{endMeter} \ge \text{startMeter}$.
- **Synchronizes with Vehicle Profile**: Updates vehicle's `currentMileage` directly, triggering preventative maintenance calculations in [[Fleet and VOC Engine]].

### 4. Dual Print Output
- **Admin A4 Professional Invoice (`InvoiceTemplate.tsx`)**:
  - Branded with company logo, registered address, telephone, email, and bank account details.
  - Granular breakdown of journey route, meter readings, charges, and payment method (`CASH`, `CREDIT`, `BANK TRANSFER`).
- **58mm Bluetooth Thermal POS Receipt (`BluetoothPrintButton.tsx`)**:
  - ESC/POS format formatted for mobile thermal belt printers used by drivers on the road.

---

## 📂 Source Code References
- Creator UI: `src/components/BillCreator.tsx`
- Fields & Summary: `src/components/bills/BillChargeFields.tsx`, `src/components/bills/BillReceiptSummary.tsx`
- Print Templates: `src/components/InvoiceTemplate.tsx`, `src/components/BluetoothPrintButton.tsx`
- Server Actions: `src/lib/actions.ts`
- Routes: `src/app/bills/page.tsx`, `src/app/bills/[id]/page.tsx`
