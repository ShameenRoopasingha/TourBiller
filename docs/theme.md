# VIGIL Design System & Theme Engine (v2.0 — Tactile Cockpit & Atmospheric Glass Edition)

> Architecture, token reference, and neo-skeuomorphic implementation blueprints for the **VIGIL Tour & Fleet Management Platform**.  
> Built with **Next.js 16 (App Router)**, **Tailwind CSS v4 (`@theme inline`)**, and **`next-themes`**.

---

## 1. Executive Directive & Design Philosophy

The VIGIL v2.0 design system merges **Linear/Raycast-grade atmospheric specular glass** with **Teenage Engineering / Apple hardware realism**, creating a mission-critical **Tactile Cockpit & Atmospheric Glass** interface tailored for real-time fleet telematics, high-density vehicle hire ledgers, and live tour logistics.

### The 80/20 Neo-Skeuomorphic Golden Rule

1. **80% Atmospheric Specular Glass:**
   - Multi-layered translucent surfaces with stepped luminance hierarchy.
   - `1px` overhead specular inner highlights (`inset 0 1px 0 0 var(--border-specular)`) that simulate overhead studio lighting on precision-milled glass and anodized aluminum, eliminating flat or muddy drop shadows.
   - Multi-tier ambient aurora mesh gradients, radial architectural dot grids, and SVG micro-noise (`feTurbulence`) to eliminate gradient banding on high-refresh OLED/Mini-LED monitors.

2. **20% Tactile Hardware Realism (Neo-Skeuomorphism):**
   - **Physical 3D Keycap Buttons:** Multi-stop top-lit gradients, subtle physical lip shadows, and spring-loaded click physics (`translateY(1px)` with pressed inner bevel).
   - **Recessed Machined Telemetry Wells:** Inset LCD digital readouts (`surface-recessed`) with dual inner shadows and crisp hairline borders for odometer readouts, GPS telemetry, and filter banks.
   - **Embossed Metallic License Plates:** Physical vehicle registration badges (`badge-license-plate`) featuring Sri Lankan provincial prefixes, monospaced digits, and **3D Domed Hardware LEDs** with specular glints and neon halos.
   - **Perforated Boarding Pass Cards:** Tactile tour vouchers (`ticket-perforated`) with side punch-out notches and dashed tear-off dividers for chauffeur dispatch and customer receipts.

---

## 2. Rendering Pipeline Architecture

```text
                         ┌──────────────────────────────────┐
                         │            next-themes           │
                         │  (System-Aware / Class Strategy) │
                         └─────────────────┬────────────────┘
                                           │
                         ┌─────────────────▼────────────────┐
                         │      <html class="dark|light">   │
                         │    + color-scheme: dark | light  │
                         └─────────────────┬────────────────┘
                                           │
               ┌───────────────────────────┴───────────────────────────┐
               ▼                                                       ▼
┌───────────────────────────┐                             ┌───────────────────────────┐
│   :root (Alabaster Silk)  │                             │   .dark (Obsidian Void)   │
│  High-Key Daylight Tokens │                             │  OLED Deep-Space Tokens   │
└─────────────┬─────────────┘                             └─────────────┬─────────────┘
              │                                                         │
              └────────────────────────────┬────────────────────────────┘
                                           ▼
                         ┌──────────────────────────────────┐
                         │          Tailwind CSS v4         │
                         │   @theme Semantic Token Engine   │
                         ├──────────────────────────────────┤
                         │ • 80% Specular Glass Surfaces    │
                         │ • 20% Tactile Hardware Realism   │
                         │ • Recessed LCD Telemetry Wells   │
                         │ • 3D Domed Status Beacons        │
                         │ • Perforated Boarding Vouchers   │
                         └──────────────────────────────────┘
```

---

## 3. Exhaustive Semantic Token Specification

### 3.1 Stepped Luminance Canvas & Interactive Tokens

