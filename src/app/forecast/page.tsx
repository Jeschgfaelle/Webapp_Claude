import { getRecurringItems } from "@/lib/actions/recurring";
import { getSettings } from "@/lib/actions/settings";
import { prisma } from "@/lib/db";
import {
  buildScenarios,
  buildHistoricalData,
  autoForecastFromHistory,
  type RecurringItemData,
} from "@/lib/forecast-engine";
import { ForecastPageClient } from "./client";

export default async function ForecastPage() {
  const [settings, recurringItems, incomeEntries, expenseEntries] =
    await Promise.all([
      getSettings(),
      getRecurringItems(),
      prisma.incomeEntry.findMany({ orderBy: { date: "asc" } }),
      prisma.expenseEntry.findMany({ orderBy: { date: "asc" } }),
    ]);

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

  // Auto-forecast suggestions
  const history = buildHistoricalData(
    incomeEntries.map((e) => ({
      date: e.date,
      amount: e.amount,
      category: e.category,
    })),
    expenseEntries.map((e) => ({
      date: e.date,
      amount: e.amount,
      category: e.category,
    }))
  );
  const suggestions = autoForecastFromHistory(history);

  // Serialize
  const serializedRecurring = recurringItems.map((item) => ({
    ...item,
    startDate: item.startDate.toISOString(),
    endDate: item.endDate?.toISOString() || null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

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
    <ForecastPageClient
      recurring={serializedRecurring}
      scenarios={serializedScenarios as never}
      suggestions={suggestions}
      settings={{
        startingCash: settings.startingCash,
        minCashBuffer: settings.minCashBuffer,
        horizonMonths: settings.horizonMonths,
        effectiveTaxRate: settings.effectiveTaxRate,
      }}
    />
  );
}
