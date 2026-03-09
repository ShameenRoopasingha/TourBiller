# TourBiller 🚐

A modern vehicle hire billing and tour management system built with Next.js 16, Prisma, and PostgreSQL.

## Features

- **📋 Bill Management** — Create, view, print, and delete vehicle hire invoices
- **📅 Booking System** — Manage vehicle reservations with status tracking (Confirmed → Ongoing → Completed)
- **🗺️ Tour Schedules** — Create multi-day tour itineraries with per-day cost breakdowns
- **📝 Quotation Generator** — Auto-generate quotations from tour schedules
- **👥 Customer & Vehicle Management** — Full CRUD for customers and fleet vehicles
- **👤 User Management** — Role-based access control (Admin / Driver)
- **🖨️ Thermal Printing** — 58mm thermal receipt support via Web Bluetooth (ESC/POS)
- **📱 Responsive** — Mobile-first design with Shadcn UI sidebar
- **🔒 Security Hardened** — Rate limiting, security headers, input validation, auth guards

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Server Actions) |
| Language | TypeScript |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | NextAuth.js v5 (JWT, Credentials) |
| UI | Shadcn UI, Tailwind CSS 4, Radix UI |
| Validation | Zod |
| Animation | Framer Motion |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or [Supabase](https://supabase.com) free tier)

### 1. Clone & Install

```bash
git clone https://github.com/ShameenRoopasingha/TourBiller.git
cd TourBiller
npm install
```

### 2. Environment Variables

Copy the example and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://user:password@host:5432/database"
AUTH_SECRET="run: npx auth secret"
```

### 3. Set Up Database

```bash
# Push schema to database
npx prisma db push

# (Optional) Seed with sample data
npx prisma db seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Login

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@tourbiller.com` | `admin123` |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── bills/              # Bill CRUD + print view
│   ├── bookings/           # Booking management
│   ├── customers/          # Customer CRUD
│   ├── vehicles/           # Vehicle fleet management
│   ├── tour-schedules/     # Tour itinerary builder
│   ├── quotations/         # Quotation generator
│   ├── users/              # User management (admin)
│   ├── settings/           # Profile + business settings
│   ├── login/              # Authentication
│   ├── forgot-password/    # Password reset request
│   └── reset-password/     # Password reset form
├── components/             # Reusable UI components
├── lib/                    # Server actions & utilities
│   ├── actions.ts          # Bill CRUD actions
│   ├── auth.ts             # NextAuth config
│   ├── auth-guard.ts       # Role-based auth helpers
│   ├── rate-limit.ts       # Brute-force protection
│   ├── validations.ts      # Zod schemas
│   ├── prisma.ts           # Prisma singleton
│   └── *-actions.ts        # Domain-specific actions
└── hooks/                  # Custom React hooks
```

## Security

| Protection | Implementation |
|-----------|---------------|
| Authentication | NextAuth.js JWT with bcrypt password hashing |
| Authorization | `requireAdmin()` / `requireAuth()` guards on all server actions |
| Rate Limiting | Login (10/15min), password reset (5/15min) |
| Input Validation | Zod schemas on all form submissions |
| CSRF | Built-in Next.js server action CSRF tokens |
| Security Headers | X-Frame-Options, HSTS, CSP, X-Content-Type-Options |
| SQL Injection | Prisma parameterized queries (no raw SQL) |

## Scripts

```bash
npm run dev       # Development server
npm run build     # Production build
npm run start     # Production server
npm run lint      # ESLint
npx prisma studio # Database GUI
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repo to [Vercel](https://vercel.com)
3. Set environment variables in Vercel dashboard
4. Deploy — Prisma generates on `postinstall` automatically

### Environment Variables for Production

```env
DATABASE_URL="your-production-database-url"
AUTH_SECRET="your-secret-key"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

## License

Private — All rights reserved.