| Semantic Token | Light Mode (Alabaster Silk) | Dark Mode (Obsidian Void) | Architectural & Hardware Role |
| :--- | :--- | :--- | :--- |
| **`--background`** | `hsl(240 20% 99%)` (`#FCFCFD`) | `hsl(240 15% 3.5%)` (`#07070A`) | Base app canvas (cool alabaster in light; deep OLED space void in dark; never flat `#FFFFFF` or flat `#09090B`). |
| **`--foreground`** | `hsl(240 10% 4%)` (`#09090B`) | `hsl(0 0% 98%)` (`#FAFAFA`) | Primary headlines, high-contrast KPI figures, active body copy. |
| **`--card`** | `hsl(0 0% 100%)` (`#FFFFFF`) | `hsl(240 12% 6.5%)` (`#0E0E12`) | Elevated surface containers, metric cards, Bento grid tiles (visibly lifted off `--background`). |
| **`--card-foreground`** | `hsl(240 10% 4%)` (`#09090B`) | `hsl(240 5% 96%)` (`#F4F4F6`) | Primary text inside card surfaces. |
| **`--popover`** | `hsl(0 0% 100% / 0.90)` | `hsl(240 12% 8% / 0.88)` | Glassmorphic dropdowns, command palettes (`⌘K`), date pickers, floating tooltips. |
| **`--popover-foreground`**| `hsl(240 10% 4%)` (`#09090B`) | `hsl(0 0% 98%)` (`#FAFAFA`) | Crisp text inside floating popovers. |
| **`--primary`** | `hsl(252 88% 56%)` (`#5B2BF3`) | `hsl(252 92% 67%)` (`#7C5DFA`) | **Electric Brand Violet** — Primary CTAs, active tabs, selected route indicators. |
| **`--primary-glow`** | `hsl(252 88% 56% / 0.25)` | `hsl(252 92% 67% / 0.35)` | Ambient button drop-glows, active focus halos, interactive ring luminescence. |
| **`--primary-foreground`**| `hsl(0 0% 100%)` (`#FFFFFF`) | `hsl(0 0% 100%)` (`#FFFFFF`) | High-contrast text/icons on primary buttons. |
| **`--secondary`** | `hsl(240 6% 94%)` (`#EEEEF1`) | `hsl(240 8% 12%)` (`#1C1C22`) | Secondary physical keycaps, filter chips, toolbar buttons. |
| **`--secondary-foreground`**| `hsl(252 80% 48%)` (`#4A18D9`) | `hsl(240 5% 92%)` (`#EAEAEF`) | Text inside secondary interactive elements. |
| **`--muted`** | `hsl(240 5% 96%)` (`#F4F4F6`) | `hsl(240 7% 10%)` (`#17171C`) | Recessed wells, table header fills, skeleton loaders, inactive tracks. |
| **`--muted-foreground`** | `hsl(240 4% 44%)` (`#6C6C75`) | `hsl(240 5% 62%)` (`#9898A3`) | Metadata, timestamps, secondary coordinates, vehicle plate sub-labels. |
| **`--accent`** | `hsl(250 60% 96%)` (`#F1EEFC`) | `hsl(252 35% 16%)` (`#211B38`) | Violet-tinted hover highlights on table rows, dropdown items, and command items. |
| **`--accent-foreground`** | `hsl(252 88% 48%)` (`#4D16E6`) | `hsl(252 90% 82%)` (`#C2B2FC`) | Highlighted text and icons on hover/active states. |
| **`--destructive`** | `hsl(350 89% 60%)` (`#F43F5E`) | `hsl(350 85% 62%)` (`#F64C68`) | **Crimson Rose** — Delete actions, SOS alerts, overdue maintenance, tour cancellations. |
| **`--destructive-foreground`**| `hsl(0 0% 98%)` (`#FAFAFA`) | `hsl(0 0% 98%)` (`#FAFAFA`) | Crisp text on destructive buttons and banners. |
| **`--border`** | `hsl(240 6% 90%)` (`#E4E4E7`) | `hsl(240 8% 14%)` (`#202026`) | Structural hairline dividers (`1px solid`). |
| **`--border-specular`** | `rgba(255, 255, 255, 0.85)` | `rgba(255, 255, 255, 0.07)` | Top inner-border sheen (`inset 0 1px 0 0`) on cards, buttons, badges, and modals. |
| **`--input`** | `hsl(240 6% 90%)` (`#E4E4E7`) | `hsl(240 8% 14%)` (`#202026`) | Form control borders (`<input>`, `<select>`, `<textarea>`). |
| **`--ring`** | `hsl(252 88% 56%)` (`#5B2BF3`) | `hsl(252 92% 67%)` (`#7C5DFA`) | Double-offset accessible keyboard focus rings. |
| **`--radius`** | `0.75rem` (`12px`) | `0.75rem` (`12px`) | Base border radius token for cards and controls. |

