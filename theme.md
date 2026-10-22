# ==============================================================================
# MASTER SYSTEM SPECIFICATION: TOURBILLER (VIGIL TOUR MANAGEMENT PLATFORM)
# ==============================================================================
# ARCHITECTURAL BASELINE: BitgardWeb Design System
# PALETTE: Deep Midnight Obsidian (#040504 / #0D0D0D), Matte Orange (#E8732A), Glassmorphism
# TYPOGRAPHY: Orbitron (Headings), Space Grotesk (Subheadings), Inter (Body), JetBrains Mono (Telemetry)
# STACK: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Prisma ORM 5, PostgreSQL, Tauri v2
# ==============================================================================

## 1. System Vision & Unified Multi-Surface Architecture

TourBiller (branded as **VIGIL**) operates as a single unified multi-surface platform servicing three form factors from the same codebase:
1. **Admin Desktop App**: Native Windows desktop binary compiled using Tauri v2 wrapping the Next.js frontend with low-latency hardware access and fleet radar monitoring.
2. **Admin Mobile App**: Cross-platform mobile binary (Android APK & iOS) compiled via Tauri v2 or run as a standalone responsive PWA for fleet owners on the go.
3. **Driver Mobile App**: Streamlined, high-contrast, touch-optimized field driver interface accessible via mobile web / PWA or Tauri Android build at `/driver/active-tour`.
4. **Cloud Backend & APIs**: Next.js 16 Route Handlers, PostgreSQL database with Prisma ORM, Server-Sent Events/Polling, and AI-assisted automation.

---

## 2. BitgardWeb Design System Specification

### 2.1 Color Palette & Semantic Tokens (Dark Theme Default)

```css
@layer base {
  :root,
  .dark {
    color-scheme: dark;

    /* Surface & Canvas (Near Black / Obsidian) */
    --background: 0 0% 5%;                 /* #0d0d0d / #040504 — Deep Midnight Obsidian Base */
    --foreground: 33 28% 94%;              /* #F5F0EB — Soft Off-White */
    --card: 222 47% 6%;                    /* #080c14 — Translucent Dark Glass Surface */
    --card-foreground: 0 0% 100%;
    --popover: 222 47% 6%;
    --popover-foreground: 0 0% 100%;

    /* Primary Brand Color (Matte Orange #E8732A) */
    --primary: 23 81% 54%;                 /* #E8732A — Core Brand Color */
    --primary-foreground: 0 0% 100%;       /* #FFFFFF */

    /* Secondary & Muted Layers */
    --secondary: 217 33% 20%;              /* #222b3a — Secondary Surface Fill */
    --secondary-foreground: 0 0% 100%;
    --muted: 217 33% 12%;                  /* #141a24 — Muted Subsurfaces / Tracks */
    --muted-foreground: 215 20% 65%;       /* #94a3b8 — Secondary Supporting Text */

    /* Accents & States */
    --accent: 258 90% 66%;                 /* #8B5CF6 — Electric Violet Accent */
    --accent-foreground: 0 0% 100%;
    --destructive: 330 80% 60%;            /* #E64A85 — Cyber Pink / Critical State */
    --destructive-foreground: 0 0% 100%;

    /* Hairline Borders & Inputs */
    --border: 0 0% 12%;                    /* #1f1f1f — Ultra-subtle Hairline Slate */
    --input: 0 0% 9%;                      /* #171717 — Input Field Background */
    --ring: 23 81% 54%;                    /* #E8732A — Focus Ring */

    /* Telemetry State Colors */
    --telemetry-moving: #10B981;           /* Emerald Glow (Active Moving Fleet) */
    --telemetry-idle: #F59E0B;             /* Amber Glow (Parked / Idle Fleet) */
  }
}
```

### 2.2 Color Ramps & Extended Palettes

