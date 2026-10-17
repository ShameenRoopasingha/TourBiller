# VIGIL Design System & Theme Engine (v2.0 — Ultra-Modern Edition)

> Architecture, token reference, and implementation blueprints for the **VIGIL Tour & Fleet Management Platform**.  
> Built with **Next.js 16 (App Router)**, **Tailwind CSS v4 (`@theme inline`)**, and **`next-themes`**.

---

## 1. Executive Directive & Design Philosophy

The VIGIL v2.0 design system delivers a **high-craft, futuristic command-center aesthetic** engineered for real-time fleet telematics, high-density vehicle hire ledgers, and live tour logistics.

### Foundational Pillars

1. **Perceptually Uniform Color Science:** OKLCH and HSL semantic CSS variables connected directly into Tailwind CSS v4's `@theme inline` engine.
2. **Stepped Luminance Hierarchy:** Distinct canvas vs. elevated surface separation in both **Alabaster Silk** (`:root`) and **Obsidian Void** (`.dark`)—never flat `#FFFFFF` on `#FFFFFF` or `#09090B` on `#09090B`.
3. **Tactile Surface Physics (Anodized Glass & Specular Lighting):** `1px` top-edge inner specular highlights (`inset 0 1px 0 0 var(--border-specular)`) simulating overhead studio lighting on precision-milled glass and anodized aluminum, replacing muddy drop shadows.
4. **Atmospheric Depth:** Multi-layered ambient aurora mesh gradients, radial architectural dot grids, and SVG micro-noise textures (`feTurbulence`) to eliminate gradient banding on OLED/Mini-LED displays.
5. **High-Density Telemetry Precision:** Strict `tabular-nums` and `slashed-zero` monospace typography for Sri Lankan Rupee (`LKR / Rs.`) financial ledgers, odometer metrics (`km`), booking references (`#VGL-2026-894`), live GPS coordinates, and vehicle plates (`WP CAB-4582`).
6. **Spring-Physics Micro-Interactions & View Transitions:** Hardware-accelerated transitions (`cubic-bezier(0.22, 1, 0.36, 1)`) and native browser `document.startViewTransition` theme switching.

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
                         │ • Specular 1px Inner Highlights  │
                         │ • Backdrop Blur + Noise Overlay  │
                         │ • Spring-Physics Transitions     │
                         └──────────────────────────────────┘