### 3.2 Unified Sidebar & Navigation Rail Tokens

| Sidebar Token | Light Theme (Frosted Alabaster) | Dark Theme (Obsidian Glass) | Purpose |
| :--- | :--- | :--- | :--- |
| **`--sidebar`** | `hsl(240 15% 97.5% / 0.85)` | `hsl(240 12% 5.5% / 0.75)` | Translucent sidebar surface (`backdrop-blur-xl`). |
| **`--sidebar-foreground`** | `hsl(240 6% 25%)` (`#3C3C43`) | `hsl(240 5% 84%)` (`#D4D4D8`) | Default navigation link text & icon color. |
| **`--sidebar-primary`** | `hsl(252 88% 56%)` (`#5B2BF3`) | `hsl(252 92% 67%)` (`#7C5DFA`) | Active route indicator pill & icon glow (replaces old blue). |
| **`--sidebar-primary-foreground`** | `hsl(0 0% 100%)` (`#FFFFFF`) | `hsl(0 0% 100%)` (`#FFFFFF`) | Active route label contrast. |
| **`--sidebar-accent`** | `hsl(252 50% 95%)` (`#EFEBFD`) | `hsl(240 8% 12% / 0.8)` (`#1C1C22`) | Subtle hover pill background. |
| **`--sidebar-accent-foreground`** | `hsl(252 88% 50%)` (`#511AE6`) | `hsl(0 0% 98%)` (`#FAFAFA`) | Hovered link text color. |
| **`--sidebar-border`** | `hsl(240 6% 90%)` (`#E4E4E7`) | `hsl(240 8% 12%)` (`#1C1C22`) | Right structural border with subtle gradient fade. |
| **`--sidebar-width`** | `16.5rem` (`264px`) | `16.5rem` (`264px`) | Expanded command rail width. |
| **`--sidebar-width-icon`** | `4.25rem` (`68px`) | `4.25rem` (`68px`) | Collapsed icon-only dock width. |

---

## 4. Custom Neo-Skeuomorphic & Glass Utilities

```css
/* 1. Translucent Elevated Specular Surface */
@utility card-specular {
  background-color: color-mix(in srgb, var(--card) 85%, transparent);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  box-shadow:
    0 2px 8px -2px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 0 var(--border-specular);
  transition:
    transform 0.2s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

/* 2. 3D Tactile Keycap Button (Primary) */
@utility btn-tactile-primary {
  background: linear-gradient(180deg, hsl(252 92% 64%) 0%, hsl(250 84% 54%) 100%);
  color: #FFFFFF;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.25),
    0 4px 12px -2px hsl(250 84% 54% / 0.4),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.35),
    inset 0 -2px 0 0 rgba(0, 0, 0, 0.25);
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:active {
    transform: translateY(1px);
    box-shadow:
      0 1px 1px rgba(0, 0, 0, 0.2),
      inset 0 2px 3px 0 rgba(0, 0, 0, 0.35);
  }
}

/* 3. 3D Tactile Keycap Button (Secondary / Ceramic & Carbon) */
@utility btn-tactile-secondary {
  background: var(--btn-secondary-bg);
  border: 1px solid var(--btn-secondary-border);
  box-shadow: var(--btn-secondary-shadow);
  color: var(--foreground);
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:active {
    transform: translateY(1px);
  }
}

/* 4. Recessed Machined Telemetry Inset Well */
@utility surface-recessed {
  background-color: var(--surface-recessed-bg);
  border: 1px solid var(--surface-recessed-border);
  box-shadow: var(--surface-recessed-shadow);
}

/* 5. Embossed Metallic Vehicle Registration Plate */
@utility badge-license-plate {
  background: var(--badge-plate-bg);
  border: 1px solid var(--badge-plate-border);
  box-shadow: var(--badge-plate-shadow);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums slashed-zero;
  letter-spacing: -0.02em;
}

/* 6. Perforated Tour Voucher Container */
@utility ticket-perforated {
  position: relative;
  background-color: color-mix(in srgb, var(--card) 90%, transparent);
  border: 1px solid var(--border);
  box-shadow:
    0 4px 20px -4px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 0 var(--border-specular);
  mask-image: radial-gradient(circle at 0% var(--tear-y, 68%), transparent 10px, black 10.5px),
              radial-gradient(circle at 100% var(--tear-y, 68%), transparent 10px, black 10.5px);
  -webkit-mask-image: radial-gradient(circle at 0% var(--tear-y, 68%), transparent 10px, black 10.5px),
                      radial-gradient(circle at 100% var(--tear-y, 68%), transparent 10px, black 10.5px);
}
```

