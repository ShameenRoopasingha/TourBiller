# VIGIL Design System & Theme Specification

> Comprehensive Light & Dark Theme Guide for Vigil Tour Management Platform.  
> Built with **Next.js 16 (App Router)**, **Tailwind CSS v4**, and **`next-themes`**.

---

## 1. Theme Architecture & Implementation

Vigil employs a dynamic CSS Variable token system integrated directly into Tailwind CSS v4 using the modern `@theme` directive and `@custom-variant dark (&:is(.dark *))`.

```
                    ┌────────────────────────────┐
                    │       next-themes          │
                    │ (class-based, system-aware)│
                    └─────────────┬──────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │     <html> class attribute │
                    │     ( 'light'  or  'dark' ) │
                    └─────────────┬──────────────┘
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
┌──────────────────┐                             ┌──────────────────┐
│   :root Tokens   │                             │   .dark Tokens   │
│   (Light Mode)   │                             │   (Dark Mode)    │
└────────┬─────────┘                             └────────┬─────────┘
         │                                                │
         └────────────────────────┬───────────────────────┘
                                  ▼
                    ┌───────────────────────────┐
                    │    Tailwind CSS v4        │
                    │ @theme & Utility Classes  │
                    └───────────────────────────┘
```

- **Theme Provider**: `next-themes` wraps the entire app in `src/app/layout.tsx`.
- **Hydration Safe**: `suppressHydrationWarning` on `<html>` and `<body>`.
- **System Synchronization**: Automatically respects user OS preference while allowing instant manual toggle.
- **Persistence**: Saved across sessions in `localStorage` under theme settings.

---

## 2. Core Color Tokens (Side-by-Side Comparison)

| Semantic Token | Light Mode (CSS / Hex) | Dark Mode (CSS / Hex) | Usage Description |
| :--- | :--- | :--- | :--- |
| **`--background`** | `hsl(0 0% 100%)` <br>`#FFFFFF` | `hsl(240 10% 3.9%)` <br>`#09090B` | Main application canvas background |
| **`--foreground`** | `hsl(240 10% 3.9%)` <br>`#09090B` | `hsl(0 0% 98%)` <br>`#FAFAFA` | High-contrast body text & titles |
| **`--card`** | `hsl(0 0% 100%)` <br>`#FFFFFF` | `hsl(240 10% 3.9%)` <br>`#09090B` | Card surfaces, modals, data containers |
| **`--card-foreground`** | `hsl(240 10% 3.9%)` <br>`#09090B` | `hsl(0 0% 98%)` <br>`#FAFAFA` | Primary text rendered within cards |
| **`--popover`** | `hsl(0 0% 100%)` <br>`#FFFFFF` | `hsl(240 10% 3.9%)` <br>`#09090B` | Dropdown menus, tooltips, popovers |
| **`--popover-foreground`**| `hsl(240 10% 3.9%)` <br>`#09090B` | `hsl(0 0% 98%)` <br>`#FAFAFA` | Text inside popover elements |
| **`--primary`** | `hsl(250 84% 54%)` <br>`#5326EC` | `hsl(250 84% 65%)` <br>`#7A52F4` | Brand Violet, active navigation, CTAs |
| **`--primary-foreground`**| `hsl(0 0% 98%)` <br>`#FAFAFA` | `hsl(0 0% 98%)` <br>`#FAFAFA` | Text/icons rendered on primary buttons |
| **`--secondary`** | `hsl(240 4.8% 95.9%)` <br>`#F4F4F5` | `hsl(240 3.7% 15.9%)` <br>`#27272A` | Sub-actions, badges, secondary pills |
| **`--secondary-foreground`**| `hsl(250 84% 54%)` <br>`#5326EC` | `hsl(0 0% 98%)` <br>`#FAFAFA` | Text on secondary elements |
| **`--muted`** | `hsl(240 4.8% 95.9%)` <br>`#F4F4F5` | `hsl(240 3.7% 15.9%)` <br>`#27272A` | Subtle surfaces, hovered rows, tabs |
| **`--muted-foreground`** | `hsl(240 3.8% 46.1%)` <br>`#71717A` | `hsl(240 5% 64.9%)` <br>`#A1A1AA` | Captions, secondary labels, placeholders |
| **`--accent`** | `hsl(240 4.8% 95.9%)` <br>`#F4F4F5` | `hsl(240 3.7% 15.9%)` <br>`#27272A` | Interactive hover highlights |
| **`--accent-foreground`** | `hsl(240 5.9% 10%)` <br>`#18181B` | `hsl(0 0% 98%)` <br>`#FAFAFA` | Text on hovered/active accents |
| **`--destructive`** | `hsl(0 84.2% 60.2%)` <br>`#EF4444` | `hsl(0 62.8% 30.6%)` <br>`#7F1D1D` | Delete actions, errors, cancel badges |
| **`--destructive-foreground`**| `hsl(0 0% 98%)` <br>`#FAFAFA` | `hsl(0 0% 98%)` <br>`#FAFAFA` | Text on destructive buttons |
| **`--border`** | `hsl(240 5.9% 90%)` <br>`#E4E4E7` | `hsl(240 3.7% 15.9%)` <br>`#27272A` | Card dividers, table borders, inputs |
| **`--input`** | `hsl(240 5.9% 90%)` <br>`#E4E4E7` | `hsl(240 3.7% 15.9%)` <br>`#27272A` | Form field borders and backgrounds |
| **`--ring`** | `hsl(250 84% 54%)` <br>`#5326EC` | `hsl(250 84% 65%)` <br>`#7A52F4` | Focus rings for accessible navigation |

