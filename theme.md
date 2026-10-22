# ==============================================================================
# MASTER SYSTEM SPECIFICATION: TOURBILLER (VIGIL TOUR MANAGEMENT PLATFORM)
# ==============================================================================
# ARCHITECTURAL BASELINE: BitgardWeb Dual-Theme Design System
# DAY THEME: Alabaster Silk & Titanium Ceramic (#FBF9F5 / #EFECE6 / Matte Orange #E8732A)
# NIGHT THEME: Deep Midnight Obsidian (#040504 / #0D0D0D / Matte Orange #E8732A)
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

## 2. BitgardWeb Dual-Theme Specification (Day & Night)

### 2.1 The Two Synchronized Themes

The Bitgard design language bridges high-tech tactical control-room aesthetics across daylight field operations and midnight control rooms:

| Token / Role | Day Theme (Alabaster Silk & Titanium) | Night Theme (Midnight Obsidian Abyss) | Architectural Role |
| :--- | :--- | :--- | :--- |
| **`--background`** | `hsl(35 24% 97.5%)` (`#FBF9F5`) | `hsl(0 0% 5%)` (`#0D0D0D` / `#040504`) | Application canvas. In Day mode: warm ceramic alabaster paper tone eliminating eye strain. In Night mode: OLED deep space void. |
| **`--foreground`** | `hsl(24 15% 12%)` (`#1F1D1A`) | `hsl(33 28% 94%)` (`#F5F0EB`) | Primary typography. Day: crisp obsidian graphite. Night: soft off-white. |
| **`--card`** | `hsl(0 0% 100%)` (`#FFFFFF / 0.80`) | `hsl(222 47% 6%)` (`#080C14 / 0.50`) | Frosted glass surfaces with `backdrop-blur-xl`. |
| **`--card-foreground`** | `hsl(24 15% 12%)` (`#1F1D1A`) | `hsl(0 0% 100%)` (`#FFFFFF`) | Elevated text inside card tiles. |
| **`--primary`** | `hsl(23 81% 54%)` (`#E8732A`) | `hsl(23 81% 54%)` (`#E8732A`) | **Signature Matte Orange** — Identical brand identity across day and night. |
| **`--primary-foreground`**| `hsl(0 0% 100%)` (`#FFFFFF`) | `hsl(0 0% 100%)` (`#FFFFFF`) | High-contrast white on Matte Orange buttons. |
| **`--secondary`** | `hsl(33 20% 93%)` (`#EFECE6`) | `hsl(217 33% 20%)` (`#222B3A`) | Secondary keycaps, toolbar chips, and table headers. |
| **`--secondary-foreground`**| `hsl(24 15% 15%)` (`#262320`) | `hsl(0 0% 100%)` (`#FFFFFF`) | Text on secondary surfaces. |
| **`--muted`** | `hsl(33 22% 94.5%)` (`#F3F0EA`) | `hsl(217 33% 12%)` (`#141A24`) | Recessed wells, LCD telemetry wells, inactive tracks. |
| **`--muted-foreground`**| `hsl(25 12% 46%)` (`#7B736B`) | `hsl(215 20% 65%)` (`#94A3B8`) | Supporting labels, timestamps, metadata. |
| **`--border`** | `hsl(33 15% 87%)` (`#E2DDD4`) | `hsl(0 0% 12%)` (`#1F1F1F`) | Hairline structural dividers (`1px`). |
| **`--border-specular`** | `rgba(255, 255, 255, 0.95)` | `rgba(255, 255, 255, 0.07)` | Overhead studio light reflection (`inset 0 1px 0 0`) on glass cards and buttons. |
| **`--accent`** | `hsl(23 85% 95%)` (`#FDF2EC`) | `hsl(23 45% 16%)` (`#3A2316`) | Warm Amber/Obsidian tint for highlights & interactive focus. |
| **`--destructive`** | `hsl(350 85% 58%)` (`#E11D48`) | `hsl(330 80% 60%)` (`#E64A85`) | Crimson alert for breakdowns, emergency dispatch, and cancellations. |

---

### 2.2 Typography Engine (Major Third 1.250 Scale)

| Role | Font Family | Typical Usage |
| :--- | :--- | :--- |
| **Heading (`--font-heading`)** | **Orbitron** (`sans-serif`, 400–900) | Tactical screen titles, vehicle plates, telemetry readouts, radar HUD numbers, hero displays. |
| **Subheading (`--font-subheading`)** | **Space Grotesk** (`sans-serif`, 300–700) | Card headings, stat labels, tab headers, table headers. |
| **Body (`--font-body`)** | **Inter** (`system-ui, sans-serif`) | Dense operational text, itineraries, customer cards, billing calculations. |
| **Monospace (`--font-mono`)** | **JetBrains Mono** / `SFMono` | Odometer readings, GPS coordinates, timestamps, receipt previews. |

**Major Third (1.250) Geometric Font Sizes:**
- `text-xs`: `0.640rem` | `text-sm`: `0.800rem` | `text-base`: `1.000rem` | `text-lg`: `1.250rem`
- `text-xl`: `1.563rem` | `text-2xl`: `1.953rem` | `text-3xl`: `2.441rem` | `text-4xl`: `3.052rem`
- `text-5xl`: `3.815rem` | `text-6xl`: `4.768rem`

---

### 2.3 Neo-Skeuomorphic & Component Utilities

- **Daylight Keycap Buttons (`btn-tactile-secondary`)**:
  - In Day: `linear-gradient(180deg, #FFFFFF 0%, #F5F1EB 100%)` with crisp `#DCD5CB` ceramic hairline.
  - In Night: `linear-gradient(180deg, #222B3A 0%, #141A24 100%)` with dark titanium border.
- **Primary Buttons (`.btn-primary`)**:
  - `bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl shadow-lg shadow-primary-500/25`
  - Active hover: `hover:-translate-y-0.5 hover:shadow-primary-500/40 active:translate-y-0`
- **Tactical Cards (`.card` / `card-tactical`)**:
  - Translucent glass with `backdrop-blur-xl border border-border/70 dark:border-border/50 bg-card/80 dark:bg-card/50`
  - Hover: `hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_20px_40px_-12px_hsl(var(--primary)/0.18)]`
- **Dynamic Theme Switcher (`<ThemeSwitcher />`)**:
  - Smooth native `document.startViewTransition` with spring-physics animated rotating `Sun` (amber/orange) and `Moon` (Matte Orange) icons.

---
*TourBiller / VIGIL Dual-Theme (Day & Night) Specification.*