---

## 5. Signature Domain Components

### 5.1 `<VehiclePlateBadge />`
- Renders Sri Lankan license plates inside `badge-license-plate`.
- Features an embossed province prefix (`WP`, `SP`, `CP`), monospaced plate characters, and a **3D Domed Hardware Status LED** with off-center specular glint and neon bloom:
  - `active`: Emerald Neon (`#10B981`)
  - `on-tour`: Amber Pulse (`#F59E0B`)
  - `maintenance`: Crimson Rose Alert (`#F43F5E`)
  - `scheduled`: Electric Indigo Standby (`#6366F1`)

### 5.2 `<TelemetryReadout />`
- Uses `surface-recessed` to construct machined LCD digital instrument wells.
- Displays micro uppercase instrument labels, tabular numbers, measurement units (`km`, `LKR`, `hrs`), and trend indicators.

### 5.3 `<TourBoardingPassCard />`
- Tactile airline-style perforated boarding voucher for tours and chauffeur allocations.
- Features dual punch-out notches on tear-lines, itinerary routing, lead passenger info, chauffeur contacts, assigned vehicle plate badge, and LKR fare breakdowns.

### 5.4 `<ThemeSwitcher />`
- Tactile physical keycap toggle housed in `btn-tactile-secondary`.
- Powered by `document.startViewTransition` with spring-physics animated `Sun` and `Moon` icons.

---

## 6. Typography & Telemetry Precision Rules

- **Display & Brand Headers**: `Montserrat` / `Plus Jakarta Sans` (`font-black` / `font-extrabold`, tight tracking `-0.03em`).
- **Body & UI Controls**: `Inter` with optical sizing and font feature flags (`cv02`, `cv03`, `cv04`, `cv11`).
- **Telemetry, Currency & Numbers**: `JetBrains Mono` with strict `font-mono tabular-nums tracking-tight` for all prices (`LKR`), odometer readings (`km`), booking IDs (`#VGL-2026-894`), and vehicle plates.
- **Micro Instrument Labels**: `text-[0.65rem] font-bold tracking-[0.14em] uppercase text-muted-foreground`.

---

## 7. Platform Constraints (Mobile Notch & Print Fidelity)

- **Mobile Notch & Safe Areas:** Preserves `.pt-notch-safe` and `.top-notch-safe` ensuring edge-to-edge layouts on iPhones and modern Android devices (`max(env(safe-area-inset-top, 0px), 1.25rem)` on mobile; `0` on desktop).
- **Print Theme Engine:** All skeuomorphic shadows, masks, and dark backgrounds cleanly strip to pure `#FFFFFF` paper and `#000000` text during printing (`@page { size: A4; }`, `@page thermal { size: 58mm auto; }`).

---
*VIGIL Design System v2.0 — Tactile Cockpit & Atmospheric Glass Edition.*
