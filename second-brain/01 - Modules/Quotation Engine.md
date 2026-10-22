---
title: Quotation Engine
tags:
  - module
  - quotations
  - pricing
  - forex
  - dual-audience
created: 2026-10-13
status: evergreen
---

# 📝 Quotation Engine

Related Hub: [[00 - TourBiller Hub (MOC)]]  
Upstream Sources: [[Tour Schedules and Route Planner]], [[Fleet and VOC Engine]]  
Downstream Target: [[Booking and Operations Hub]]  
Business Principles: [[Dual Audience and Currency Engine]]  
Formulas: [[Calculation Formulas and Algorithms]]

---

## 📌 Overview
The **Quotation Engine** is the sales powerhouse of TourBiller. It merges tour schedules, vehicle rates, VOC benchmarks, and live Forex exchange rates into professional, transparent quotations tailored to both local and international travelers.

---

## 🔑 Key Features & Components

### 1. Dual Audience & Currency Architecture
- **Local Sri Lankan Clients**: Clean quotations rendered in Sri Lankan Rupees (**LKR**).
- **Foreign / International Tourists**: Estimates quoted in **USD, EUR, or GBP**.
- **Live Forex Exchange Engine**:
  - Connects to live exchange rate services (`/api/exchange-rate`).
  - **1-Click Sync**: Updates exchange rate instantly in UI.
  - **Exchange Rate Notice**: Transparently displays:  
    `"≈ $450.00 USD (Exchange rate: 1 USD ≈ Rs. 300)"`.

### 2. Quotation Cost Calculation Matrix
The total quotation amount is computed deterministically:
$$\text{Total Price} = \text{Transport Cost} + \text{Accommodations} + \text{Meals} + \text{Activities} + \text{Others} + \text{Markup} - \text{Discount}$$

- **Transport Cost Calculation**:
  - Base Daily Allowance: $\text{Scheduled Days} \times \text{kmPerDay}$
  - Extra Distance: $\max(0, \text{Total Tour Distance} - \text{Base Allowance})$
  - Extra Distance Charge: $\text{Extra Distance} \times \text{excessKmRate}$
  - Total Transport: $(\text{Days} \times \text{hireRatePerDay}) + \text{Extra Distance Charge}$
- **Internal VOC Safeguard**: Checks quotation price against actual vehicle running cost to ensure positive profit margin.

### 3. Professional Exports & Print Optimization
- **A4 Client Quotation PDF (`QuotationTemplate.tsx`)**:
  - Side-by-side visual OSRM route map and transparent cost breakdown.
  - Page-break friendly layout preventing orphaned text.
  - **Customer Clean Mode**: Omits internal vehicle operating cost or excessive rate breakdown from the customer's printout.
- **Internal CSV Spreadsheet Export**: Provides operators with a full financial audit including cost breakdown and vehicle margins.

### 4. Lifecycle & 1-Click Booking Conversion
- **Lifecycle States**: `DRAFT` ➔ `SENT` ➔ `ACCEPTED` ➔ `EXPIRED`.
- **Validity Expiration (`validUntil`)**: Automatically flags expired proposals.
- **1-Click Convert**: When accepted by the customer, clicking "Convert to Booking" verifies vehicle availability and transitions the quote to a confirmed reservation in [[Booking and Operations Hub]].

---

## 📂 Source Code References
- Creation UI: `src/components/QuotationCreator.tsx`
- Template & Print: `src/components/QuotationTemplate.tsx`
- Server Actions: `src/lib/quotation-actions.ts`
- Routes: `src/app/quotations/new/page.tsx`, `src/app/quotations/[id]/page.tsx`, `src/app/quotations/[id]/print/page.tsx`