```

---

## 3. Exhaustive Semantic Token Specification

### 3.1 Core Canvas, Surface & Interactive Tokens

| Semantic Token | Light Mode (Alabaster & Crisp Slate) | Dark Mode (Obsidian & Carbon Glass) | Usage & Architectural Visual Role |
| :--- | :--- | :--- | :--- |
| **`--background`** | `hsl(240 20% 99%)` (`#FCFCFD`) | `hsl(240 15% 3.5%)` (`#07070A`) | Base app canvas (subtle cool alabaster in light; deep OLED void in dark). |
| **`--foreground`** | `hsl(240 10% 4%)` (`#09090B`) | `hsl(0 0% 98%)` (`#FAFAFA`) | Primary headlines, high-contrast KPI figures, active body copy. |
| **`--card`** | `hsl(0 0% 100%)` (`#FFFFFF`) | `hsl(240 12% 6.5%)` (`#0E0E12`) | Elevated surface containers, metric cards, Bento grid tiles (lifted off `--background`). |
| **`--card-foreground`** | `hsl(240 10% 4%)` (`#09090B`) | `hsl(240 5% 96%)` (`#F4F4F6`) | Primary text inside card surfaces. |
| **`--popover`** | `hsl(0 0% 100% / 0.88)` (`#FFFFFFE0`) | `hsl(240 12% 8% / 0.85)` (`#121217D9`) | Glassmorphic dropdowns, command palette (`⌘K`), date pickers, floating tooltips. |
| **`--popover-foreground`**| `hsl(240 10% 4%)` (`#09090B`) | `hsl(0 0% 98%)` (`#FAFAFA`) | Crisp text inside floating popovers. |
| **`--primary`** | `hsl(252 88% 56%)` (`#5B2BF3`) | `hsl(252 92% 67%)` (`#7C5DFA`) | **Electric Brand Violet** — Primary CTAs, active tabs, selected route pills, key chart series. |
| **`--primary-glow`** | `hsl(252 88% 56% / 0.25)` | `hsl(252 92% 67% / 0.35)` | Ambient button drop-glows, active focus halos, interactive ring luminescence. |
| **`--primary-foreground`**| `hsl(0 0% 100%)` (`#FFFFFF`) | `hsl(0 0% 100%)` (`#FFFFFF`) | High-contrast text/icons on primary buttons. |
| **`--secondary`** | `hsl(240 6% 94%)` (`#EEEEF1`) | `hsl(240 8% 12%)` (`#1C1C22`) | Secondary pill actions, filter chips, toolbar buttons. |
| **`--secondary-foreground`**| `hsl(252 80% 48%)` (`#4A18D9`) | `hsl(240 5% 92%)` (`#EAEAEF`) | Text inside secondary interactive elements. |
| **`--muted`** | `hsl(240 5% 96%)` (`#F4F4F6`) | `hsl(240 7% 10%)` (`#17171C`) | Recessed wells, table header fills, skeleton loaders, inactive tab tracks. |
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
| **`--sidebar-primary`** | `hsl(252 88% 56%)` (`#5B2BF3`) | `hsl(252 92% 67%)` (`#7C5DFA`) | Active route indicator pill & icon glow. |
| **`--sidebar-primary-foreground`** | `hsl(0 0% 100%)` (`#FFFFFF`) | `hsl(0 0% 100%)` (`#FFFFFF`) | Active route label contrast. |
| **`--sidebar-accent`** | `hsl(252 50% 95%)` (`#EFEBFD`) | `hsl(240 8% 12% / 0.8)` (`#1C1C22`) | Subtle hover pill background. |
| **`--sidebar-accent-foreground`** | `hsl(252 88% 50%)` (`#511AE6`) | `hsl(0 0% 98%)` (`#FAFAFA`) | Hovered link text color. |
| **`--sidebar-border`** | `hsl(240 6% 90%)` (`#E4E4E7`) | `hsl(240 8% 12%)` (`#1C1C22`) | Right structural border with subtle gradient fade. |
| **`--sidebar-width`** | `16.5rem` (`264px`) | `16.5rem` (`264px`) | Expanded command rail width. |
| **`--sidebar-width-icon`** | `4.25rem` (`68px`) | `4.25rem` (`68px`) | Collapsed icon-only dock width. |

---

## 4. Telemetry Status, Badges & Live Radar Tokens

Fleet tables, driver rosters, tour timelines, and live GPS dispatch maps must use these exact neon-glass telemetry badge recipes for instant visual parsing:

```
  ACTIVE / AVAILABLE        ON TOUR / IN PROGRESS       MAINTENANCE / SOS          SCHEDULED / STANDBY
┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
│ Emerald Neon         │   │ Amber Pulse          │   │ Rose Alert           │   │ Electric Indigo      │
│ Light: #065F46       │   │ Light: #92400E       │   │ Light: #9F1239       │   │ Light: #3730A3       │
│ Dark:  #6EE7B7       │   │ Dark:  #FCD34D       │   │ Dark:  #FDA4AF       │   │ Dark:  #A5B4FC       │
│ Dot:   #10B981 pulse │   │ Dot:   #FBBF24       │   │ Dot:   #F43F5E       │   │ Dot:   #818CF8       │
└──────────────────────┘   └──────────────────────┘   └──────────────────────┘   └──────────────────────┘
```

1. **ACTIVE / AVAILABLE / DISPATCHED (Emerald Neon)**
   - **Light Classes:** `bg-emerald-500/10 text-emerald-800 border-emerald-500/25`
   - **Dark Classes:** `dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-400/20 dark:shadow-[inset_0_1px_0_0_rgba(52,211,153,0.15)]`
   - **Live Indicator Dot:** `h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981] animate-pulse`

2. **ON TOUR / IN PROGRESS / EN ROUTE (Amber Pulse)**
   - **Light Classes:** `bg-amber-500/10 text-amber-800 border-amber-500/25`
   - **Dark Classes:** `dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-400/20 dark:shadow-[inset_0_1px_0_0_rgba(251,191,36,0.15)]`
   - **Live Indicator Dot:** `h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#FBBF24]`

