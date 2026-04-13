"use client";

import { EntryTable } from "@/components/entries/entry-table";
import { FilterBar } from "@/components/entries/filter-bar";
import { INCOME_CATEGORIES } from "@/lib/validations";
import { TrendingUp } from "lucide-react";

interface SerializedIncome {
  id: string;
  date: string;
  client: string | null;
  description: string;
  category: string;
  amount: number;
  currency: string;
  vatIncluded: boolean;
}

export function IncomePageClient({ entries }: { entries: SerializedIncome[] }) {
  const tableEntries = entries.map((e) => ({
    id: e.id,
    date: e.date,
    description: e.description,
    category: e.category,
    amount: e.amount,
    clientOrVendor: e.client,
    flagValue: e.vatIncluded,
  }));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-5 w-5 text-success" />
          <h1 className="text-2xl font-bold tracking-tight">Income</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Track and manage your income entries
        </p>
      </div>

      <FilterBar categories={INCOME_CATEGORIES} type="income" />

      <EntryTable
        type="income"
        entries={tableEntries}
        totalLabel="Total income"
      />
    </div>
  );
}
