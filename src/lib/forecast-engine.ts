/**
 * Forecast Engine – Freelancer Finance Cockpit
 *
 * Builds month-by-month financial projections for Swiss freelancers.
 *
 * Algorithm (per month):
 *   projectedIncome   = sum(recurringIncome for month) + sum(oneTimeIncome for month)
 *   projectedExpenses = sum(recurringExpenses for month) + sum(oneTimeExpenses for month)
 *   projectedProfit   = projectedIncome - projectedExpenses
 *   projectedTaxReserve = max(0, projectedProfit) * effectiveTaxRate
 *   netCashflow       = projectedIncome - projectedExpenses - projectedTaxReserve
 *   endingCash        = previousEndingCash + netCashflow
 *
 * Runway: First month where endingCash < minCashBuffer.
 * Scenarios: Apply multiplier to projectedIncome (e.g. 0.8, 1.0, 1.2).
 */

import {
  addMonths,
  startOfMonth,
  isBefore,
  isAfter,
  isSameMonth,
  getMonth,
} from "date-fns";

// ── Types ─────────────────────────────────────────────────────

export interface RecurringItemData {
  id: string;
  type: "income" | "expense";
  name: string;
  amount: number;
  cadence: "monthly" | "quarterly" | "yearly";
  startDate: Date;
  endDate?: Date | null;
  category?: string | null;
}

export interface OneTimeEntry {
  date: Date;
  amount: number;
  type: "income" | "expense";
}

export interface ForecastSettings {
  startingCash: number;
  minCashBuffer: number;
  horizonMonths: number;
  effectiveTaxRate: number; // percentage, e.g. 22 for 22%
  taxDeductions: number;
  taxReservePercent: number; // percentage
  taxPaymentSchedule: "monthly" | "quarterly";
}

export interface MonthProjection {
  month: Date;
  label: string; // "Jan 2025"
  projectedIncome: number;
  projectedExpenses: number;
  projectedProfit: number;
  taxReserve: number;
  netCashflow: number;
  startingCash: number;
  endingCash: number;
  cumulativeTaxReserve: number;
  runwayBreached: boolean;
}

export interface ForecastResult {
  projections: MonthProjection[];
  runwayMonths: number; // -1 means no breach within horizon
  totalProjectedIncome: number;
  totalProjectedExpenses: number;
  totalTaxReserve: number;
  endingCash: number;
}

export interface ScenarioResult {
  base: ForecastResult;
  conservative: ForecastResult;
  optimistic: ForecastResult;
}

// ── Core Engine ───────────────────────────────────────────────

/**
 * Check if a recurring item is active in a given month.
 */
export function isActiveInMonth(
  item: RecurringItemData,
  month: Date
): boolean {
  const monthStart = startOfMonth(month);
  const itemStart = startOfMonth(item.startDate);

  // Item hasn't started yet
  if (isAfter(itemStart, monthStart)) return false;

  // Item has ended
  if (item.endDate) {
    const itemEnd = startOfMonth(item.endDate);
    if (isAfter(monthStart, itemEnd)) return false;
  }

  // Check cadence
  switch (item.cadence) {
    case "monthly":
      return true;
    case "quarterly": {
      const monthsDiff = monthDifference(itemStart, monthStart);
      return monthsDiff % 3 === 0;
    }
    case "yearly": {
      return getMonth(monthStart) === getMonth(itemStart);
    }
    default:
      return false;
  }
}

/**
 * Calculate the number of months between two dates.
 */
function monthDifference(from: Date, to: Date): number {
  const fromStart = startOfMonth(from);
  const toStart = startOfMonth(to);
  return (
    (toStart.getFullYear() - fromStart.getFullYear()) * 12 +
    (toStart.getMonth() - fromStart.getMonth())
  );
}

/**
 * Sum amounts for recurring items of a given type active in a month.
 */
export function sumRecurringForMonth(
  items: RecurringItemData[],
  month: Date,
  type: "income" | "expense"
): number {
  return items
    .filter((item) => item.type === type && isActiveInMonth(item, month))
    .reduce((sum, item) => sum + item.amount, 0);
}

/**
 * Sum one-time entries of a given type in a specific month.
 */
