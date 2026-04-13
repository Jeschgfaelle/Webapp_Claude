import { Suspense } from "react";
import { getIncomeEntries } from "@/lib/actions/income";
import { IncomePageClient } from "./client";

export default async function IncomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const entries = await getIncomeEntries({
    month: params.month,
    category: params.category,
    search: params.search,
  });

  // Serialize entries for client component
  const serialized = entries.map((e) => ({
    id: e.id,
    date: e.date.toISOString(),
    client: e.client,
    description: e.description,
    category: e.category,
    amount: e.amount,
    currency: e.currency,
    vatIncluded: e.vatIncluded,
  }));

  return (
    <Suspense fallback={<div className="animate-pulse">Loading income...</div>}>
      <IncomePageClient entries={serialized} />
    </Suspense>
  );
}
