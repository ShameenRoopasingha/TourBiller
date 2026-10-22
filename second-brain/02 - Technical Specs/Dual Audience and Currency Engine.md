---
title: Dual Audience & Currency Engine
tags:
  - architecture
  - dual-audience
  - forex
  - copy-rules
created: 2026-10-13
status: evergreen
---

# 🌐 Dual Audience & Currency Engine

Related Hub: [[00 - TourBiller Hub (MOC)]]  
Governs: [[Quotation Engine]], [[Billing and Invoicing Engine]], [[AI Assistant and Speech Hub]]  
Rulefile: `GEMINI.md`

---

## 📌 The Dual Audience Principle

TourBiller is architected to serve two distinct client demographics simultaneously:
1. **International Tourists & Foreign Travelers**: Visiting Sri Lanka from Europe, the Americas, Australia, Asia, etc.
2. **Local Sri Lankan Customers & Corporate Hirers**: Domestic wedding hires, pilgrimage tours, corporate transfers, and local holiday bookings.

---

## 🗣️ Copywriting & Terminology Standardization

### Client Deliverables (Strictly International Standard)
All quotations, invoices, printed PDFs, and external emails must maintain professional, globally understood hospitality English.

| ❌ Banned Local Slang / Informal Term | ✅ Professional Tourism Standard |
| :--- | :--- |
| Driver Batta / Bata | **Driver Accommodation & Meals** |
| Gate Pass / Ticket Charge | **Highway Tolls & Parking Fees** |
| Extra Km | **Excess Mileage Charge** |
| Km per day | **Daily Mileage Allowance** |
| Meter ticking / Running | **Hire Rate per Distance** |

### Internal Operator / Driver Views
Helpful bilingual descriptors (Sinhala / Tamil) are permitted in internal garage and driver views:
- *Odometer (මීටර් කියවීම)*
- *Operating Costs (ධාවන වියදම්)*

---

## 💱 Multi-Currency & Forex Conversion Rules

1. **No Hardcoded Currency Symbols**:
   - Never hardcode `"Rs."` or `"$"` into component logic or math.
   - Always route display values through dynamic formatting utilities:  
     `formatCurrency(amount, currency)`.
2. **Foreign Currency Estimates**:
   - For foreign travelers, quotation views render dynamic estimates (e.g., `USD`, `EUR`, `GBP`) calculated via `usdRate`.
3. **Forex Rate Transparency Notice**:
   - Foreign converted estimates must always disclose the conversion benchmark transparently:  
     `"≈ $450.00 USD (Exchange rate: 1 USD ≈ Rs. 300)"`.
4. **Live Synchronization**:
   - The platform provides a 1-click live forex sync fetching real-time market rates directly into `BusinessProfile`.