- **Primary Matte Orange Ramp (`#E8732A` Core)**:
  `50`: `#FDF2EC` | `100`: `#FBE4D8` | `200`: `#F6C4AC` | `300`: `#F1A47F` | `400`: `#EC8353` |
  `500`: `#E8732A` (Brand Default) | `600`: `#C75C1D` (Hover/Active) | `700`: `#994716` | `800`: `#6E3310` | `900`: `#441F0A`
- **Near Black Obsidian Ramp (`dark`)**:
  `50`: `#1A1B1C` | `100`: `#141515` | `200`: `#0F1010` | `300`: `#0A0B0B` | `400`: `#060707` |
  `500`: `#040504` (Pure Obsidian) | `600`: `#030403` | `700`: `#020302` | `800`: `#010201` | `900`: `#000100` (Pure Void)
- **Slate Accent Ramp**:
  `50`: `#f8fafc` | `100`: `#f1f5f9` | `200`: `#e2e8f0` | `300`: `#cbd5e1` | `400`: `#94a3b8` |
  `500`: `#64748b` | `600`: `#475569` | `700`: `#334155` | `800`: `#1e293b` | `900`: `#0f172a` | `950`: `#020617`

### 2.3 Typography Engine (Major Third 1.250 Scale)

| Role | Font Family | Typical Usage |
| :--- | :--- | :--- |
| **Heading (`--font-heading`)** | **Orbitron** (`sans-serif`, 400–900) | Tactical screen titles, vehicle registration plates, live telemetry metrics, radar HUD numbers, hero displays. |
| **Subheading (`--font-subheading`)** | **Space Grotesk** (`sans-serif`, 300–700) | Card headings, stat labels, tab headers, table headers. |
| **Body (`--font-body`)** | **Inter** (`system-ui, sans-serif`) | Dense operational text, itineraries, customer cards, billing calculations. |
| **Monospace (`--font-mono`)** | **JetBrains Mono** / `SFMono` | Odometer readings, GPS coordinates, timestamps, receipt previews. |

**Major Third (1.250) Geometric Font Sizes:**
- `text-xs`: `0.640rem` (line-height: 1.6)
- `text-sm`: `0.800rem` (line-height: 1.6)
- `text-base`: `1.000rem` (line-height: 1.6)
- `text-lg`: `1.250rem` (line-height: 1.4)
- `text-xl`: `1.563rem` (line-height: 1.3)
- `text-2xl`: `1.953rem` (line-height: 1.2)
- `text-3xl`: `2.441rem` (line-height: 1.15)
- `text-4xl`: `3.052rem` (line-height: 1.1)
- `text-5xl`: `3.815rem` (line-height: 1.05)
- `text-6xl`: `4.768rem` (line-height: 1.0)

### 2.4 Component Styles & Visual Effects

- **Glassmorphism (`.glass`)**:
  `backdrop-blur-xl border border-[hsl(var(--border)/0.5)] bg-[hsl(var(--card)/0.7)]`
- **Tactical Cards (`.card` / `card-tactical`)**:
  `rounded-2xl p-6 transition-all duration-300 backdrop-blur-xl border border-[hsl(var(--border)/0.5)] bg-[hsl(var(--card)/0.5)]`
  Hover: `hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_20px_40px_-12px_hsl(var(--primary)/0.15)]`
- **Primary Action Buttons (`.btn-primary`)**:
  `bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl shadow-lg shadow-primary-500/25 hover:-translate-y-0.5 hover:shadow-primary-500/40 active:translate-y-0 transition-all`
- **Secondary Ghost Buttons (`.btn-secondary-ghost`)**:
  `border-2 border-primary-500/70 text-primary-400 hover:bg-primary-500/10 hover:border-primary-500 hover:text-primary-300 rounded-xl`
- **Text Shimmer Utilities**:
  - `.text-holo-orange`: Warm amber iridescent animated gradient text.
  - `.text-holo-white`: Silvery holographic iridescent text shimmer.
- **Ambient Background (`DarkVeil` / `AmbientAtmosphere`)**:
  Deep radial mesh glow and subtle noise veil replacing standard solid black backgrounds.

