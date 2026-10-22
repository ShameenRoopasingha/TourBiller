---
title: Driver Mobile Portal
tags:
  - module
  - driver
  - mobile
  - pwa
  - field-operations
created: 2026-10-13
status: evergreen
---

# 📱 Driver Mobile Portal

Related Hub: [[00 - TourBiller Hub (MOC)]]  
Upstream Sources: [[Booking and Operations Hub]]  
Impacts: [[Fleet and VOC Engine]], [[Reports and Financial Analytics]]  
Schema: [[Database Schema and Entities#TripActivity]]

---

## 📌 Overview
The **Driver Mobile Portal** is a mobile-first, Progressive Web App (PWA) interface designed specifically for drivers operating in the field. It provides one-tap tour itinerary visibility, real-time trip event logging, and expense tracking directly from a smartphone.

---

## 🔑 Key Features & Components

### 1. Mobile-Optimized Driver Dashboard
- **Secure Driver Access**: Dedicated login (`/driver`) scoped to assigned tours only.
- **Active Tour Indicator**: Displays tour progress badge (e.g., *"Day 2 of 5"*).
- **Daily Itinerary Card**: Displays current day's route, hotel accommodations, customer pickup contact, and notes.

### 2. Floating Quick-Action Activity Logger
A bottom sheet modal allowing drivers to log timestamped events during the journey with a single tap:
- ⛽ **Fuel Fill (`FUEL_FILL`)**: Logs litres, price, and payment method; instantly records a `VehicleExpense` record.
- 🔧 **Breakdown & Mechanical Issue (`BREAKDOWN`)**: Instantly alerts administration of vehicle distress with exact notes.
- 🛞 **Flat Tyre (`FLAT_TIRE`)**: Records tyre punctures and roadside repairs.
- 🏨 **Hotel Check-in (`HOTEL_CHECKIN`)**: Records safe arrival at guest accommodations.
- 📝 **Trip Notes (`NOTE`)**: Ad-hoc route remarks or delays.

### 3. Expense Categorization
- **Company Paid (`COMPANY`)**: Expenses paid using company petty cash or fleet cards.
- **Customer Direct (`CUSTOMER`)**: Incidental costs directly reimbursed by the customer.

### 4. Roadside Mobile Printing
- Integrated with Web Bluetooth API.
- Generates 58mm ESC/POS formatted thermal receipts to hand to customers right inside the vehicle.

---

## 📂 Source Code References
- Dashboard: `src/components/DriverDashboard.tsx`, `src/components/DriverTourTabs.tsx`
- Quick Action Sheet: `src/components/QuickActionSheet.tsx`
- Server Actions: `src/lib/trip-activity-actions.ts`, `src/lib/vehicle-expense-actions.ts`
- Routes: `src/app/driver/page.tsx`
