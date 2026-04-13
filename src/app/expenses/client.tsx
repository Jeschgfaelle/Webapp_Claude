"use client";

import { EntryTable } from "@/components/entries/entry-table";
import { FilterBar } from "@/components/entries/filter-bar";
import { EXPENSE_CATEGORIES } from "@/lib/validations";
import { TrendingDown } from "lucide-react";

interface SerializedExpense {
  id: string;
  date: string;
  vendor: string | null;
  description: string;
  category: string;
  amount: number;
  currency: string;
  deductible: boolean;
}

export function ExpensesPageClient({
  entries,
}: {
  entries: SerializedExpense[];
}) {
  const tableEntries = entries.map((e) => ({
    id: e.id,
    date: e.date,
    description: e.description,
    category: e.category,
    amount: e.amount,
    clientOrVendor: e.vendor,
    flagValue: e.deductible,
  }));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <TrendingDown className="h-5 w-5 text-danger" />
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Track and manage your business expenses
        </p>
      </div>

      <FilterBar categories={EXPENSE_CATEGORIES} type="expense" />

      <EntryTable
        type="expense"
        entries={tableEntries}
        totalLabel="Total expenses"
      />
    </div>
  );
}
