# Freelancer Finance Cockpit

A production-ready MVP financial management dashboard for Swiss freelancers. Track income, expenses, estimate taxes, forecast cashflow, and calculate your financial runway.

![Stack](https://img.shields.io/badge/Next.js_16-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?logo=tailwindcss&logoColor=white) ![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma_7-2D3748?logo=prisma)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │Dashboard │ │ Income   │ │ Expenses │ │ Forecast │   │
│  │(Charts,  │ │(CRUD +   │ │(CRUD +   │ │(Recurring│   │
│  │ KPIs,    │ │ Filters) │ │ Filters) │ │ Editor + │   │
│  │ Scenario)│ │          │ │          │ │ Projections)  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
├─────────────────────────────────────────────────────────┤
│                  Next.js App Router                      │
│         Server Components + Server Actions               │
│  ┌──────────────────────────────────────────────────┐   │
│  │             Forecast Engine (pure TS)              │   │
│  │  buildForecast() → MonthProjection[]              │   │
│  │  buildScenarios() → base/conservative/optimistic  │   │
│  │  autoForecastFromHistory() → suggestions          │   │
│  └──────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  Prisma 7 ORM → SQLite (better-sqlite3 adapter)        │
│  Tables: IncomeEntry, ExpenseEntry, RecurringItem,      │
│          Settings                                        │
└─────────────────────────────────────────────────────────┘
```

**Data flow:**
1. Server Components fetch data via Prisma
2. Forecast engine computes projections server-side
3. Serialized data is passed to Client Components
4. Client Components handle interactivity (scenario toggle, charts, modals)
5. Server Actions handle mutations (create/update/delete) with Zod validation
6. `revalidatePath()` refreshes affected pages after mutations

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Setup & Run

```bash
# 1. Install dependencies
npm install

# 2. Run database migration + seed demo data
npm run setup

# 3. Start development server
npm run dev
```

Open **http://localhost:3000** — you'll see the dashboard with demo data.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run test` | Run forecast engine unit tests |
| `npm run setup` | Migrate DB + seed demo data |
| `npm run db:seed` | Re-seed demo data only |
| `npm run db:reset` | Reset DB + re-seed |

---

## Features

### A) Income Tracking
- Full CRUD (add, edit, delete) with modal forms
- Fields: date, client, description, category, amount (CHF), VAT flag
- Filters: month, category, text search
- Monthly totals displayed

### B) Expense Tracking
- Full CRUD with same UX as income
- Fields: date, vendor, description, category, amount (CHF), deductible flag
- Filters and monthly totals

### C) Tax Estimation (Simplified)
- User-configurable effective tax rate (combining income tax, AHV/IV/EO)
- Optional Pillar 3a / deduction inputs
- Dashboard displays:
  - Current month tax estimate
  - YTD tax estimate
  - Projected year-end estimate
- **Clear disclaimer** that this is a simplified estimate, not tax advice

### D) Cashflow Dashboard (Core Feature)
- **KPI Cards:** Cash balance, monthly income/expenses, tax reserve
- **Forecasted Cash Balance Curve:** Line chart with buffer warning line
- **Monthly Cashflow Bars:** Income vs expenses vs net per month
- **Runway Indicator:** Big number + color-coded warning states
- **Tax Estimates Card:** YTD + projected year-end
- **YTD Summary:** Income, expenses, net profit, after-tax

### E) Runway Calculation
- Months until cash balance drops below configurable buffer
- Color-coded: green (>6mo), amber (3-6mo), red (<3mo)
- Three scenarios: base (1.0×), conservative (0.8×), optimistic (1.2×)

### F) Forecasting
- Recurring items editor (income + expense, monthly/quarterly/yearly)
- Month-by-month projection table for full horizon
- Auto-forecast from history: if 3+ months of data exist, suggests recurring items from trailing averages
- Full projection chart with scenario toggle

---

## Data Model

```prisma
model IncomeEntry {
  id, date, client?, description, category, amount,
  currency (CHF), vatIncluded?
}

model ExpenseEntry {
  id, date, vendor?, description, category, amount,
  currency (CHF), deductible?
}

model RecurringItem {
  id, type (income|expense), name, amount,
  cadence (monthly|quarterly|yearly), startDate, endDate?, category?
}

model Settings {
  startingCash, minCashBuffer, horizonMonths,
  effectiveTaxRate, taxDeductions, taxReservePercent,
  taxPaymentSchedule (monthly|quarterly), currency
}
```

---

## Forecast Algorithm

Documented in `src/lib/forecast-engine.ts`:

```
For each month from now to now + horizonMonths:
  projectedIncome   = Σ(active recurring income) × incomeMultiplier
  projectedExpenses = Σ(active recurring expenses)
  projectedProfit   = projectedIncome − projectedExpenses
  taxReserve        = max(0, projectedProfit) × effectiveTaxRate
  netCashflow       = projectedIncome − projectedExpenses − taxReserve
  endingCash        = previousEndingCash + netCashflow

Runway = first month where endingCash < minCashBuffer (-1 if never)
Scenarios = { base: 1.0×, conservative: 0.8×, optimistic: 1.2× } income
```

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with sidebar + Toaster
│   ├── page.tsx            # Redirects to /dashboard
│   ├── dashboard/page.tsx  # Server component: fetches data, builds scenarios
│   ├── income/             # page.tsx (server) + client.tsx (client)
│   ├── expenses/           # page.tsx (server) + client.tsx (client)
│   ├── forecast/           # page.tsx (server) + client.tsx (client)
│   └── settings/           # page.tsx (server) + client.tsx (client)
├── components/
│   ├── ui/                 # Button, Card, Dialog, Input, Label, Select, etc.
│   ├── layout/             # Sidebar, MobileNav, AppShell
│   ├── dashboard/          # KpiCard, CashflowChart, MonthlyBarChart, etc.
│   ├── entries/            # EntryTable, EntryFormModal, FilterBar
│   └── forecast/           # (Integrated into forecast/client.tsx)
├── lib/
│   ├── db.ts               # Prisma client singleton
│   ├── forecast-engine.ts  # Core forecast/runway logic
│   ├── format.ts           # CHF currency formatting
│   ├── validations.ts      # Zod schemas
│   ├── utils.ts            # cn() utility
│   └── actions/            # Server actions for CRUD
│       ├── income.ts
│       ├── expenses.ts
│       ├── recurring.ts
│       └── settings.ts
└── types/index.ts          # TypeScript type definitions

__tests__/
└── forecast-engine.test.ts # 18 unit tests for forecast logic

prisma/
├── schema.prisma           # Data model
├── seed.ts                 # Demo data script
└── migrations/             # Auto-generated migrations
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| UI Components | Custom (Radix UI primitives + CVA) |
| Charts | Recharts 3 |
| Database | SQLite via better-sqlite3 |
| ORM | Prisma 7 |
| Validation | Zod 4 |
| Icons | Lucide React |
| Toasts | Sonner |
| Testing | Jest + ts-jest |

---

## Post-MVP Roadmap

### Done ✅
- [x] Income CRUD with filters
- [x] Expense CRUD with filters
- [x] Simplified tax estimation with disclaimer
- [x] Cashflow dashboard with KPIs + charts
- [x] Runway calculation with 3 scenarios
- [x] Forecast engine with recurring items
- [x] Auto-forecast from history
- [x] Settings page (cash, buffer, tax rates)
- [x] Responsive layout (desktop sidebar + mobile bottom nav)
- [x] Empty states with guidance
- [x] Form validation (Zod)
- [x] Demo seed data
- [x] Unit tests for forecast engine (18 tests)
- [x] Currency formatting (CHF)
- [x] Accessibility basics (labels, focus states)

### Next ⏭️
- [ ] CSV import for income/expenses
- [ ] Monthly income/expense charts on their respective pages
- [ ] One-time future entries in forecast
- [ ] Multi-currency support with conversion
- [ ] Authentication (NextAuth)
- [ ] Data export (CSV/PDF reports)
- [ ] Dark mode toggle
- [ ] Multilingual UI (DE/FR/IT/EN)
- [ ] E2E tests (Playwright)
- [ ] Deploy to Vercel / Swiss hosting

---

## License

Private / unlicensed. Built as an MVP demo.
