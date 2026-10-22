---
title: Calculation Formulas & Algorithms
tags:
  - formulas
  - math
  - calculations
  - reference
created: 2026-10-13
status: evergreen
---

# 💰 Calculation Formulas & Algorithms

Related Hub: [[00 - TourBiller Hub (MOC)]]  
Applied in: [[Quotation Engine]], [[Billing and Invoicing Engine]], [[Fleet and VOC Engine]]  
Code: `src/lib/calculations.ts`

---

## 1. Billing Formulas

### Per-Day Package Mode
$$\text{Run Distance} = \text{endMeter} - \text{startMeter}$$
$$\text{Excess Km} = \max(0, \text{Run Distance} - \text{allowedKm})$$
$$\text{Excess Mileage Charge} = \text{Excess Km} \times \text{excessKmRate}$$
$$\text{Base Charge} = \text{packageCharge} + \text{Excess Mileage Charge}$$
$$\text{Extras} = \text{waitingCharge} + \text{gatePass} + \text{accommodationCharge} + \text{mealsCharge} + \text{activitiesCharge} + \text{otherCosts}$$
$$\text{Total Invoice Due} = (\text{Base Charge} + \text{Extras}) - \text{advanceAmount}$$

### Per-Km Flat Rate Mode
$$\text{Distance} = \text{endMeter} - \text{startMeter}$$
$$\text{Distance Charge} = \text{Distance} \times \text{hireRate}$$
$$\text{Total Invoice Due} = (\text{Distance Charge} + \text{Extras}) - \text{advanceAmount}$$

---

## 2. Quotation Formulas

### Extra Distance & Transport Cost
$$\text{Allowed Distance} = \text{Scheduled Days} \times \text{kmPerDay}$$
$$\text{Extra Distance} = \max(0, \text{Total Tour Distance} - \text{Allowed Distance})$$
$$\text{Extra Distance Charge} = \text{Extra Distance} \times \text{excessKmRate}$$
$$\text{Transport Total} = (\text{Days} \times \text{hireRatePerDay}) + \text{Extra Distance Charge}$$

### Final Quotation Price
$$\text{Itemized Total} = \text{Transport Total} + \text{Accommodation} + \text{Meals} + \text{Activities} + \text{Other Costs}$$
$$\text{Grand Total} = \text{Itemized Total} + \text{Markup} - \text{Discount}$$

---

## 3. Vehicle Operating Cost (VOC) Formulas

$$\text{Fuel Cost per Km} = \frac{\text{Current Fuel Price per Litre}}{\text{Vehicle Fuel Efficiency (km/L)}}$$
$$\text{Tyre Cost per Km} = \frac{\text{Tyre Set Replacement Cost}}{\text{Tyre Lifespan (default 40,000 km)}}$$
$$\text{Service Cost per Km} = \frac{\text{Routine Service Cost}}{\text{Service Interval (5,000 km)}}$$
$$\text{Insurance Cost per Km} = \frac{\text{Annual Insurance Premium}}{\text{Annual Estimated Km}}$$
$$\text{Total VOC per Km} = \text{Fuel} + \text{Tyre} + \text{Service} + \text{Insurance}$$

---

## 4. Maintenance Warning Thresholds

$$\text{Oil Change Due} \iff (\text{currentMileage} - \text{lastOilChangeMileage}) \ge 5000$$
$$\text{Filter Change Due} \iff (\text{currentMileage} - \text{lastFilterChangeMileage}) \ge 10000$$
$$\text{Vehicle Wash Due} \iff (\text{currentMileage} - \text{lastWashMileage}) \ge 1000$$
