# Project Architectural & Design Guidelines: TourBiller (Vigil Tour Management Platform)

## 1. Dual Audience Principle (Local & International)
This platform is actively used by:
1. **International Tourists & Foreign Travelers** (visiting Sri Lanka from across the world: Europe, Americas, Australia, Asia, etc.).
2. **Local Sri Lankan Customers & Domestic Hirers** (residents, local corporate clients, local day/multi-day tour bookers).

Every feature, user interface, document export, and pricing engine must be designed to cater seamlessly to **both** demographics.

---

## 2. Language & Copywriting Rules

### Customer-Facing Deliverables (Quotations, Invoices, Itineraries, Vouchers, PDFs)
- **Strictly Professional International English**:
  - All customer-facing text, printed PDFs, exportable templates, and client emails must use clear, grammatically sound, and globally accessible English.
  - Avoid Sri Lankan colloquialisms or local slang (e.g., avoid "batta", "meter ticking", or untranslated administrative jargon).
  - Use universally understood tourism terms:
    - "Driver Accommodation & Meals" (instead of informal driver bata).
    - "Highway Tolls & Parking Fees" (instead of gate pass / ticket charges).
    - "Excess Mileage Charge" (instead of extra km).
    - "Daily Mileage Allowance" (instead of km per day).

### Internal Operator & Driver Interfaces
- Primary language remains clear English.
- Helpful bilingual secondary labels or helper text (English + Sinhala/Tamil) may be used where it aids local drivers or garage operators (e.g., "Operating Costs & Running Charges (ධාවන වියදම්)", "Odometer (මීටර් කියවීම)"), while keeping all database fields, API models, and code symbols in standard English.

---

## 3. Currency & Pricing Rules

### Multi-Currency Awareness & Flexibility
- **No Hardcoded Currency Restrictions**:
  - Never hardcode `"Rs."` as the only currency in functions, interfaces, or documents.
  - Always support currency codes (`LKR`, `USD`, `EUR`, `GBP`) via dynamic formatting functions like `formatCurrency(amount, currency)`.
- **Foreign Currency Equivalence**:
  - For international tourists, provide converted foreign currency estimates (e.g., USD equivalent based on `BusinessProfile.usdRate`) alongside or as an option to LKR.
  - State the reference exchange rate transparently when converting (e.g., `≈ $450.00 USD (Exchange rate: 1 USD ≈ Rs. 300)`).
- **Clear Itemization**:
  - Both international and domestic clients expect complete transparency. Always itemize transport, fuel, mileage allowances, driver lodging, and optional package additions clearly.