3. **MAINTENANCE / OVERDUE / SOS ALERT (Rose Alert)**
   - **Light Classes:** `bg-rose-500/10 text-rose-800 border-rose-500/25`
   - **Dark Classes:** `dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-400/20 dark:shadow-[inset_0_1px_0_0_rgba(251,113,133,0.15)]`
   - **Live Indicator Dot:** `h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_#F43F5E]`

4. **SCHEDULED / QUOTED / STANDBY (Electric Indigo)**
   - **Light Classes:** `bg-indigo-500/10 text-indigo-800 border-indigo-500/25`
   - **Dark Classes:** `dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-400/20 dark:shadow-[inset_0_1px_0_0_rgba(129,140,248,0.15)]`
   - **Live Indicator Dot:** `h-1.5 w-1.5 rounded-full bg-indigo-400`

5. **RADAR LIVE BEACON (GPS Map Marker & Dispatch Header)**
   - **Light Classes:** `bg-emerald-600 text-white shadow-[0_0_16px_rgba(16,185,129,0.5)]`
   - **Dark Classes:** `dark:bg-emerald-400 dark:text-zinc-950 font-bold dark:shadow-[0_0_24px_rgba(52,211,153,0.7)]`
   - **Outer Ring Pulse:** `ring-4 ring-emerald-500/30 animate-ping`

---

## 5. Typography & Scannable Hierarchy Rules

```
Display & Brand:
  Plus Jakarta Sans (weights: 600, 700, 800)
  Tracking: -0.03em (tight editorial lockup)

Interface & Body:
  Inter
  Features: font-feature-settings: "cv02", "cv03", "cv04", "cv11"; optical-sizing: auto;

Telemetry & Financials:
  JetBrains Mono
  Features: font-variant-numeric: tabular-nums slashed-zero;
```

### Telemetry Scannability Rules
Every currency value (`LKR 145,200.00` / `Rs.`), odometer reading (`48,920 km`), fuel consumption figure, booking ID (`#VGL-2026-894`), GPS lat/lng coordinate, and vehicle registration plate (`WP CAB-4582`) **MUST** apply `font-mono tabular-nums tracking-tight` (or `@utility telemetry-plate`).

---

## 6. 5-Tier Surface Elevation Hierarchy

- **Level 0 — App Canvas:**
  `bg-background text-foreground selection:bg-primary/20 selection:text-primary`
- **Level 1 — Recessed Wells, Kanban Tracks & Filter Trays:**
  `bg-muted/50 dark:bg-zinc-950/60 border border-border/40 shadow-inner rounded-xl`
- **Level 2 — Interactive Bento Cards, KPI Tiles & Data Tables (`card-luxury`):**
  `bg-card/85 backdrop-blur-md border border-border/70 shadow-[0_1px_2px_rgba(0,0,0,0.03),inset_0_1px_0_0_var(--border-specular)] hover:border-primary/30 transition-all duration-200 rounded-xl`
- **Level 3 — Sticky Topbar, Navigation Rail & Floating Action Bars:**
  `bg-background/75 backdrop-blur-xl border-b border-border/60 supports-[backdrop-filter]:bg-background/60 shadow-[inset_0_-1px_0_0_var(--border-specular)]`
- **Level 4 — Command Palette (`⌘K`), Modals, Drawers & Popovers:**
  `bg-popover backdrop-blur-2xl border border-white/15 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.12)] ring-1 ring-black/5 dark:ring-white/10 rounded-2xl`

---

## 7. High-Fidelity Print Themes

```css
@media print {
  @page {
    size: A4;
    margin: 0;
  }
  @page thermal {
    size: 58mm auto;
    margin: 0;
  }
  body {
    background-color: #FFFFFF !important;
    color: #000000 !important;
  }
  .print-a4-wrapper {
    width: 21cm !important;
    padding: 1cm !important;
    margin: 0 auto !important;
  }
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
```

---
*VIGIL Design System v2.0 — Ultra-Modern Edition.*
