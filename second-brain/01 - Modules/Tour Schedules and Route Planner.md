---
title: Tour Schedules & Route Planner
tags:
  - module
  - tours
  - itineraries
  - osrm
  - mapping
created: 2026-10-13
status: evergreen
---

# 🗺️ Tour Schedules & Route Planner

Related Hub: [[00 - TourBiller Hub (MOC)]]  
Downstream Consumers: [[Quotation Engine]], [[Driver Mobile Portal]]  
Schema: [[Database Schema and Entities#TourSchedule]]

---

## 📌 Overview
The **Tour Schedules & Route Planner** empowers operators to design, store, and price multi-day tour packages. It integrates interactive OSRM route tracing with day-by-day itemized cost allocations.

---

## 🔑 Key Features & Components

### 1. Multi-Day Master Tour Packages
- **Template Identity**: Package name (e.g., "7 Days Cultural Triangle & Hill Country Tour"), total duration (`days`), and description.
- **Base Per-Person Pricing**: Pre-set `basePricePerPerson`.
- **Vehicle Assignment**: Pre-linked default vehicle category (CAR, VAN) or specific fleet vehicle.

### 2. Day-by-Day Itemization Matrix (`TourScheduleDayItem`)
Every single day of the tour contains granular line-item costs:
- **`dayNumber` & `title`**: e.g., "Day 1: Airport Arrival & Transfer to Sigiriya".
- **`distanceKm`**: Expected transit distance for the day.
- **`accommodation`**: Driver Lodging & Meal allowance (or client hotel allowance).
- **`meals`**: Packaged client meals / refreshments.
- **`activities`**: Attraction fees (Sigiriya Rock tickets, Yala Safari jeep permit, etc.).
- **`otherCosts`**: Highway tolls, parking fees, and entry permits.

### 3. OSRM & Leaflet Visual Route Engine
- **Visual Route Mapping**: Interactive map powered by OpenStreetMap & OSRM routing.
- **Waypoint Navigation**: Visualizes stops (e.g., Colombo ➔ Kandy ➔ Ella ➔ Mirissa ➔ Galle).
- **Automatic Distance Calculation**: Traces road network geometries to compute accurate road distance (km) automatically.
- **Manual Override**: Allows the operator to specify explicit distance overrides when special detour routes occur.

---

## 📂 Source Code References
- Map Route Planner: `src/components/DayMapRoutePlanner.tsx`, `src/components/OSRMRouteMap.tsx`
- Tour Schedule UI: `src/components/TourScheduleForm.tsx`, `src/components/TourScheduleDetail.tsx`
- Server Actions: `src/lib/tour-schedule-actions.ts`, `src/lib/osrm-actions.ts`
- Routes: `src/app/tour-schedules/page.tsx`, `src/app/tour-schedules/[id]/page.tsx`
