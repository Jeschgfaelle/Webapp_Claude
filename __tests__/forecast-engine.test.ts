/**
 * Tests for the Forecast Engine – core financial projection logic.
 *
 * Run with: npx jest __tests__/forecast-engine.test.ts
 */

import {
  buildForecast,
  buildScenarios,
  isActiveInMonth,
  sumRecurringForMonth,
  autoForecastFromHistory,
  type RecurringItemData,
  type ForecastSettings,
  type HistoricalMonthData,
} from "../src/lib/forecast-engine";

// ── Helpers ───────────────────────────────────────────────────

const defaultSettings: ForecastSettings = {
  startingCash: 50000,
  minCashBuffer: 10000,
  horizonMonths: 12,
  effectiveTaxRate: 22,
  taxDeductions: 0,
  taxReservePercent: 22,
  taxPaymentSchedule: "monthly",
};

function makeRecurring(
  overrides: Partial<RecurringItemData> = {}
): RecurringItemData {
  return {
    id: "test-1",
    type: "income",
    name: "Test Income",
    amount: 5000,
    cadence: "monthly",
    startDate: new Date(2024, 0, 1),
    endDate: null,
    category: "Consulting",
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────

describe("isActiveInMonth", () => {
  it("returns true for monthly items in range", () => {
    const item = makeRecurring({ cadence: "monthly" });
    expect(isActiveInMonth(item, new Date(2024, 5, 1))).toBe(true);
    expect(isActiveInMonth(item, new Date(2025, 0, 1))).toBe(true);
  });

  it("returns false before start date", () => {
    const item = makeRecurring({
      cadence: "monthly",
      startDate: new Date(2024, 6, 1),
    });
    expect(isActiveInMonth(item, new Date(2024, 5, 1))).toBe(false);
  });

  it("returns false after end date", () => {
    const item = makeRecurring({
      cadence: "monthly",
      endDate: new Date(2024, 6, 1),
    });
    expect(isActiveInMonth(item, new Date(2024, 8, 1))).toBe(false);
  });

  it("handles quarterly cadence correctly", () => {
    const item = makeRecurring({
      cadence: "quarterly",
      startDate: new Date(2024, 0, 1),
    });
    expect(isActiveInMonth(item, new Date(2024, 0, 1))).toBe(true); // month 0
    expect(isActiveInMonth(item, new Date(2024, 1, 1))).toBe(false); // month 1
    expect(isActiveInMonth(item, new Date(2024, 2, 1))).toBe(false); // month 2
    expect(isActiveInMonth(item, new Date(2024, 3, 1))).toBe(true); // month 3
    expect(isActiveInMonth(item, new Date(2024, 6, 1))).toBe(true); // month 6
  });

  it("handles yearly cadence correctly", () => {
    const item = makeRecurring({
      cadence: "yearly",
      startDate: new Date(2024, 3, 1), // April
    });
    expect(isActiveInMonth(item, new Date(2024, 3, 1))).toBe(true); // April 2024
    expect(isActiveInMonth(item, new Date(2025, 3, 1))).toBe(true); // April 2025
    expect(isActiveInMonth(item, new Date(2024, 5, 1))).toBe(false); // June 2024
  });
});

describe("sumRecurringForMonth", () => {
  it("sums only active items of correct type", () => {
    const items: RecurringItemData[] = [
      makeRecurring({ id: "1", type: "income", amount: 5000, cadence: "monthly" }),
      makeRecurring({ id: "2", type: "income", amount: 3000, cadence: "monthly" }),
      makeRecurring({ id: "3", type: "expense", amount: 2000, cadence: "monthly" }),
    ];
    const month = new Date(2024, 5, 1);

    expect(sumRecurringForMonth(items, month, "income")).toBe(8000);
    expect(sumRecurringForMonth(items, month, "expense")).toBe(2000);
  });
});

describe("buildForecast", () => {
  it("builds correct number of monthly projections", () => {
    const result = buildForecast(defaultSettings, []);
    expect(result.projections).toHaveLength(12);
  });

  it("handles no recurring items (zero income/expense)", () => {
    const result = buildForecast(defaultSettings, []);

    // With no recurring items, cash should stay at starting cash
    for (const p of result.projections) {
      expect(p.projectedIncome).toBe(0);
      expect(p.projectedExpenses).toBe(0);
      expect(p.endingCash).toBe(50000);
    }
    expect(result.runwayMonths).toBe(-1); // no breach
  });

  it("calculates correct cashflow with income and expenses", () => {
    const recurring: RecurringItemData[] = [
      makeRecurring({ id: "1", type: "income", amount: 10000, cadence: "monthly" }),
      makeRecurring({ id: "2", type: "expense", amount: 4000, cadence: "monthly" }),
    ];

    const result = buildForecast(defaultSettings, recurring);
    const p = result.projections[0];

    expect(p.projectedIncome).toBe(10000);
    expect(p.projectedExpenses).toBe(4000);
    expect(p.projectedProfit).toBe(6000);
    expect(p.taxReserve).toBeCloseTo(6000 * 0.22, 2); // 1320
    expect(p.netCashflow).toBeCloseTo(10000 - 4000 - 1320, 2); // 4680
    expect(p.endingCash).toBeCloseTo(50000 + 4680, 2);
  });

  it("detects runway breach correctly", () => {
    const settings: ForecastSettings = {
      ...defaultSettings,
      startingCash: 5000,
      minCashBuffer: 3000,
    };

    // Expense-heavy: losing 3000/month net before tax
    const recurring: RecurringItemData[] = [
      makeRecurring({ id: "1", type: "income", amount: 2000, cadence: "monthly" }),
      makeRecurring({ id: "2", type: "expense", amount: 5000, cadence: "monthly" }),
    ];

    const result = buildForecast(settings, recurring);

    // Net cashflow = 2000 - 5000 - 0 (no tax on negative profit) = -3000/month
    // Month 0: 5000 + (-3000) = 2000 → below 3000 buffer → breach at month 0
    expect(result.runwayMonths).toBe(0);
    expect(result.projections[0].runwayBreached).toBe(true);
  });

  it("handles zero starting cash", () => {
    const settings: ForecastSettings = {
      ...defaultSettings,
      startingCash: 0,
      minCashBuffer: 0,
    };

    const recurring: RecurringItemData[] = [
      makeRecurring({ id: "1", type: "income", amount: 10000, cadence: "monthly" }),
      makeRecurring({ id: "2", type: "expense", amount: 3000, cadence: "monthly" }),
    ];

    const result = buildForecast(settings, recurring);
    expect(result.projections[0].startingCash).toBe(0);
    expect(result.projections[0].endingCash).toBeGreaterThan(0);
    expect(result.runwayMonths).toBe(-1);
  });

  it("handles large values without overflow", () => {
    const recurring: RecurringItemData[] = [
      makeRecurring({ id: "1", type: "income", amount: 1000000, cadence: "monthly" }),
      makeRecurring({ id: "2", type: "expense", amount: 500000, cadence: "monthly" }),
    ];

    const result = buildForecast(defaultSettings, recurring);
    const lastMonth = result.projections[result.projections.length - 1];
    expect(lastMonth.endingCash).toBeGreaterThan(0);
    expect(Number.isFinite(lastMonth.endingCash)).toBe(true);
  });

  it("taxes are zero when profit is negative", () => {
    const recurring: RecurringItemData[] = [
      makeRecurring({ id: "1", type: "income", amount: 1000, cadence: "monthly" }),
      makeRecurring({ id: "2", type: "expense", amount: 5000, cadence: "monthly" }),
    ];

    const result = buildForecast(defaultSettings, recurring);
    for (const p of result.projections) {
      expect(p.taxReserve).toBe(0);
    }
  });
});

describe("buildScenarios", () => {
  it("returns base, conservative, and optimistic results", () => {
    const recurring: RecurringItemData[] = [
      makeRecurring({ id: "1", type: "income", amount: 10000, cadence: "monthly" }),
    ];

    const result = buildScenarios(defaultSettings, recurring);

    expect(result.base).toBeDefined();
    expect(result.conservative).toBeDefined();
    expect(result.optimistic).toBeDefined();
  });

  it("conservative has lower income than base", () => {
    const recurring: RecurringItemData[] = [
      makeRecurring({ id: "1", type: "income", amount: 10000, cadence: "monthly" }),
    ];

    const result = buildScenarios(defaultSettings, recurring);

    expect(result.conservative.projections[0].projectedIncome).toBe(8000); // 80%
    expect(result.base.projections[0].projectedIncome).toBe(10000);
    expect(result.optimistic.projections[0].projectedIncome).toBe(12000); // 120%
  });

  it("conservative has shorter runway than optimistic", () => {
    const settings: ForecastSettings = {
      ...defaultSettings,
      startingCash: 20000,
    };

    const recurring: RecurringItemData[] = [
      makeRecurring({ id: "1", type: "income", amount: 3000, cadence: "monthly" }),
      makeRecurring({ id: "2", type: "expense", amount: 5000, cadence: "monthly" }),
    ];

    const result = buildScenarios(settings, recurring);

    // Conservative should breach earlier or at same time
    if (
      result.conservative.runwayMonths !== -1 &&
      result.optimistic.runwayMonths !== -1
    ) {
      expect(result.conservative.runwayMonths).toBeLessThanOrEqual(
        result.optimistic.runwayMonths
      );
    }
  });
});

describe("autoForecastFromHistory", () => {
  it("returns null if fewer than minMonths of history", () => {
    const history: HistoricalMonthData[] = [
      {
        month: new Date(2024, 0, 1),
        totalIncome: 10000,
        totalExpenses: 3000,
        incomeByCategory: { Consulting: 10000 },
        expenseByCategory: { "Office & Rent": 3000 },
      },
    ];

    expect(autoForecastFromHistory(history, 3)).toBeNull();
  });

  it("returns suggestions when enough history exists", () => {
    const history: HistoricalMonthData[] = [
      {
        month: new Date(2024, 0, 1),
        totalIncome: 9000,
        totalExpenses: 3000,
        incomeByCategory: { Consulting: 6000, Development: 3000 },
        expenseByCategory: { "Office & Rent": 2000, "Software & Tools": 1000 },
      },
      {
        month: new Date(2024, 1, 1),
        totalIncome: 12000,
        totalExpenses: 3500,
        incomeByCategory: { Consulting: 7000, Development: 5000 },
        expenseByCategory: { "Office & Rent": 2000, "Software & Tools": 1500 },
      },
      {
        month: new Date(2024, 2, 1),
        totalIncome: 10000,
        totalExpenses: 4000,
        incomeByCategory: { Consulting: 5000, Development: 5000 },
        expenseByCategory: { "Office & Rent": 2500, "Software & Tools": 1500 },
      },
    ];

    const suggestions = autoForecastFromHistory(history, 3);
    expect(suggestions).not.toBeNull();
    expect(suggestions!.length).toBeGreaterThan(0);

    // Check that income suggestions exist
    const incomeSuggestions = suggestions!.filter((s) => s.type === "income");
    expect(incomeSuggestions.length).toBeGreaterThan(0);

    // Consulting average: (6000 + 7000 + 5000) / 3 = 6000
    const consulting = incomeSuggestions.find((s) =>
      s.category === "Consulting"
    );
    expect(consulting).toBeDefined();
    expect(consulting!.amount).toBe(6000);
  });
});