---

## 3. Sidebar Color Tokens

The sidebar features distinct elevation and transparency to integrate seamlessly with the desktop background aurora glows.

| Token | Light Theme | Dark Theme | Purpose |
| :--- | :--- | :--- | :--- |
| **`--sidebar`** | `hsl(0 0% 98%)` (`#FAFAFA`) | `hsl(240 5.9% 10%)` (`#18181B`) | Sidebar background base |
| **`--sidebar-foreground`** | `hsl(240 5.3% 26.1%)` (`#3F3F46`) | `hsl(240 4.8% 95.9%)` (`#F4F4F5`) | Nav item labels & icons |
| **`--sidebar-primary`** | `hsl(240 5.9% 10%)` (`#18181B`) | `hsl(224.3 76.3% 48%)` (`#1D4ED8`) | Selected menu highlights |
| **`--sidebar-primary-foreground`** | `hsl(0 0% 98%)` (`#FAFAFA`) | `hsl(0 0% 100%)` (`#FFFFFF`) | Text on selected sidebar item |
| **`--sidebar-accent`** | `hsl(240 4.8% 95.9%)` (`#F4F4F5`) | `hsl(240 3.7% 15.9%)` (`#27272A`) | Hover background on nav links |
| **`--sidebar-accent-foreground`** | `hsl(240 5.9% 10%)` (`#18181B`) | `hsl(240 4.8% 95.9%)` (`#F4F4F5`) | Text when hovering nav links |
| **`--sidebar-border`** | `hsl(220 13% 91%)` (`#E2E8F0`) | `hsl(240 3.7% 15.9%)` (`#27272A`) | Sidebar right border & rail |
| **`--sidebar-ring`** | `hsl(217.2 91.2% 59.8%)` (`#38BDF8`)| `hsl(217.2 91.2% 59.8%)` (`#38BDF8`)| Keyboard focus outline |
| **`--sidebar-width`** | `16rem` (`256px`) | `16rem` (`256px`) | Full expanded sidebar width |
| **`--sidebar-width-icon`** | `4rem` (`64px`) | `4rem` (`64px`) | Collapsed icon-only rail width |

---

## 4. Status, Badge & Radar Color Tokens

Vigil uses universally recognized status colors with tailored light and dark contrast tiers.

```
  ACTIVE / SUCCESS          PENDING / WARNING          CANCELLED / DANGER         INFO / RADAR
┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐
│ Light: #059669     │     │ Light: #D97706     │     │ Light: #DC2626     │     │ Light: #0284C7     │
│ Dark:  #10B981     │     │ Dark:  #FBBF24     │     │ Dark:  #F87171     │     │ Dark:  #38BDF8     │
│ Bg:    emerald-500/15    │ Bg:    amber-500/15 │     │ Bg:    rose-500/15  │     │ Bg:    cyan-500/15 │
└────────────────────┘     └────────────────────┘     └────────────────────┘     └────────────────────┘
```

### Detailed Status Mapping

