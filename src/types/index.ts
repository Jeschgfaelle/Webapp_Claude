export type {
  RecurringItemData,
  OneTimeEntry,
  ForecastSettings,
  MonthProjection,
  ForecastResult,
  ScenarioResult,
  HistoricalMonthData,
  SuggestedRecurring,
} from "@/lib/forecast-engine";

export interface IncomeEntry {
  id: string;
  date: Date;
  client: string | null;
  description: string;
  category: string;
  amount: number;
  currency: string;
  vatIncluded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseEntry {
  id: string;
  date: Date;
  vendor: string | null;
  description: string;
  category: string;
  amount: number;
  currency: string;
  deductible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringItem {
  id: string;
  type: string;
  name: string;
  amount: number;
  cadence: string;
  startDate: Date;
  endDate: Date | null;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppSettings {
  id: string;
  startingCash: number;
  minCashBuffer: number;
  horizonMonths: number;
  effectiveTaxRate: number;
  taxDeductions: number;
  taxReservePercent: number;
  taxPaymentSchedule: string;
  currency: string;
}

export type Scenario = "base" | "conservative" | "optimistic";
