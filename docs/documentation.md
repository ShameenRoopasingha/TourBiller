<![CDATA[# VIGIL — Smart Travel Management System
## Complete System Documentation v1.0

> **Product Name:** VIGIL  
> **Tagline:** Smart Travel Management  
> **Version:** 1.0.0  
> **Platform:** Web (SaaS)  
> **Developed by:** Bitgard PVT LTD  
> **Last Updated:** July 2026  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Subscription Plans & Pricing](#2-subscription-plans--pricing)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [Entity Relationship Diagram](#5-entity-relationship-diagram)
6. [Data Flow Diagrams](#6-data-flow-diagrams)
7. [Use Case Diagram](#7-use-case-diagram)
8. [Class Diagram](#8-class-diagram)
9. [Sequence Diagrams](#9-sequence-diagrams)
10. [State Diagrams](#10-state-diagrams)
11. [Component Architecture](#11-component-architecture)
12. [Database Schema](#12-database-schema)
13. [Server Actions & API Reference](#13-server-actions--api-reference)
14. [User Roles & Permissions](#14-user-roles--permissions)
15. [Feature Documentation](#15-feature-documentation)
16. [Deployment Architecture](#16-deployment-architecture)
17. [Security Features](#17-security-features)
18. [Appendix](#18-appendix)

---

## 1. Executive Summary

**VIGIL** is a cloud-based Smart Travel Management System designed for vehicle hire companies, tour operators, and fleet managers in Sri Lanka. It provides an end-to-end solution for managing the complete lifecycle of tour operations — from quotations and bookings through to billing and financial reporting.

### Core Capabilities

| Capability | Description |
|---|---|
| **Fleet Management** | Register vehicles with specs, pricing modes, and maintenance tracking |
| **Tour Scheduling** | Create multi-day tour itineraries with per-day cost breakdowns |
| **Quotation Engine** | Generate professional quotations with automatic cost calculations |
| **Booking Management** | Track reservations with driver assignment and availability checking |
| **Billing Engine** | Create bills with dual pricing modes (Per-Day Package / Per-Km Flat Rate) |
| **Print System** | A4 professional invoices (Admin) and 58mm thermal receipts (Driver) |
| **Driver Portal** | Mobile-first interface for drivers with tour tracking and expense logging |
| **Dashboard & Analytics** | Real-time revenue tracking, fleet utilization, and activity monitoring |
| **Multi-Currency** | LKR and USD support with configurable exchange rates |

### Target Market
- Vehicle hire companies (cars, vans, SUVs, buses)
- Tour operators and travel agencies
- Corporate fleet managers
- Airport transfer services

---

## 2. Subscription Plans & Pricing

> [!NOTE]
> All prices are in USD. LKR equivalent shown at Rs. 300/USD. Annual plans include a **20% discount**.

### Plan Comparison

| Feature | Starter | Professional | Enterprise |
|---|:---:|:---:|:---:|
| **Monthly Price** | **$15/mo** | **$35/mo** | **$75/mo** |
| **Annual Price** | **$144/yr** ($12/mo) | **$336/yr** ($28/mo) | **$720/yr** ($60/mo) |
| **LKR Monthly** | Rs. 4,500 | Rs. 10,500 | Rs. 22,500 |
| **LKR Annual** | Rs. 43,200/yr | Rs. 100,800/yr | Rs. 216,000/yr |
| Vehicles | Up to **5** | Up to **20** | **Unlimited** |
| Admin Users | 1 | 3 | Unlimited |
| Driver Accounts | 2 | 10 | Unlimited |
| Bills per Month | 50 | 200 | Unlimited |
| Quotations per Month | 20 | 100 | Unlimited |
| Tour Schedules | 10 | 50 | Unlimited |
| Customer Records | 100 | 500 | Unlimited |
| Booking Management | ✅ | ✅ | ✅ |
| Thermal Printing | ✅ | ✅ | ✅ |
| A4 Invoice Printing | ✅ | ✅ | ✅ |
| Bluetooth Printing | ❌ | ✅ | ✅ |
| Driver Mobile Portal | ❌ | ✅ | ✅ |
| Trip Activity Logging | ❌ | ✅ | ✅ |
| Vehicle Expense Tracking | Basic | Full | Full |
| Maintenance Alerts | ❌ | ✅ | ✅ |
| Dashboard Analytics | Basic | Advanced | Advanced |
| Multi-Currency (USD) | ❌ | ✅ | ✅ |
| Custom Branding (Logo) | ❌ | ✅ | ✅ |
| Bank Details on Quotes | ❌ | ✅ | ✅ |
| Sentry Error Monitoring | ❌ | ❌ | ✅ |
| Priority Support | Email | Email + Chat | Dedicated Account Manager |
| Data Retention | 1 Year | 3 Years | Unlimited |
| **Free Trial** | **14 Days** | **14 Days** | **30 Days** |

### Pricing Diagram

```mermaid
graph LR
    subgraph "VIGIL Subscription Tiers"
        S["🟢 Starter<br/>$15/mo<br/>Rs. 4,500/mo<br/>5 Vehicles"]
        P["🔵 Professional<br/>$35/mo<br/>Rs. 10,500/mo<br/>20 Vehicles"]
        E["🟣 Enterprise<br/>$75/mo<br/>Rs. 22,500/mo<br/>Unlimited"]
    end

    S -->|"Upgrade"| P
    P -->|"Upgrade"| E

    style S fill:#d4edda,stroke:#28a745,color:#000
    style P fill:#cce5ff,stroke:#007bff,color:#000
    style E fill:#e2d5f1,stroke:#6f42c1,color:#000
```

---

## 3. Technology Stack

```mermaid
graph TB
    subgraph "Frontend"
        NEXT["Next.js 16.1.5<br/>Turbopack"]
        REACT["React 19.2"]
        TW["Tailwind CSS v4"]
        FM["Framer Motion"]
        RHF["React Hook Form"]
        R3F["React Three Fiber<br/>3D Effects"]
        RADIX["Radix UI Primitives"]
        LUCIDE["Lucide Icons"]
    end

    subgraph "Backend"
        API["Next.js API Routes"]
        SA["Server Actions"]
        AUTH["NextAuth v5<br/>Auth.js"]
        PRISMA["Prisma ORM 5.21"]
    end

    subgraph "Database"
        PG["PostgreSQL<br/>Supabase"]
    end

    subgraph "Validation"
        ZOD["Zod v4"]
    end

    subgraph "Infrastructure"
        VERCEL["Vercel<br/>Hosting"]
        SENTRY["Sentry<br/>Error Monitoring"]
        CRON["Cron Job<br/>DB Keepalive"]
    end

    NEXT --> REACT
    REACT --> TW
    REACT --> FM
    REACT --> RHF
    REACT --> R3F
    REACT --> RADIX
    NEXT --> SA
    SA --> PRISMA
    SA --> ZOD
    AUTH --> SA
    PRISMA --> PG
    NEXT --> VERCEL
    NEXT --> SENTRY
    CRON --> API

    style NEXT fill:#000,stroke:#fff,color:#fff
    style REACT fill:#61dafb,stroke:#000,color:#000
    style PG fill:#336791,stroke:#fff,color:#fff
    style VERCEL fill:#000,stroke:#fff,color:#fff
```

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime** | Next.js (Turbopack) | 16.1.5 | Full-stack React framework |
| **UI Library** | React | 19.2.3 | Component rendering |
| **Styling** | Tailwind CSS | v4 | Utility-first CSS |
| **Animations** | Framer Motion | 12.36 | Page transitions, micro-animations |
| **3D Effects** | React Three Fiber | 8.15 | Aurora background effects |
| **Forms** | React Hook Form | 7.71 | Form state management |
| **Validation** | Zod | 4.3 | Schema validation (client + server) |
| **Auth** | NextAuth (Auth.js) | v5-beta | Session management, credentials provider |
| **ORM** | Prisma | 5.21 | Database queries, migrations |
| **Database** | PostgreSQL | — | Supabase-hosted |
| **Hosting** | Vercel | — | Serverless deployment |
| **Monitoring** | Sentry | 10.42 | Error tracking, performance |
| **Printing** | react-to-print | 3.2 | Browser print API |
| **Icons** | Lucide React | 0.563 | SVG icon library |
| **Password** | bcryptjs | 3.0 | Password hashing |
| **Dates** | date-fns | 4.1 | Date manipulation |

---

## 4. System Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        BROWSER["Web Browser<br/>Desktop / Mobile"]
        THERMAL["Thermal Printer<br/>58mm Bluetooth"]
    end

    subgraph "Application Layer"
        direction TB
        MIDDLEWARE["Middleware<br/>Route Protection"]
        SC["Server Components<br/>Dashboard, Lists"]
        CC["Client Components<br/>Forms, Interactives"]
        SA["Server Actions<br/>Business Logic"]
        API["API Routes<br/>Auth, Keepalive"]
    end

    subgraph "Service Layer"
        AUTH["Authentication<br/>NextAuth v5"]
        CALC["Calculation Engine<br/>Billing Logic"]
        PRINT["Print Engine<br/>A4 + Thermal"]
        GUARD["Auth Guard<br/>Role-Based Access"]
        VALID["Validation<br/>Zod Schemas"]
    end

    subgraph "Data Layer"
        PRISMA["Prisma ORM"]
        PG["PostgreSQL<br/>Supabase"]
    end

    subgraph "External Services"
        VERCEL["Vercel CDN"]
        SENTRY["Sentry Monitoring"]
        CRON["Cron Service<br/>DB Keepalive"]
    end

    BROWSER --> MIDDLEWARE
    BROWSER --> THERMAL
    MIDDLEWARE --> SC
    MIDDLEWARE --> CC
    CC --> SA
    SC --> SA
    SA --> AUTH
    SA --> GUARD
    SA --> VALID
    SA --> CALC
    CC --> PRINT
    SA --> PRISMA
    API --> PRISMA
    PRISMA --> PG
    BROWSER --> VERCEL
    SA --> SENTRY
    CRON --> API
```

### Request Flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant M as Middleware
    participant SC as Server Component
    participant SA as Server Action
    participant AG as Auth Guard
    participant Z as Zod Validator
    participant P as Prisma ORM
    participant DB as PostgreSQL

    B->>M: HTTP Request
    M->>M: Check Auth Session
    alt Unauthenticated
        M-->>B: Redirect to /login
    else Authenticated
        M->>SC: Render Page
        SC->>SA: Fetch Data
        SA->>AG: requireAdmin() / requireAuth()
        AG->>AG: Verify Role
        SA->>Z: Validate Input
        SA->>P: Database Query
        P->>DB: SQL Query
        DB-->>P: Result Set
        P-->>SA: Typed Data
        SA-->>SC: ActionResult
        SC-->>B: Rendered HTML
    end
```

---

## 5. Entity Relationship Diagram

```mermaid
erDiagram
    USER {
        string id PK
        string name
        string email UK
        string password
        string role "ADMIN | DRIVER"
        datetime createdAt
        datetime updatedAt
    }

    VEHICLE {
        string id PK
        string vehicleNo UK
        string model
        string category "CAR | VAN | SUV | BUS"
        string status "ACTIVE | MAINTENANCE | RETIRED"
        float ratePerDay "0 = Per-Km mode"
        float kmPerDay
        float excessKmRate
        float extraHourRate
        int seats
        string acType
        string features
        string insuranceCoverage
        float currentMileage
        float oilChangeInterval
        float lastOilChangeMileage
        float filterChangeInterval
        float lastFilterChangeMileage
        float washInterval
        float lastWashMileage
    }

    CUSTOMER {
        string id PK
        string name
        string mobile
        string email
        string address
    }

    BUSINESS_PROFILE {
        string id PK
        string companyName
        string address
        string phone
        string email
        float usdRate
        string logoUrl
        string bankName
        string bankBranch
        string bankAccountNo
        string bankAccountName
    }

    TOUR_SCHEDULE {
        string id PK
        string name UK
        string description
        int days
        string vehicleCategory
        string vehicleNo
        float ratePerDay
        float kmPerDay
        float excessKmRate
        float extraHourRate
        float waitingCharge
        float gatePass
        boolean isActive
    }

    TOUR_SCHEDULE_DAY_ITEM {
        string id PK
        string tourScheduleId FK
        int dayNumber
        string title
        string description
        float distanceKm
        float accommodation
        float meals
        float activities
        float otherCosts
    }

    QUOTATION {
        string id PK
        int quotationNumber UK
        string tourScheduleId FK
        string customerName
        string customerEmail
        string vehicleNo
        int numberOfPersons
        float hireRatePerDay
        float kmPerDay
        float totalDistance
        float transportCost
        float accommodationTotal
        float mealsTotal
        float totalAmount
        float markup
        float discount
        string status "DRAFT | SENT | ACCEPTED | EXPIRED"
        string driverId FK
    }

    BOOKING {
        string id PK
        string vehicleNo
        string customerName
        datetime startDate
        datetime endDate
        string destination
        string status "CONFIRMED | CANCELLED | COMPLETED"
        float advanceAmount
        string refundStatus "NULL | REFUNDED | FORFEITED"
        string driverId FK
    }

    BILL {
        string id PK
        int billNumber UK
        string vehicleNo
        string customerName
        string customerAddress
        string route
        float startMeter
        float endMeter
        float hireRate
        float allowedKm
        float packageCharge
        float totalAmount
        string currency "LKR | USD"
        float exchangeRate
        string paymentMethod "CASH | CREDIT"
        float extraHours
        float extraKm
        float scheduledDays
        string itinerary "JSON"
    }

    VEHICLE_EXPENSE {
        string id PK
        string vehicleNo
        float amount
        string category "REPAIR | FUEL | SERVICE | etc"
        string description
        datetime date
        string bookingId
        string driverId FK
    }

    TRIP_ACTIVITY {
        string id PK
        string bookingId FK
        string driverId FK
        string type "FUEL_FILL | STOP | BREAKDOWN | etc"
        string note
        string expenseId
        datetime timestamp
    }

    PASSWORD_RESET_TOKEN {
        string id PK
        string email
        string token UK
        datetime expires
    }

    USER ||--o{ BOOKING : "drives"
    USER ||--o{ QUOTATION : "assigned as driver"
    USER ||--o{ VEHICLE_EXPENSE : "records"
    USER ||--o{ TRIP_ACTIVITY : "logs"
    BOOKING ||--o{ TRIP_ACTIVITY : "contains"
    TOUR_SCHEDULE ||--o{ TOUR_SCHEDULE_DAY_ITEM : "has days"
    TOUR_SCHEDULE ||--o{ QUOTATION : "used in"
```

---

## 6. Data Flow Diagrams

### Level 0 — Context Diagram

```mermaid
graph LR
    ADMIN["👤 Admin User"]
    DRIVER["🚗 Driver"]
    CUSTOMER["👥 Customer"]
    SYSTEM(("VIGIL<br/>Travel Management<br/>System"))
    PRINTER["🖨️ Printer"]
    DB[("PostgreSQL<br/>Database")]

    ADMIN -->|"Manage fleet, bills,<br/>quotations, schedules"| SYSTEM
    DRIVER -->|"Log expenses,<br/>trip activities"| SYSTEM
    SYSTEM -->|"Quotations,<br/>Invoices"| CUSTOMER
    SYSTEM -->|"Print invoices<br/>A4 / Thermal"| PRINTER
    SYSTEM <-->|"CRUD operations"| DB
    SYSTEM -->|"Dashboard stats,<br/>reports"| ADMIN
    SYSTEM -->|"Active tour info,<br/>itinerary"| DRIVER
```

### Level 1 — Major Processes

```mermaid
graph TB
    subgraph "1.0 Fleet Management"
        V1["1.1 Register Vehicle"]
        V2["1.2 Track Maintenance"]
        V3["1.3 Record Expenses"]
    end

    subgraph "2.0 Tour Planning"
        T1["2.1 Create Tour Schedule"]
        T2["2.2 Define Day Itinerary"]
        T3["2.3 Set Pricing"]
    end

    subgraph "3.0 Quotation Engine"
        Q1["3.1 Generate Quotation"]
        Q2["3.2 Check Availability"]
        Q3["3.3 Calculate Costs"]
        Q4["3.4 Print Quotation"]
    end

    subgraph "4.0 Booking Management"
        B1["4.1 Create Booking"]
        B2["4.2 Assign Driver"]
        B3["4.3 Convert Quotation"]
        B4["4.4 Cancel with Refund"]
    end

    subgraph "5.0 Billing Engine"
        I1["5.1 Create Bill"]
        I2["5.2 Calculate Charges"]
        I3["5.3 Print Invoice"]
        I4["5.4 Update Mileage"]
    end

    subgraph "6.0 Reporting"
        R1["6.1 Dashboard Stats"]
        R2["6.2 Revenue Tracking"]
        R3["6.3 Fleet Status"]
    end

    T1 --> Q1
    Q1 --> Q2
    Q1 --> Q3
    Q3 --> Q4
    Q1 --> B3
    B1 --> B2
    B1 --> I1
    I1 --> I2
    I2 --> I3
    I1 --> I4
    V1 --> V2
    V3 --> V2
    I1 --> R1
```

### Level 2 — Billing Process Detail

```mermaid
graph TB
    START(("Start"))
    SELECT_VEHICLE["Select Vehicle"]
    CHECK_MODE{"Pricing Mode?"}
    PKG["Per-Day Package Mode"]
    KM["Per-Km Flat Rate Mode"]
    ENTER_METERS["Enter Start/End Meter"]
    CALC_DISTANCE["Calculate Distance<br/>endMeter - startMeter"]
    CALC_PKG["Calculate:<br/>Package Charge +<br/>Excess Km × Rate +<br/>Extra Hours × Rate"]
    CALC_KM["Calculate:<br/>Total Distance × Rate/km +<br/>Extra Hours × Rate"]
    ADD_EXTRAS["Add Extra Charges:<br/>Waiting + Gate Pass +<br/>Accommodation + Meals +<br/>Activities + Other"]
    DEDUCT["Deduct Advance Payment"]
    TOTAL["Final Balance Due"]
    PRINT["Print Invoice"]
    UPDATE_MILEAGE["Update Vehicle<br/>Current Mileage"]
    FINISH(("End"))

    START --> SELECT_VEHICLE
    SELECT_VEHICLE --> CHECK_MODE
    CHECK_MODE -->|"ratePerDay > 0"| PKG
    CHECK_MODE -->|"ratePerDay = 0"| KM
    PKG --> ENTER_METERS
    KM --> ENTER_METERS
    ENTER_METERS --> CALC_DISTANCE
    CALC_DISTANCE --> CALC_PKG
    CALC_DISTANCE --> CALC_KM
    CALC_PKG --> ADD_EXTRAS
    CALC_KM --> ADD_EXTRAS
    ADD_EXTRAS --> DEDUCT
    DEDUCT --> TOTAL
    TOTAL --> PRINT
    TOTAL --> UPDATE_MILEAGE
    PRINT --> FINISH
    UPDATE_MILEAGE --> FINISH
```

---

## 7. Use Case Diagram

```mermaid
graph TB
    subgraph "VIGIL System"
        UC1["🔑 Login / Logout"]
        UC2["👤 Manage Profile"]
        UC3["🚗 Manage Vehicles"]
        UC4["🛣️ Manage Tour Schedules"]
        UC5["📝 Generate Quotations"]
        UC6["📅 Manage Bookings"]
        UC7["💰 Create Bills"]
        UC8["🖨️ Print Invoices A4"]
        UC9["🧾 Print Thermal Receipt"]
        UC10["📊 View Dashboard"]
        UC11["👥 Manage Customers"]
        UC12["👷 Manage Users"]
        UC13["⚙️ Business Settings"]
        UC14["🔧 Track Maintenance"]
        UC15["💳 Record Expenses"]
        UC16["📍 Log Trip Activities"]
        UC17["🗺️ View Active Tour"]
        UC18["📋 View Tour History"]
        UC19["🔄 Convert Quote to Booking"]
        UC20["❌ Cancel Booking"]
    end

    ADMIN["👤 Admin"]
    DRIVER["🚗 Driver"]

    ADMIN --> UC1
    ADMIN --> UC2
    ADMIN --> UC3
    ADMIN --> UC4
    ADMIN --> UC5
    ADMIN --> UC6
    ADMIN --> UC7
    ADMIN --> UC8
    ADMIN --> UC10
    ADMIN --> UC11
    ADMIN --> UC12
    ADMIN --> UC13
    ADMIN --> UC14
    ADMIN --> UC15
    ADMIN --> UC19
    ADMIN --> UC20

    DRIVER --> UC1
    DRIVER --> UC2
    DRIVER --> UC9
    DRIVER --> UC15
    DRIVER --> UC16
    DRIVER --> UC17
    DRIVER --> UC18
```

---

## 8. Class Diagram

```mermaid
classDiagram
    class Bill {
        +String id
        +Int billNumber
        +String vehicleNo
        +String customerName
        +String customerAddress
        +String route
        +Float startMeter
        +Float endMeter
        +Float hireRate
        +Float allowedKm
        +Float packageCharge
        +Float totalAmount
        +String currency
        +Float exchangeRate
        +String paymentMethod
        +Float extraHours
        +Float extraHourRate
        +Float extraKm
        +Float scheduledDays
        +Float accommodationCharge
        +Float mealsCharge
        +Float activitiesCharge
        +Float otherCostsCharge
        +String itinerary
        +createBill(formData) ActionResult
        +updateBill(id, formData) ActionResult
        +deleteBill(id) ActionResult
        +getBills(search) Bill[]
        +getBillById(id) Bill
    }

    class Vehicle {
        +String id
        +String vehicleNo
        +String model
        +String category
        +String status
        +Float ratePerDay
        +Float kmPerDay
        +Float excessKmRate
        +Float extraHourRate
        +Int seats
        +String acType
        +Float currentMileage
        +Float oilChangeInterval
        +Float lastOilChangeMileage
        +createVehicle(formData) ActionResult
        +updateVehicle(id, formData) ActionResult
        +deleteVehicle(id) ActionResult
        +checkAvailability(vehicleNo, start, end) Conflict[]
        +isPerKmMode() Boolean
    }

    class Customer {
        +String id
        +String name
        +String mobile
        +String email
        +String address
        +createCustomer(formData) ActionResult
        +updateCustomer(id, formData) ActionResult
        +deleteCustomer(id) ActionResult
    }

    class TourSchedule {
        +String id
        +String name
        +Int days
        +String vehicleCategory
        +Float ratePerDay
        +Float kmPerDay
        +Boolean isActive
        +TourScheduleDayItem[] items
        +createSchedule(data) ActionResult
        +updateSchedule(id, data) ActionResult
        +deleteSchedule(id) ActionResult
    }

    class TourScheduleDayItem {
        +String id
        +Int dayNumber
        +String title
        +Float distanceKm
        +Float accommodation
        +Float meals
        +Float activities
        +Float otherCosts
    }

    class Quotation {
        +String id
        +Int quotationNumber
        +String customerName
        +String vehicleNo
        +Float hireRatePerDay
        +Float totalAmount
        +String status
        +generateQuotation(tourScheduleId, formData) ActionResult
        +updateStatus(id, status) ActionResult
        +convertToBooking(id) ActionResult
    }

    class Booking {
        +String id
        +String vehicleNo
        +String customerName
        +DateTime startDate
        +DateTime endDate
        +String status
        +Float advanceAmount
        +String refundStatus
        +createBooking(formData) ActionResult
        +cancelBooking(id) ActionResult
    }

    class User {
        +String id
        +String name
        +String email
        +String password
        +String role
        +createUser(formData) ActionResult
        +deleteUser(id) ActionResult
        +updateProfile(formData) ActionResult
        +updatePassword(formData) ActionResult
    }

    class VehicleExpense {
        +String id
        +String vehicleNo
        +Float amount
        +String category
        +String description
        +DateTime date
        +addExpense(data) ActionResult
        +deleteExpense(id) ActionResult
    }

    class TripActivity {
        +String id
        +String type
        +String note
        +DateTime timestamp
        +logActivity(bookingId, type, note) ActionResult
    }

    class BusinessProfile {
        +String companyName
        +String address
        +String phone
        +Float usdRate
        +String logoUrl
        +String bankName
        +updateProfile(formData) ActionResult
    }

    class CalculationEngine {
        +Float startMeter
        +Float endMeter
        +Float hireRate
        +Float packageCharge
        +Float allowedKm
        +calculateDistance() Float
        +calculateBaseCharge() Float
        +calculateExtraCharges() Float
        +calculateTotal() Float
    }

    TourSchedule "1" --> "*" TourScheduleDayItem : contains
    TourSchedule "1" --> "*" Quotation : generates
    User "1" --> "*" Booking : drives
    User "1" --> "*" Quotation : assigned to
    User "1" --> "*" VehicleExpense : records
    User "1" --> "*" TripActivity : logs
    Booking "1" --> "*" TripActivity : tracks
    Bill ..> CalculationEngine : uses
    Bill ..> Vehicle : references
    Bill ..> Customer : references
    Quotation ..> Vehicle : references
    Booking ..> Vehicle : references
```

---

## 9. Sequence Diagrams

### 9.1 Quotation to Booking to Bill Flow

```mermaid
sequenceDiagram
    participant A as Admin
    participant QE as Quotation Engine
    participant AV as Availability Checker
    participant DB as Database
    participant C as Customer
    participant BE as Billing Engine
    participant PR as Print Engine

    A->>QE: Select Tour Schedule
    QE->>DB: Fetch Schedule + Day Items
    DB-->>QE: Schedule Data
    A->>QE: Select Vehicle + Driver
    QE->>AV: Check Vehicle Availability
    AV->>DB: Query Bills, Bookings, Quotations
    DB-->>AV: Conflict List
    AV-->>QE: Available / Conflict
    A->>QE: Set Pricing + Markup
    QE->>QE: Calculate Total
    QE->>DB: Save Quotation (DRAFT)
    QE-->>A: Quotation Created
    A->>QE: Update Status to SENT
    QE-->>C: Quotation Delivered

    Note over C,A: Customer Accepts

    A->>QE: Convert to Booking
    QE->>AV: Re-check Availability
    AV-->>QE: Available
    QE->>DB: Create Booking + Set Quote ACCEPTED
    QE-->>A: Booking Created

    Note over A,DB: Tour Completes

    A->>BE: Create Bill (from Booking)
    BE->>BE: Auto-fill from Booking Data
    A->>BE: Enter Meter Readings
    BE->>BE: Calculate Charges
    BE->>DB: Save Bill + Update Vehicle Mileage
    BE-->>A: Bill Created
    A->>PR: Print A4 Invoice
    PR-->>A: Invoice PDF
```

### 9.2 Bill Creation with Per-Km Pricing

```mermaid
sequenceDiagram
    participant A as Admin
    participant BC as BillCreator
    participant CE as Calculation Engine
    participant DB as Database

    A->>BC: Select Vehicle (Per-Km mode)
    BC->>DB: Fetch Vehicle Data
    DB-->>BC: ratePerDay=0, excessKmRate=140

    Note over BC: Detects Per-Km Mode<br/>Hides Package fields

    BC->>BC: Auto-fill Rate = 140/km
    A->>BC: Enter Start Meter: 45000
    A->>BC: Enter End Meter: 45461
    BC->>CE: Calculate
    CE->>CE: Distance = 461 km
    CE->>CE: Base = 461 × 140 = Rs. 64,540
    CE->>CE: Add extras (waiting, gate, etc.)
    CE-->>BC: Total = Rs. 64,540
    A->>BC: Submit Bill
    BC->>DB: Save Bill
    BC->>DB: Update Vehicle Mileage to 45461
    DB-->>BC: Success
    BC-->>A: Redirect to Print Page
```

### 9.3 Driver Trip Activity Flow

```mermaid
sequenceDiagram
    participant D as Driver
    participant DD as Driver Dashboard
    participant QA as Quick Actions
    participant DB as Database

    D->>DD: Open Active Tour
    DD->>DB: Fetch Driver's Active Booking
    DB-->>DD: Booking + Vehicle + Itinerary
    DD-->>D: Show Tour Progress (Day X of Y)

    D->>QA: Tap "Fuel Fill"
    QA->>QA: Enter Amount
    QA->>DB: Create VehicleExpense (FUEL)
    QA->>DB: Create TripActivity (FUEL_FILL)
    DB-->>QA: Saved
    QA-->>D: Activity Logged

    D->>QA: Tap "Breakdown"
    QA->>QA: Enter Details
    QA->>DB: Create VehicleExpense (BREAKDOWN)
    QA->>DB: Create TripActivity (BREAKDOWN)
    DB-->>D: Logged with Timestamp
```

### 9.4 Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant LP as Login Page
    participant NA as NextAuth
    participant DB as Database
    participant AG as Auth Guard

    U->>LP: Enter Email + Password
    LP->>NA: signIn("credentials")
    NA->>DB: Find User by Email
    DB-->>NA: User Record
    NA->>NA: bcrypt.compare(password, hash)
    alt Password Matches
        NA->>NA: Create JWT Session
        NA-->>LP: Session Token
        LP-->>U: Redirect to Dashboard
    else Password Fails
        NA-->>LP: "Invalid email or password"
        LP-->>U: Show Error
    end

    Note over U,AG: Subsequent Requests

    U->>AG: Access Protected Route
    AG->>NA: getSession()
    NA-->>AG: Session (email, role)
    AG->>DB: Find User by Email
    alt Role = ADMIN
        AG-->>U: Full Access
    else Role = DRIVER
        AG-->>U: Driver Portal Only
    end
```

---

## 10. State Diagrams

### 10.1 Quotation Lifecycle

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Create Quotation
    DRAFT --> SENT : Send to Customer
    SENT --> ACCEPTED : Customer Accepts
    SENT --> EXPIRED : Validity Period Ends
    DRAFT --> EXPIRED : Validity Period Ends
    ACCEPTED --> BOOKING_CREATED : Convert to Booking
    DRAFT --> DRAFT : Edit Details
    SENT --> DRAFT : Revise

    state ACCEPTED {
        [*] --> AvailabilityCheck
        AvailabilityCheck --> Confirmed : Vehicle Available
        AvailabilityCheck --> Conflict : Vehicle Unavailable
    }
```

### 10.2 Booking Lifecycle

```mermaid
stateDiagram-v2
    [*] --> CONFIRMED : Create Booking
    CONFIRMED --> COMPLETED : Tour Ends / Bill Created
    CONFIRMED --> CANCELLED : Admin Cancels

    state CANCELLED {
        [*] --> RefundCheck
        RefundCheck --> REFUNDED : Cancelled > 7 days before start
        RefundCheck --> FORFEITED : Cancelled <= 7 days before start
    }

    COMPLETED --> [*]
    CANCELLED --> [*]
```

### 10.3 Vehicle Status

```mermaid
stateDiagram-v2
    [*] --> ACTIVE : Register Vehicle
    ACTIVE --> MAINTENANCE : Maintenance Due
    MAINTENANCE --> ACTIVE : Maintenance Complete
    ACTIVE --> RETIRED : Decommission
    MAINTENANCE --> RETIRED : Beyond Repair
    RETIRED --> [*]

    state ACTIVE {
        [*] --> Available
        Available --> OnTour : Booking Starts
        OnTour --> Available : Booking Ends
    }

    state MAINTENANCE {
        [*] --> OilChange
        [*] --> FilterChange
        [*] --> BodyWash
        [*] --> Repair
    }
```

### 10.4 Bill Pricing Mode

```mermaid
stateDiagram-v2
    [*] --> SelectVehicle : Start Bill

    state SelectVehicle {
        [*] --> CheckRate
        CheckRate --> PerDayPackage : ratePerDay > 0
        CheckRate --> PerKmFlat : ratePerDay = 0
    }

    state PerDayPackage {
        [*] --> ShowPackageCharge
        ShowPackageCharge --> ShowAllowedKm
        ShowAllowedKm --> CalcExcessKm
        CalcExcessKm --> CalcPackageTotal
    }

    state PerKmFlat {
        [*] --> HidePackageFields
        HidePackageFields --> ShowRatePerKm
        ShowRatePerKm --> CalcDistanceCharge
        CalcDistanceCharge --> CalcFlatTotal
    }

    PerDayPackage --> AddExtras
    PerKmFlat --> AddExtras
    AddExtras --> FinalTotal
    FinalTotal --> [*]
```

---

## 11. Component Architecture

```mermaid
graph TB
    subgraph "App Shell"
        LAYOUT["RootLayout"]
        SIDEBAR["Sidebar"]
        MOBILE_HEADER["MobileHeader"]
        THEME["ThemeProvider"]
        SESSION["SessionProvider"]
        AURORA["Aurora Background<br/>Grainient.tsx"]
    end

    subgraph "Page Components"
        DASH["Dashboard"]
        DRIVER_DASH["DriverDashboard"]
        BILLS_PAGE["Bills Page"]
        QUOTES_PAGE["Quotations Page"]
        VEHICLES_PAGE["Vehicles Page"]
        BOOKINGS_PAGE["Bookings Page"]
        CUSTOMERS_PAGE["Customers Page"]
        SCHEDULES_PAGE["Tour Schedules Page"]
        USERS_PAGE["Users Page"]
        SETTINGS_PAGE["Settings Page"]
        PROFILE_PAGE["Profile Page"]
    end

    subgraph "Feature Components"
        BILL_CREATOR["BillCreator"]
        QUOTE_CREATOR["QuotationCreator"]
        VEHICLE_FORM["VehicleForm"]
        CUSTOMER_FORM["CustomerForm"]
        BOOKING_CREATOR["BookingCreator"]
        SCHEDULE_FORM["TourScheduleForm"]
        PROFILE_FORM["ProfileForm"]
        BIZ_PROFILE["BusinessProfileForm"]
    end

    subgraph "Display Components"
        VEHICLE_LIST["VehicleList"]
        QUOTE_LIST["QuotationList"]
        SCHEDULE_LIST["TourScheduleList"]
        CUSTOMER_LIST["CustomerList"]
        SCHEDULE_DETAIL["TourScheduleDetail"]
        EXPENSE_MGR["VehicleExpenseManager"]
        DRIVER_TABS["DriverTourTabs"]
    end

    subgraph "Print Components"
        INVOICE["InvoiceTemplate<br/>A4 + Thermal"]
        QUOTE_TPL["QuotationTemplate<br/>A4 Format"]
        BT_PRINT["BluetoothPrintButton"]
        PRINT_BTN["PrintButton"]
    end

    subgraph "Shared Components"
        COMBOBOX["ComboboxField"]
        SEARCH["SearchInput"]
        DATE_PICKER["DateTimePicker"]
        PWD_INPUT["PasswordInput"]
        PAGE_TRANS["PageTransition"]
        QUICK_ACT["QuickActionSheet"]
        DELETE_BTN["DeleteBillButton"]
    end

    subgraph "Hooks"
        USE_CALC["useCalculationEngine"]
        USE_ENTER["useEnterNavigation"]
    end

    LAYOUT --> SIDEBAR
    LAYOUT --> MOBILE_HEADER
    LAYOUT --> THEME
    LAYOUT --> SESSION
    LAYOUT --> AURORA

    BILL_CREATOR --> USE_CALC
    BILL_CREATOR --> COMBOBOX
    BILL_CREATOR --> DATE_PICKER
    BILL_CREATOR --> USE_ENTER
    QUOTE_CREATOR --> COMBOBOX
    QUOTE_CREATOR --> DATE_PICKER
    INVOICE --> BT_PRINT
    INVOICE --> PRINT_BTN
    DRIVER_DASH --> QUICK_ACT
    DRIVER_DASH --> EXPENSE_MGR
```

---

## 12. Database Schema

### 12.1 Complete Model Reference

> [!IMPORTANT]
> **11 database models** stored in PostgreSQL via Prisma ORM. No Prisma enums are used — all enums are application-level strings validated by Zod schemas.

#### Bill Model
| Field | Type | Default | Description |
|---|---|---|---|
| id | String | cuid() | Primary key |
| billNumber | Int | autoincrement | Unique sequential bill number |
| vehicleNo | String | — | Vehicle registration number |
| customerName | String | — | Customer full name |
| customerAddress | String? | — | Customer address |
| route | String | — | Tour route description |
| startMeter | Float | — | Odometer at trip start |
| endMeter | Float | — | Odometer at trip end |
| hireRate | Float | — | Rate per km (excess or flat) |
| allowedKm | Float | 0 | Included km in package |
| waitingCharge | Float | 0 | Waiting charges |
| gatePass | Float | 0 | Gate/toll fees |
| packageCharge | Float | 0 | Base package charge (0 for per-km) |
| advanceAmount | Float | 0 | Advance payment received |
| totalAmount | Float | — | Calculated total amount |
| currency | String | "LKR" | LKR or USD |
| exchangeRate | Float | 1.0 | USD to LKR rate |
| totalAmountLKR | Float | 0 | Amount in LKR |
| paymentMethod | String | "CASH" | CASH or CREDIT |
| startDate | DateTime | now() | Trip start date/time |
| endDate | DateTime | now() | Trip end date/time |
| extraHours | Float | 0 | Hours beyond scheduled |
| extraHourRate | Float | 0 | Charge per extra hour |
| extraKm | Float | 0 | Km beyond package allowance |
| scheduledDays | Float | 1 | Number of tour days |
| accommodationCharge | Float | 0 | Total accommodation cost |
| mealsCharge | Float | 0 | Total meals cost |
| activitiesCharge | Float | 0 | Total activities cost |
| otherCostsCharge | Float | 0 | Miscellaneous costs |
| itinerary | String? | — | JSON snapshot of day items |

#### Vehicle Model
| Field | Type | Default | Description |
|---|---|---|---|
| id | String | cuid() | Primary key |
| vehicleNo | String | — | Unique registration number |
| model | String? | — | Vehicle make/model |
| category | String | "CAR" | CAR, VAN, SUV, BUS, LORRY |
| status | String | "ACTIVE" | ACTIVE, MAINTENANCE, RETIRED |
| ratePerDay | Float | 0 | Daily hire rate (0 = Per-Km mode) |
| kmPerDay | Float | 0 | Included km per day in package |
| excessKmRate | Float | 0 | Rate per km (excess or flat) |
| extraHourRate | Float | 0 | Charge per extra hour |
| seats | Int? | — | Passenger capacity |
| acType | String? | — | AC type description |
| features | String? | — | Feature list (free text) |
| insuranceCoverage | String? | — | Insurance details |
| currentMileage | Float | 0 | Current odometer reading |
| oilChangeInterval | Float | 5000 | Km between oil changes |
| lastOilChangeMileage | Float | 0 | Mileage at last oil change |
| filterChangeInterval | Float | 10000 | Km between filter changes |
| lastFilterChangeMileage | Float | 0 | Mileage at last filter change |
| washInterval | Float | 1000 | Km between body washes |
| lastWashMileage | Float | 0 | Mileage at last wash |

*(Full schema for all 11 models documented in the ER Diagram section above)*

---

## 13. Server Actions & API Reference

### 13.1 Bill Actions

| Action | Auth | Parameters | Returns | Description |
|---|---|---|---|---|
| `createBill` | Admin | FormData | `ActionResult<string>` | Creates bill, calculates total, updates vehicle mileage, auto-closes booking |
| `updateBill` | Admin | id, FormData | `ActionResult<string>` | Updates bill and recalculates total |
| `deleteBill` | Admin | id | `ActionResult<null>` | Permanently deletes bill |
| `getBills` | Public | searchQuery? | `Bill[]` | Search by billNumber, vehicleNo, customerName, route |
| `getBillById` | Public | id | `Bill` | Fetch single bill |

### 13.2 Vehicle Actions

| Action | Auth | Parameters | Returns | Description |
|---|---|---|---|---|
| `createVehicle` | Admin | FormData | `ActionResult<string>` | Register new vehicle with maintenance tracking |
| `updateVehicle` | Admin | id, FormData | `ActionResult<string>` | Update vehicle details |
| `deleteVehicle` | Admin | id | `ActionResult<null>` | Delete (blocked if has expenses) |
| `getVehicles` | Public | searchQuery? | `Vehicle[]` | Search by vehicleNo, model |
| `checkVehicleAvailability` | Public | vehicleNo, start, end | `Conflict[]` | Check against Bills, Bookings, Quotations |

### 13.3 Quotation Actions

| Action | Auth | Parameters | Returns | Description |
|---|---|---|---|---|
| `generateQuotation` | Admin | tourScheduleId, FormData | `ActionResult<string>` | Auto-calculates totals from schedule |
| `updateQuotation` | Auth | id, tourScheduleId, FormData | `ActionResult<string>` | Update with availability check |
| `updateQuotationStatus` | Public | id, status | `ActionResult<null>` | Change DRAFT/SENT/ACCEPTED/EXPIRED |
| `convertQuotationToBooking` | Admin | quotationId | `ActionResult<string>` | Atomic conversion with availability check |
| `deleteQuotation` | Admin | id | `ActionResult<null>` | Permanently delete |

### 13.4 Booking Actions

| Action | Auth | Parameters | Returns | Description |
|---|---|---|---|---|
| `createBooking` | Auth | FormData | `ActionResult<string>` | Create with vehicle availability check |
| `cancelBooking` | Admin | id | `ActionResult<null>` | Cancel with refund policy (>7 days = REFUNDED, ≤7 = FORFEITED) |
| `getBookings` | Public | searchQuery? | `Booking[]` | Search by vehicleNo, customerName, destination |

### 13.5 Tour Schedule Actions

| Action | Auth | Parameters | Returns | Description |
|---|---|---|---|---|
| `createTourSchedule` | Admin | data | `ActionResult<string>` | Create schedule + day items in transaction |
| `updateTourSchedule` | Admin | id, data | `ActionResult<string>` | Update with delete/recreate of day items |
| `deleteTourSchedule` | Admin | id | `ActionResult<null>` | Soft delete (isActive = false) |

### 13.6 Expense & Activity Actions

| Action | Auth | Parameters | Returns | Description |
|---|---|---|---|---|
| `addVehicleExpense` | Auth | data | `ActionResult<string>` | Drivers need active booking for vehicle; auto-updates maintenance mileage |
| `logTripActivity` | Auth | bookingId, type, note? | `ActionResult<string>` | Driver must be assigned to booking |
| `getDriverTourHistory` | Auth | type | `Booking[]` | Upcoming or completed tours (max 20) |

### 13.7 API Routes

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/[...nextauth]` | ALL | — | NextAuth authentication endpoints |
| `/api/keepalive` | GET | — | Lightweight DB ping to prevent Supabase pause |

---

## 14. User Roles & Permissions

```mermaid
graph TB
    subgraph "ADMIN Role"
        A1["✅ Full Dashboard"]
        A2["✅ Manage Vehicles"]
        A3["✅ Manage Bills (CRUD)"]
        A4["✅ Manage Quotations"]
        A5["✅ Manage Bookings"]
        A6["✅ Manage Tour Schedules"]
        A7["✅ Manage Customers"]
        A8["✅ Manage Users"]
        A9["✅ Business Settings"]
        A10["✅ A4 Invoice Printing"]
        A11["✅ Vehicle Expenses (Desktop)"]
        A12["✅ Convert Quotation → Booking"]
        A13["✅ Cancel Bookings"]
        A14["✅ Delete Records"]
    end

    subgraph "DRIVER Role"
        D1["✅ Driver Dashboard"]
        D2["✅ Active Tour View"]
        D3["✅ Tour History"]
        D4["✅ Thermal Receipt Printing"]
        D5["✅ Log Trip Activities"]
        D6["✅ Record Expenses (Mobile)"]
        D7["✅ Profile Management"]
        D8["❌ No CRUD on Vehicles"]
        D9["❌ No Bill Creation"]
        D10["❌ No Quotation Access"]
        D11["❌ No User Management"]
        D12["❌ No Business Settings"]
    end
```

### Permission Matrix

| Feature | Admin | Driver |
|---|:---:|:---:|
| Login / Profile | ✅ | ✅ |
| Dashboard (Full) | ✅ | ❌ |
| Dashboard (Driver) | ❌ | ✅ |
| Create/Edit/Delete Bills | ✅ | ❌ |
| Print A4 Invoice | ✅ | ❌ |
| Print Thermal Receipt | ✅ | ✅ |
| Create/Edit Quotations | ✅ | ❌ |
| Print Quotations | ✅ | ❌ |
| Create/Cancel Bookings | ✅ | ❌ |
| View Bookings | ✅ | ✅ (own) |
| Manage Vehicles | ✅ | ❌ |
| Manage Tour Schedules | ✅ | ❌ |
| Manage Customers | ✅ | ❌ |
| Manage Users | ✅ | ❌ |
| Business Settings | ✅ | ❌ |
| Record Expenses | ✅ | ✅ (own vehicle) |
| Log Trip Activities | ✅ | ✅ (assigned tours) |
| View Tour History | ✅ | ✅ (own) |
| Bluetooth Printing | ✅ | ✅ |

---

## 15. Feature Documentation

### 15.1 Dual Pricing Modes

VIGIL supports two distinct vehicle pricing modes:

**Per-Day Package Mode** (`ratePerDay > 0`)
- Vehicle has a daily hire rate (e.g., Rs. 15,000/day)
- Includes a km allowance per day (e.g., 100 km/day)
- Excess km charged at a separate rate
- Suitable for tour packages with predictable daily pricing

**Per-Km Flat Rate Mode** (`ratePerDay = 0`)
- Vehicle charges purely based on distance traveled
- Rate per km applied to total trip distance
- No package charge or km allowance
- Suitable for airport transfers, point-to-point trips

```mermaid
graph LR
    subgraph "Per-Day Package"
        PD1["Daily Rate: Rs. 15,000"]
        PD2["Included: 100 km/day"]
        PD3["Excess: Rs. 120/km"]
        PD4["3-day trip: Rs. 45,000 base"]
        PD5["+ excess km charges"]
    end

    subgraph "Per-Km Flat Rate"
        PK1["Rate: Rs. 140/km"]
        PK2["No package charge"]
        PK3["No km allowance"]
        PK4["461 km trip"]
        PK5["= Rs. 64,540 total"]
    end
```

### 15.2 Calculation Engine

The billing calculation engine follows a **3-tier priority system**:

| Priority | Condition | Formula |
|---|---|---|
| **1. Tour Distance Mode** | `totalTourDistance > 0` | `extraKm × hireRate` |
| **2. Package Mode** | `allowedKm > 0 && packageCharge > 0` | `excessKm × hireRate` (excess only) |
| **3. Flat Rate Mode** | Default | `totalDistance × hireRate` |

**Extra Charges** (added to all modes):
`waitingCharge + gatePass + packageCharge + (extraHours × extraHourRate) + accommodation + meals + activities + otherCosts`

### 15.3 Vehicle Maintenance Tracking

```mermaid
graph TB
    MILEAGE["Current Mileage Updated<br/>After Every Bill"]

    subgraph "Maintenance Alerts"
        OIL["🔴 Oil Change Due<br/>Every 5,000 km"]
        FILTER["🟠 Filter Change Due<br/>Every 10,000 km"]
        WASH["🔵 Body Wash Due<br/>Every 1,000 km"]
    end

    subgraph "Auto-Reset on Expense"
        OIL_EXP["Record OIL_CHANGE expense<br/>→ Reset lastOilChangeMileage"]
        FILTER_EXP["Record FILTER_CHANGE expense<br/>→ Reset lastFilterChangeMileage"]
        WASH_EXP["Record BODY_WASH expense<br/>→ Reset lastWashMileage"]
    end

    MILEAGE --> OIL
    MILEAGE --> FILTER
    MILEAGE --> WASH
    OIL --> OIL_EXP
    FILTER --> FILTER_EXP
    WASH --> WASH_EXP
```

### 15.4 Availability Checking

The system performs real-time availability checking across three data sources:

```mermaid
graph TB
    CHECK["Check Vehicle Availability<br/>for Date Range"]

    CHECK --> BILLS["Scan Bills<br/>startDate ↔ endDate overlap"]
    CHECK --> BOOKINGS["Scan Confirmed Bookings<br/>startDate ↔ endDate overlap"]
    CHECK --> QUOTES["Scan Accepted Quotations<br/>startDate ↔ endDate overlap"]

    BILLS --> RESULT{"Any Conflicts?"}
    BOOKINGS --> RESULT
    QUOTES --> RESULT

    RESULT -->|"Yes"| BLOCK["Block Submission<br/>Show Conflict Details"]
    RESULT -->|"No"| ALLOW["Allow Booking/Quote"]
```

### 15.5 Print System

| Format | Target User | Size | Features |
|---|---|---|---|
| **A4 Portrait Invoice** | Admin | 190mm × ~270mm | Company header, trip details, calculation table, signatures, "Powered by Bitgard" footer |
| **58mm Thermal Receipt** | Driver | 58mm width | Compact layout, large balance text, Bluetooth print support |
| **A4 Quotation** | Admin → Customer | 190mm × ~270mm | Vehicle specs panel, day-by-day itinerary table, cost summary, bank details, terms |

### 15.6 Refund Policy

```mermaid
graph LR
    CANCEL["Cancel Booking"]
    CHECK{"Days Until<br/>Start Date?"}
    REFUND["✅ REFUNDED<br/>Full advance returned"]
    FORFEIT["❌ FORFEITED<br/>Advance not returned"]

    CANCEL --> CHECK
    CHECK -->|"> 7 days"| REFUND
    CHECK -->|"≤ 7 days"| FORFEIT
```

---

## 16. Deployment Architecture

```mermaid
graph TB
    subgraph "Developer"
        DEV["Local Development<br/>npm run dev"]
        GIT["Git Push to GitHub"]
    end

    subgraph "CI/CD Pipeline"
        VERCEL_BUILD["Vercel Build<br/>next build (Turbopack)"]
        SENTRY_UPLOAD["Sentry Source Maps<br/>Upload"]
        PRISMA_GEN["prisma generate<br/>(postinstall)"]
    end

    subgraph "Production"
        CDN["Vercel Edge CDN<br/>Static Assets"]
        SERVERLESS["Vercel Serverless<br/>API + Server Actions"]
        SUPABASE["Supabase PostgreSQL<br/>ap-south-1"]
    end

    subgraph "Monitoring"
        SENTRY_DASH["Sentry Dashboard<br/>Error Tracking"]
        CRON["External Cron<br/>Every 3-5 Days"]
        KEEPALIVE["GET /api/keepalive<br/>DB Ping"]
    end

    DEV --> GIT
    GIT --> VERCEL_BUILD
    VERCEL_BUILD --> PRISMA_GEN
    VERCEL_BUILD --> SENTRY_UPLOAD
    VERCEL_BUILD --> CDN
    VERCEL_BUILD --> SERVERLESS
    SERVERLESS --> SUPABASE
    SENTRY_UPLOAD --> SENTRY_DASH
    CRON --> KEEPALIVE
    KEEPALIVE --> SUPABASE

    style CDN fill:#000,stroke:#fff,color:#fff
    style SUPABASE fill:#3ECF8E,stroke:#000,color:#000
    style SENTRY_DASH fill:#362D59,stroke:#fff,color:#fff
```

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Supabase) |
| `AUTH_SECRET` | NextAuth JWT signing secret |
| `NEXT_PUBLIC_APP_URL` | Public application URL |

### Security Headers (Applied to All Routes)

| Header | Value |
|---|---|
| X-Frame-Options | SAMEORIGIN |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | origin-when-cross-origin |
| X-XSS-Protection | 1; mode=block |
| Permissions-Policy | camera=(), microphone=(), geolocation=() |
| Strict-Transport-Security | max-age=31536000; includeSubDomains |

---

## 17. Security Features

```mermaid
graph TB
    subgraph "Authentication"
        CRED["Credentials Provider<br/>Email + Password"]
        BCRYPT["bcryptjs Hashing<br/>10 Salt Rounds"]
        JWT["JWT Session Tokens"]
        RESET["Password Reset<br/>1-Hour Token Expiry"]
        RATE["Rate Limiting<br/>5 resets / 15 min"]
    end

    subgraph "Authorization"
        GUARD["Auth Guard Middleware"]
        ADMIN_CHECK["requireAdmin()"]
        AUTH_CHECK["requireAuth()"]
        ROLE["Role-Based Access<br/>ADMIN | DRIVER"]
    end

    subgraph "Data Protection"
        VALID["Zod Schema Validation<br/>Client + Server"]
        SQL["Prisma Parameterized Queries<br/>SQL Injection Prevention"]
        HEADERS["Security Headers<br/>XSS, Clickjacking, HSTS"]
        CSRF["Server Actions<br/>Built-in CSRF Protection"]
    end

    subgraph "Monitoring"
        SENTRY_MON["Sentry Error Tracking"]
        SENTRY_PERF["Sentry Performance<br/>Monitoring"]
    end

    CRED --> BCRYPT
    BCRYPT --> JWT
    RESET --> RATE
    GUARD --> ADMIN_CHECK
    GUARD --> AUTH_CHECK
    ADMIN_CHECK --> ROLE
```

### Security Checklist

| Security Measure | Status | Implementation |
|---|:---:|---|
| Password Hashing | ✅ | bcryptjs with 10 rounds |
| JWT Sessions | ✅ | NextAuth v5 |
| Role-Based Access | ✅ | Auth Guard pattern |
| Input Validation | ✅ | Zod v4 (dual client/server) |
| SQL Injection Prevention | ✅ | Prisma parameterized queries |
| XSS Protection | ✅ | Security headers + React escaping |
| CSRF Protection | ✅ | Next.js Server Actions |
| Clickjacking Prevention | ✅ | X-Frame-Options: SAMEORIGIN |
| HTTPS Enforcement | ✅ | HSTS header (1 year) |
| Rate Limiting | ✅ | Password reset endpoint |
| Error Monitoring | ✅ | Sentry integration |
| Permission Policy | ✅ | No camera/mic/geo access |

---

## 18. Appendix

### A. Expense Categories

| Category | Icon | Color | Description |
|---|---|---|---|
| REPAIR | 🔧 | Red | General vehicle repairs |
| BREAKDOWN | ⚠️ | Orange | Roadside breakdowns |
| FUEL | ⛽ | Blue | Fuel fills |
| SERVICE | 🛠️ | Purple | Scheduled servicing |
| OIL_CHANGE | 💧 | Amber | Oil change (resets maintenance counter) |
| FILTER_CHANGE | 🔲 | Teal | Filter replacement (resets counter) |
| BODY_WASH | 🚿 | Cyan | Vehicle body wash (resets counter) |
| OTHER | 📋 | Gray | Miscellaneous expenses |

### B. Trip Activity Types

| Type | Description |
|---|---|
| FUEL_FILL | Driver refueled the vehicle |
| FLAT_TIRE | Tire puncture/replacement |
| STOP | Unscheduled stop |
| HOTEL_CHECKIN | Hotel check-in for overnight stay |
| RESUME | Resumed journey after stop |
| BREAKDOWN | Vehicle breakdown event |
| NOTE | General driver note |

### C. Vehicle Categories

| Category | Typical Use |
|---|---|
| CAR | Airport transfers, small tours (4 pax) |
| VAN | Group tours, family trips (14 pax) |
| SUV | Safari, luxury tours (7 pax) |
| BUS | Large group tours (40+ pax) |
| LORRY | Equipment transport |

### D. Payment Methods

| Method | Description |
|---|---|
| CASH | Cash payment on completion |
| CREDIT | Credit/deferred payment |

### E. Currency Support

| Currency | Code | Exchange Rate |
|---|---|---|
| Sri Lankan Rupee | LKR | 1.0 (base) |
| US Dollar | USD | Configurable (default: 300.0) |

---

> **Document Version:** 1.0  
> **Generated:** July 2026  
> **System:** VIGIL Smart Travel Management  
> **Developer:** Bitgard PVT LTD  
> **Contact:** +94 70 563 3969  

---

*This document is confidential and intended for internal use and prospective clients only. Subscription pricing is subject to change.*
]]>
