"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useCallback } from "react";

interface FilterBarProps {
  categories: readonly string[];
  type: "income" | "expense";
}

export function FilterBar({ categories, type }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/${type === "income" ? "income" : "expenses"}?${params.toString()}`);
    },
    [router, searchParams, type]
  );

  const clearFilters = useCallback(() => {
    router.push(`/${type === "income" ? "income" : "expenses"}`);
  }, [router, type]);

  const hasFilters =
    searchParams.has("month") ||
    searchParams.has("category") ||
    searchParams.has("search");

  // Generate month options for last 12 months
  const monthOptions: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-CH", {
      month: "short",
      year: "numeric",
    });
    monthOptions.push({ value, label });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          className="pl-9 w-[200px]"
          defaultValue={searchParams.get("search") || ""}
          onChange={(e) => updateFilter("search", e.target.value)}
        />
      </div>
      <Select
        options={[{ value: "", label: "All months" }, ...monthOptions]}
        value={searchParams.get("month") || ""}
        onChange={(e) => updateFilter("month", e.target.value)}
        className="w-[160px]"
      />
      <Select
        options={[
          { value: "", label: "All categories" },
          ...categories.map((c) => ({ value: c, label: c })),
        ]}
        value={searchParams.get("category") || ""}
        onChange={(e) => updateFilter("category", e.target.value)}
        className="w-[180px]"
      />
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
