import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/actions/settings";
import { getRecurringItems } from "@/lib/actions/recurring";
import {
  buildScenarios,
  type RecurringItemData,
} from "@/lib/forecast-engine";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { startOfMonth, startOfYear } from "date-fns";

export default async function DashboardPage() {
  const [settings, recurringItems, incomeEntries, expenseEntries] =
    await Promise.all([
      getSettings(),
      getRecurringItems(),
      prisma.incomeEntry.findMany(),
      prisma.expenseEntry.findMany(),
    ]);

  // Current month data from actuals
  const now = new Date();
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const currentMonthIncome = incomeEntries
    .filter((e) => e.date >= monthStart)
    .reduce((sum, e) => sum + e.amount, 0);

  const currentMonthExpenses = expenseEntries
    .filter((e) => e.date >= monthStart)
    .reduce((sum, e) => sum + e.amount, 0);

  const ytdIncome = incomeEntries
    .filter((e) => e.date >= yearStart)
    .reduce((sum, e) => sum + e.amount, 0);

  const ytdExpenses = expenseEntries
    .filter((e) => e.date >= yearStart)
    .reduce((sum, e) => sum + e.amount, 0);

  const ytdProfit = ytdIncome - ytdExpenses;
  const ytdTaxEstimate =
    Math.max(0, ytdProfit) * (settings.effectiveTaxRate / 100);

  // Build forecast scenarios
  const recurring: RecurringItemData[] = recurringItems.map((item) => ({
    id: item.id,
    type: item.type as "income" | "expense",
    name: item.name,
    amount: item.amount,
    cadence: item.cadence as "monthly" | "quarterly" | "yearly",
    startDate: item.startDate,
    endDate: item.endDate,
    category: item.category,
  }));

  const forecastSettings = {
    startingCash: settings.startingCash,
    minCashBuffer: settings.minCashBuffer,
    horizonMonths: settings.horizonMonths,
    effectiveTaxRate: settings.effectiveTaxRate,
    taxDeductions: settings.taxDeductions,
    taxReservePercent: settings.taxReservePercent,
    taxPaymentSchedule: settings.taxPaymentSchedule as "monthly" | "quarterly",
  };

  const scenarios = buildScenarios(forecastSettings, recurring);

  // Serialize dates for client component
  const serializedScenarios = {
    base: {
      ...scenarios.base,
      projections: scenarios.base.projections.map((p) => ({
        ...p,
        month: p.month.toISOString(),
      })),
    },
    conservative: {
      ...scenarios.conservative,
      projections: scenarios.conservative.projections.map((p) => ({
        ...p,
        month: p.month.toISOString(),
      })),
    },
    optimistic: {
      ...scenarios.optimistic,
      projections: scenarios.optimistic.projections.map((p) => ({
        ...p,
        month: p.month.toISOString(),
      })),
    },
  };

  return (
    <DashboardClient
      scenarios={serializedScenarios as never}
      currentMonthIncome={currentMonthIncome}
      currentMonthExpenses={currentMonthExpenses}
      ytdIncome={ytdIncome}
      ytdExpenses={ytdExpenses}
      ytdTaxEstimate={ytdTaxEstimate}
      minCashBuffer={settings.minCashBuffer}
      horizonMonths={settings.horizonMonths}
      startingCash={settings.startingCash}
      effectiveTaxRate={settings.effectiveTaxRate}
    />
  );
}
