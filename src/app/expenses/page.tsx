import { Suspense } from "react";
import { getExpenseEntries } from "@/lib/actions/expenses";
import { ExpensesPageClient } from "./client";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const entries = await getExpenseEntries({
    month: params.month,
    category: params.category,
    search: params.search,
  });

  const serialized = entries.map((e) => ({
    id: e.id,
    date: e.date.toISOString(),
    vendor: e.vendor,
    description: e.description,
    category: e.category,
    amount: e.amount,
    currency: e.currency,
    deductible: e.deductible,
  }));

  return (
    <Suspense fallback={<div className="animate-pulse">Loading expenses...</div>}>
      <ExpensesPageClient entries={serialized} />
    </Suspense>
  );
}