export function sumOneTimeForMonth(
  entries: OneTimeEntry[],
  month: Date,
  type: "income" | "expense"
): number {
  return entries
    .filter((e) => e.type === type && isSameMonth(e.date, month))
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Build the full month-by-month forecast projection.
 *
 * @param settings    - Forecast parameters (cash, tax rates, horizon)
 * @param recurring   - Recurring income/expense items
 * @param oneTime     - One-time future entries
 * @param incomeMultiplier - Multiplier for projected income (1.0 = base)
 */
export function buildForecast(
  settings: ForecastSettings,
  recurring: RecurringItemData[],
  oneTime: OneTimeEntry[] = [],
  incomeMultiplier: number = 1.0
): ForecastResult {
  const projections: MonthProjection[] = [];
  let runningCash = settings.startingCash;
  let cumulativeTaxReserve = 0;
  let runwayMonths = -1;
  let totalIncome = 0;
  let totalExpenses = 0;
  let totalTax = 0;

  const now = new Date();
  const effectiveRate = settings.effectiveTaxRate / 100;

  for (let i = 0; i < settings.horizonMonths; i++) {
    const month = startOfMonth(addMonths(now, i));
    const label = month.toLocaleDateString("en-CH", {
      month: "short",
      year: "numeric",
    });

    // Calculate projected amounts
    const recurringIncome = sumRecurringForMonth(recurring, month, "income");
    const oneTimeIncome = sumOneTimeForMonth(oneTime, month, "income");
    const projectedIncome =
      (recurringIncome + oneTimeIncome) * incomeMultiplier;

    const recurringExpense = sumRecurringForMonth(recurring, month, "expense");
    const oneTimeExpense = sumOneTimeForMonth(oneTime, month, "expense");
    const projectedExpenses = recurringExpense + oneTimeExpense;

    // Profit and tax
    const projectedProfit = projectedIncome - projectedExpenses;
    const taxableProfit = Math.max(0, projectedProfit);

    // Tax reserve: apply effective rate to taxable profit
    let taxReserve = 0;
    if (settings.taxPaymentSchedule === "monthly") {
      taxReserve = taxableProfit * effectiveRate;
    } else {
      // Quarterly: accumulate but only "pay" every 3 months
      taxReserve = taxableProfit * effectiveRate;
    }

    // Net cashflow = income - expenses - tax reserve
    const netCashflow = projectedIncome - projectedExpenses - taxReserve;
    const startingCash = runningCash;
    const endingCash = runningCash + netCashflow;

    cumulativeTaxReserve += taxReserve;

    // Check runway breach
    const runwayBreached = endingCash < settings.minCashBuffer;
    if (runwayBreached && runwayMonths === -1) {
      runwayMonths = i;
    }

    projections.push({
      month,
      label,
      projectedIncome,
      projectedExpenses,
      projectedProfit,
      taxReserve,
      netCashflow,
      startingCash,
      endingCash,
      cumulativeTaxReserve,
      runwayBreached,
    });

    totalIncome += projectedIncome;
    totalExpenses += projectedExpenses;
    totalTax += taxReserve;
    runningCash = endingCash;
  }

  return {
    projections,
    runwayMonths,
    totalProjectedIncome: totalIncome,
    totalProjectedExpenses: totalExpenses,
    totalTaxReserve: totalTax,
    endingCash: runningCash,
  };
}

/**
 * Build all three scenarios (base, conservative, optimistic).
 */
export function buildScenarios(
  settings: ForecastSettings,
  recurring: RecurringItemData[],
  oneTime: OneTimeEntry[] = []
): ScenarioResult {
  return {
    base: buildForecast(settings, recurring, oneTime, 1.0),
    conservative: buildForecast(settings, recurring, oneTime, 0.8),
    optimistic: buildForecast(settings, recurring, oneTime, 1.2),
  };
}

// ── Auto-forecast from History ────────────────────────────────

export interface HistoricalMonthData {
  month: Date;
  totalIncome: number;
  totalExpenses: number;
  incomeByCategory: Record<string, number>;
  expenseByCategory: Record<string, number>;
}

export interface SuggestedRecurring {
  type: "income" | "expense";
  name: string;
  amount: number;
  category: string;
}

/**
 * Compute trailing N-month averages from historical data.
 * Returns suggested recurring items if at least `minMonths` of history exist.
 */
export function autoForecastFromHistory(
  history: HistoricalMonthData[],
  minMonths: number = 3
): SuggestedRecurring[] | null {
  if (history.length < minMonths) return null;

  // Use the last `minMonths` months
  const recent = history.slice(-minMonths);

  // Aggregate by category
  const incomeCats: Record<string, number[]> = {};
  const expenseCats: Record<string, number[]> = {};

  for (const month of recent) {
    for (const [cat, amt] of Object.entries(month.incomeByCategory)) {
      if (!incomeCats[cat]) incomeCats[cat] = [];
      incomeCats[cat].push(amt);
    }
    for (const [cat, amt] of Object.entries(month.expenseByCategory)) {
      if (!expenseCats[cat]) expenseCats[cat] = [];
      expenseCats[cat].push(amt);
    }
  }

  const suggestions: SuggestedRecurring[] = [];

  // Income suggestions
  for (const [cat, amounts] of Object.entries(incomeCats)) {
    const avg = amounts.reduce((a, b) => a + b, 0) / minMonths;
    if (avg > 0) {
      suggestions.push({
        type: "income",
        name: `${cat} (avg)`,
        amount: Math.round(avg),
        category: cat,
      });
    }
  }

  // Expense suggestions
  for (const [cat, amounts] of Object.entries(expenseCats)) {
    const avg = amounts.reduce((a, b) => a + b, 0) / minMonths;
    if (avg > 0) {
      suggestions.push({
        type: "expense",
        name: `${cat} (avg)`,
        amount: Math.round(avg),
        category: cat,
      });
    }
  }

  return suggestions;
}

/**
 * Build historical month data from raw income/expense entries.
 */
export function buildHistoricalData(
  incomeEntries: { date: Date; amount: number; category: string }[],
  expenseEntries: { date: Date; amount: number; category: string }[]
): HistoricalMonthData[] {
  const monthMap = new Map<string, HistoricalMonthData>();

  const getKey = (d: Date) => {
    const m = startOfMonth(d);
    return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
  };

  const ensureMonth = (d: Date): HistoricalMonthData => {
    const key = getKey(d);
    if (!monthMap.has(key)) {
      monthMap.set(key, {
        month: startOfMonth(d),
        totalIncome: 0,
        totalExpenses: 0,
        incomeByCategory: {},
        expenseByCategory: {},
      });
    }
    return monthMap.get(key)!;
  };

  for (const entry of incomeEntries) {
    const data = ensureMonth(entry.date);
    data.totalIncome += entry.amount;
    data.incomeByCategory[entry.category] =
      (data.incomeByCategory[entry.category] || 0) + entry.amount;
  }

  for (const entry of expenseEntries) {
    const data = ensureMonth(entry.date);
    data.totalExpenses += entry.amount;
    data.expenseByCategory[entry.category] =
      (data.expenseByCategory[entry.category] || 0) + entry.amount;
  }

  return Array.from(monthMap.values()).sort(
    (a, b) => a.month.getTime() - b.month.getTime()
  );
}
