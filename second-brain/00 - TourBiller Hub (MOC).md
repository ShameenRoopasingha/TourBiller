---
title: TourBiller / VIGIL - Second Brain Map of Content (MOC)
tags:
  - moc
  - tourbiller
  - architecture
  - index
created: 2026-10-13
status: evergreen
---

# 🏠 TourBiller / VIGIL — Second Brain (Map of Content)

> **"A single unified Second Brain for TourBiller (Smart Travel & Fleet Management Platform)."**  
> මෙතනින් ඔබට system එකේ සෑම module එකක්ම, formula එකක්ම, සහ technical specification එකක්ම bilateral links (`[[...]]`) ඔස්සේ පහසුවෙන් navigate කළ හැක. Obsidian වල **Graph View** (`Ctrl + G`) බැලූ විට මේ සියල්ල එකිනෙකට සම්බන්ධ වන අයුරු දැකගත හැක.

---

## 🗺️ Visual Ecosystem Mind Map

```mermaid
mindmap
  root((TourBiller Hub))
    Fleet & VOC
      Vehicle Master Profiles
      Compliance & Maintenance Alerts
      Operating Costs (VOC Engine)
    Tour & Itineraries
      Templates & Day-by-Day Matrix
      OSRM Leaflet Route Mapping
    Quotation Engine
      Dual Audience (LKR & Forex USD)
      Clean Client PDF vs Internal CSV
      1-Click Booking Conversion
    Bookings & Operations
      Fleet Availability & Clash Checker
      Calendar Timeline
      7-Day Refund Policy
    Billing Engine
      Package vs Per-Km Modes
      Odometer Sync
      A4 & 58mm Thermal Receipts
    Driver Mobile Portal
      Active Tour Tracking (Day X of Y)
      Quick Fuel & Breakdown Logging
      Bluetooth ESC/POS Printing
    AI & Voice Assistant
      Tool-Calling Agent
      Whisper Voice Transcription
    Financial Reports
      Profit & Loss Analytics
      Backup ZIP/JSON & CSV Portability
    SaaS & Platform
      Multi-Tenant Profiles
      RBAC Roles (Admin, Owner, Driver)
      Desktop Native (Tauri)
```

---

## 📂 Core Business Modules

| Module | Core Responsibility | Key Links |
| :--- | :--- | :--- |
| **01. Fleet & VOC** | වාහන විස්තර, Maintenance Alerts සහ ධාවන වියදම් (VOC Engine) | [[Fleet and VOC Engine]] |
| **02. Tour Schedules** | සංචාර සැලසුම්, Day-by-Day වියදම් සහ OSRM සිතියම් මාර්ග | [[Tour Schedules and Route Planner]] |
| **03. Quotation Engine** | Dual-audience මිල ගණන්, Live Forex, A4/CSV Exports | [[Quotation Engine]] |
| **04. Bookings & Operations** | Availability & Conflict checker, Calendar, Refund policy | [[Booking and Operations Hub]] |
| **05. Billing Engine** | Package vs Per-Km modes, Odometer audit, Thermal printing | [[Billing and Invoicing Engine]] |
| **06. Driver Portal** | Mobile PWA, Quick action logger (Fuel, Breakdown), On-road print | [[Driver Mobile Portal]] |
| **07. AI & Voice Hub** | Conversational tool-calling agent, Whisper voice input | [[AI Assistant and Speech Hub]] |
| **08. Reports & Analytics** | Revenue, VOC vs Net Profit, Full backup & restore | [[Reports and Financial Analytics]] |
| **09. SaaS & Platform** | Business profile, Roles (Admin/Owner/Driver), Tauri desktop | [[Multi-Tenant SaaS and Settings]] |

---

## 🛠️ Technical Specifications & Quick References

- 🗄️ Database Architecture: [[Database Schema and Entities]]
- 🌐 Local vs Foreign Travelers: [[Dual Audience and Currency Engine]]
- 💰 Math & Business Rules: [[Calculation Formulas and Algorithms]]

---

## 🔄 Core Business Lifecycle Workflow

```mermaid
flowchart LR
    A["[[Fleet and VOC Engine]]"] --> B["[[Tour Schedules and Route Planner]]"]
    B --> C["[[Quotation Engine]]"]
    C -->|Accepted| D["[[Booking and Operations Hub]]"]
    D -->|Tour Dispatched| E["[[Driver Mobile Portal]]"]
    E -->|Tour Concluded| F["[[Billing and Invoicing Engine]]"]
    F --> G["[[Reports and Financial Analytics]]"]
    F -->|Odometer Update| A
```