---

## 3. Core Business Principles & Rules

### A. Dual Audience Principle (Local & International)
- **Local Sri Lankan Clients**: Domestic hirers, corporate contracts, local day/multi-day hires priced in LKR with transparent breakdown of daily hire, fuel, and overtime.
- **International Foreign Tourists**: Overseas travelers requiring complete itineraries, foreign currency equivalents (USD, EUR, GBP), transparent itemization, and professional PDF quotations/invoices.

### B. Copywriting & Communication Rules
- **Customer-Facing Deliverables**: Strictly professional international English.
  - USE: "Driver Accommodation & Meals" (NEVER: "driver bata")
  - USE: "Highway Tolls & Parking Fees" (NEVER: "gate pass")
  - USE: "Excess Mileage Charge" (NEVER: "extra km")
  - USE: "Daily Mileage Allowance" (NEVER: "km per day")
- **Internal Operator & Driver Interfaces**: Clean English with helpful bilingual secondary labels (Sinhala / Tamil) for drivers (e.g., "Odometer (මීටර් කියවීම)", "Operating Costs (ධාවන වියදම්)").

### C. Multi-Currency Engine
- Multi-currency support across LKR, USD, EUR, GBP.
- Dynamic formatting using `formatCurrency(amount, currency)`.
- Real-time exchange rate conversions and transparent rate disclaimers.

---

## 4. Subsystem Implementations

### 4.1 Driver Mobile Application (`/driver/active-tour`)
- **Tabs**: Current, Upcoming, Completed.
- **Tour Progress Banner**: Day counter (`Day 2 of 5`), vehicle specs, customer phone dialer.
- **Trip Controls**: Odometer reading entry with validation against previous mileage.
- **GPS Live Radar & Turn-by-Turn Navigation (`DriverLiveNavigationCard`)**: HTML5 Geolocation Watcher streaming to `/api/driver/location`, tactical speedometer, deep-linked Google Maps / Waze navigation.
- **Quick Action Sheet (`QuickActionSheet`)**: 1-tap logging for Fuel Fill, Flat Tire, Stop, Hotel Check-In, Resume, Breakdown, Tour Note.
- **Bluetooth ESC/POS Thermal Printing (`BluetoothPrintButton`)**: Direct Web Bluetooth GATT printing of 58mm thermal receipts on portable printers.

### 4.2 Admin Control Room & Fleet Radar
- **Fleet Live Radar Map (`/live-tracking` & `FleetLiveMap`)**: Leaflet dark-mode map with Emerald (`#10B981`) moving markers, Amber (`#F59E0B`) idle markers, and Cyber Pink (`#E64A85`) breakdown markers.
- **Emergency Dispatch & Incident Management (`dispatch-audio.ts`)**:
  - Breakdown Alarm: Dual detuned oscillators (sawtooth + triangle) modulated by a 2.4Hz LFO (600Hz–1320Hz sweep).
  - Handover Chime: Harmonic bell arpeggio (C5 -> E5 -> G5 -> C6).
  - Repeating alarm loop every 5.5s until acknowledged.
  - Emergency Dispatch Banner (`EmergencyDispatchBanner`) & Vehicle Swapper (`BookingVehicleSwapper`).
- **Fleet Preventative Maintenance**: Automated threshold alerts for Engine Oil (5,000 km), Filters (10,000 km), Wash (1,000 km), Tyres (40,000 km), and 30-day license/insurance expiration warnings.

### 4.3 AI Tour Assistant ("VIGIL AI")
- 9 Integrated System Tools via Vercel AI SDK: `getVehicleStats`, `searchCustomers`, `searchTours`, `getLiveExchangeRate`, `addVehicle`, `createBooking`, `createQuotation`, `getEarningsReport`, `getMostUsedVehicle`.
- Floating cyber-tactical glass widget with bilingual capability (Sinhala / English).

---
*TourBiller / VIGIL Master Architecture & Design System Reference.*
