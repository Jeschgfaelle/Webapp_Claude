import { z } from "zod";

// ── Income Entry ──────────────────────────────────────────────
export const incomeEntrySchema = z.object({
  date: z.string().min(1, "Date is required"),
  client: z.string().optional().default(""),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: z.string().default("CHF"),
  vatIncluded: z.coerce.boolean().default(false),
});
export type IncomeEntryInput = z.infer<typeof incomeEntrySchema>;

// ── Expense Entry ─────────────────────────────────────────────
export const expenseEntrySchema = z.object({
  date: z.string().min(1, "Date is required"),
  vendor: z.string().optional().default(""),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: z.string().default("CHF"),
  deductible: z.coerce.boolean().default(true),
});
export type ExpenseEntryInput = z.infer<typeof expenseEntrySchema>;

// ── Recurring Item ────────────────────────────────────────────
export const recurringItemSchema = z.object({
  type: z.enum(["income", "expense"]),
  name: z.string().min(1, "Name is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  cadence: z.enum(["monthly", "quarterly", "yearly"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().default(""),
  category: z.string().optional().default(""),
});
export type RecurringItemInput = z.infer<typeof recurringItemSchema>;

// ── Settings ──────────────────────────────────────────────────
export const settingsSchema = z.object({
  startingCash: z.coerce.number().min(0, "Starting cash cannot be negative"),
  minCashBuffer: z.coerce.number().min(0, "Buffer cannot be negative"),
  horizonMonths: z.coerce.number().int().min(1).max(36),
  effectiveTaxRate: z.coerce.number().min(0).max(100),
  taxDeductions: z.coerce.number().min(0),
  taxReservePercent: z.coerce.number().min(0).max(100),
  taxPaymentSchedule: z.enum(["monthly", "quarterly"]),
  currency: z.string().default("CHF"),
});
export type SettingsInput = z.infer<typeof settingsSchema>;

// ── Category presets ──────────────────────────────────────────
export const INCOME_CATEGORIES = [
  "Consulting",
  "Development",
  "Design",
  "Coaching",
  "Retainer",
  "Product Sales",
  "Other",
] as const;

export const EXPENSE_CATEGORIES = [
  "Office & Rent",
  "Software & Tools",
  "Hardware",
  "Insurance",
  "Travel",
  "Marketing",
  "Professional Services",
  "Telecommunications",
  "Education",
  "AHV/IV/EO",
  "Pillar 3a",
  "Other",
] as const;
