---
title: Fleet & Vehicle Operating Cost (VOC) Engine
tags:
  - module
  - fleet
  - voc
  - maintenance
  - calculations
created: 2026-10-13
status: evergreen
---

# 🚗 Fleet & Vehicle Operating Cost (VOC) Engine

Related Hub: [[00 - TourBiller Hub (MOC)]]  
Formulas: [[Calculation Formulas and Algorithms]]  
Schema: [[Database Schema and Entities#Vehicle]]  
Impacts: [[Quotation Engine]], [[Billing and Invoicing Engine]]

---

## 📌 Overview
The **Fleet & VOC Engine** manages the complete physical and financial lifecycle of the company's vehicle assets. Beyond simply listing vehicles, it tracks real-time odometers, automates preventative maintenance warnings, and computes the exact **Vehicle Operating Cost (VOC)** per kilometer.

---

## 🔑 Key Features & Components

### 1. Master Vehicle Profile
- **Plate Number (`vehicleNo`)**: Unique identifier per company (e.g., `WP CAS-1234`).
- **Vehicle Category (`category`)**: `CAR`, `VAN`, `SUV`, `BUS`, etc.
- **Capacity & Comfort**: Passenger seat count (`seats`), AC configuration (`acType`: *Dual AC, Roof AC, Line AC, No AC*), and interior equipment specs.
- **Operational Status (`status`)**:
  - `ACTIVE`: Available for tours.
  - `MAINTENANCE`: In garage / undergoing servicing.
  - `RETIRED`: Decommissioned.

### 2. Legal Compliance & Document Expiry
- **Passenger Insurance Expiry (`insuranceExpiry`)**: Tracks policy expiration with advance dashboard warnings.
- **Revenue License Expiry (`revenueLicenseExpiry`)**: Alerts operators before government revenue licenses lapse.

### 3. Baseline Pricing Structure
Each vehicle defines standard hire rates used to pre-populate bills and quotations:
- **`ratePerDay`**: Baseline hire charge per calendar day.
- **`kmPerDay`**: Standard included daily mileage allowance (e.g., 100 km/day).
- **`excessKmRate`**: Charge applied for distance exceeding the allowed quota.
- **`extraHourRate`**: Charge for customer delays or extra operating hours.

### 4. Automated Preventative Maintenance Trackers
Odometer updates from [[Billing and Invoicing Engine]] feed directly into maintenance intervals:
- **Engine Oil Change**: Standard interval **5,000 km**. Warns when `currentMileage - lastOilChangeMileage >= 5000`.
- **Air & Oil Filter**: Standard interval **10,000 km**.
- **Body & Underwash**: Standard interval **1,000 km**.

### 5. VOC (Vehicle Operating Cost) Calculation Matrix
Allows operators to calculate the true internal cost per kilometer to safeguard profit margins:
$$\text{VOC per Km} = \text{Fuel Cost per Km} + \text{Tyre Wear per Km} + \text{Service Cost per Km} + \text{Insurance per Km}$$

Where:
- **Fuel Cost / km** = $\frac{\text{Fuel Price per Litre}}{\text{Fuel Efficiency (km/L)}}$
- **Tyre Wear / km** = $\frac{\text{Tyre Set Cost}}{\text{Tyre Lifespan (default 40,000 km)}}$
- **Service / km** = $\frac{\text{Routine Service Cost}}{\text{5,000 km}}$
- **Insurance / km** = $\frac{\text{Annual Insurance Cost}}{\text{Annual Estimated Km}}$

---

## 📂 Source Code References
- UI Form: `src/components/VehicleForm.tsx`
- Fleet List: `src/components/VehicleList.tsx`
- Server Actions: `src/lib/vehicle-actions.ts`
- Routes: `src/app/vehicles/page.tsx`, `src/app/vehicles/[id]/page.tsx`