| Status | Badge Light Mode | Badge Dark Mode | Dot Indicator |
| :--- | :--- | :--- | :--- |
| **ACTIVE / COMPLETED / AVAILABLE** | `bg-emerald-50 text-emerald-700 border-emerald-200` | `bg-emerald-950/40 text-emerald-400 border-emerald-800/60` | `bg-emerald-500 animate-pulse` |
| **PENDING / ON TOUR / IN PROGRESS**| `bg-amber-50 text-amber-700 border-amber-200` | `bg-amber-950/40 text-amber-400 border-amber-800/60` | `bg-amber-500` |
| **CANCELLED / MAINTENANCE / OVERDUE**| `bg-rose-50 text-rose-700 border-rose-200` | `bg-rose-950/40 text-rose-400 border-rose-800/60` | `bg-rose-500` |
| **DRAFT / SCHEDULED / QUOTED** | `bg-indigo-50 text-indigo-700 border-indigo-200` | `bg-indigo-950/40 text-indigo-400 border-indigo-800/60` | `bg-indigo-500` |
| **RADAR LIVE BEACON** | `bg-emerald-500 text-white shadow-[0_0_12px_#10B981]` | `bg-emerald-400 text-slate-950 shadow-[0_0_20px_#10B981]` | `ring-4 ring-emerald-500/30` |

---

## 5. Typography & Font Stacks

```
Headline Font (Brand, Headers):
  Montserrat (weights: 700 bold, 900 black)
  Font Stack: Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif

Body & Interface Font:
  Inter (subsets: latin, optical-sizing: auto)
  Font Stack: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
```

- **Headlines & Logos**: Bold, geometric modern look (`font-black tracking-tight`).
- **Data Tables & Numerical Values**: Tabular numerals enabled (`tabular-nums`) for currency (Rs.), dates, and vehicle numbers.
- **Micro Labels**: Uppercase with wide tracking (`text-[0.65rem] font-bold tracking-wider uppercase`).

---

## 6. Glassmorphism, Aurora & Elevation

### Aurora Atmosphere Elements
The global layout mounts three fixed ambient blur spheres that adapt to the active theme:

```tsx
<div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
  {/* Sphere 1: Primary Brand Violet Glow */}
  <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]" />
  {/* Sphere 2: Ocean Blue Accent */}
  <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
  {/* Sphere 3: Deep Purple Radiance */}
  <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-purple-500/10 blur-[120px]" />
</div>
```

### Surface Elevation Levels

1. **Level 0 (Canvas)**: `bg-background` (`#FFFFFF` in Light, `#09090B` in Dark).
2. **Level 1 (Frosted Main Panels)**: `bg-background/40 backdrop-blur-[2px]`.
3. **Level 2 (Cards & Data Tables)**: `bg-card border border-border/60 shadow-xs`.
4. **Level 3 (Sticky Headers & Topbars)**: `bg-background/80 backdrop-blur-md border-b border-border/50`.
5. **Level 4 (Floating Dialogs, Modals, Tooltips)**: `bg-card border shadow-2xl z-50`.

---

## 7. Responsive Top Notch & Safe Area Handling

For mobile devices with top camera notches and status bars:

- **Mobile (`<= 767px`)**:
  - `.pt-notch-safe`: `padding-top: max(env(safe-area-inset-top, 0px), 1.25rem);`
  - `.top-notch-safe`: `top: max(env(safe-area-inset-top, 0px), 1.25rem);`
- **Desktop (`>= 768px`)**:
  - `.pt-notch-safe`: `padding-top: 0 !important;` (removes unwanted desktop top gap)
  - `.top-notch-safe`: `top: 0.75rem !important;`

---

## 8. High-Fidelity Print Themes

Vigil overrides color themes during printing to produce crisp, ink-efficient documents for client invoicing and receipts:

```css
@media print {
  /* Enforces exact A4 dimensions */
  @page {
    size: A4;
    margin: 0;
  }
  
  /* Thermal Printer Receipt mode (58mm continuous) */
  @page thermal {
    size: 58mm auto;
    margin: 0;
  }
  
  /* Strip background colors & glow elements */
  body {
    background-color: #FFFFFF !important;
    color: #000000 !important;
  }
  
  .print-a4-wrapper {
    width: 21cm !important;
    padding: 1cm !important;
    margin: 0 auto !important;
  }

  /* Force background colors to print precisely in Chrome & Edge */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
```

---

## 9. Developer Usage Guide

### Toggle Theme in Any Component

```tsx
'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export function ThemeSwitcher() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
      aria-label="Toggle theme"
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-5 w-5 text-amber-400" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700" />
      )}
    </button>
  );
}
```

### Writing Theme-Aware Tailwind Classes

Always favor semantic tokens over hardcoded grays:

```tsx
// ✅ Recommended (Adapts cleanly to both Light & Dark modes)
<div className="bg-card text-card-foreground border border-border/60 hover:bg-accent hover:text-accent-foreground" />

// ❌ Avoid (Breaks when switching themes)
<div className="bg-white text-black border-gray-200" />
```

---
*Created for the **Vigil Tour Management Platform** design and development team.*
