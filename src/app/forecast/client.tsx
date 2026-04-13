"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Scenario, ScenarioResult, SuggestedRecurring } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ScenarioToggle } from "@/components/dashboard/scenario-toggle";
import { CashflowChart } from "@/components/dashboard/cashflow-chart";
import { RunwayIndicator } from "@/components/dashboard/runway-indicator";
import { formatCHF } from "@/lib/format";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/validations";
import { Plus, Trash2, LineChart, Sparkles, TrendingUp, TrendingDown } from "lucide-react";

interface SerializedRecurring {
  id: string;
  type: string;
  name: string;
  amount: number;
  cadence: string;
  startDate: string;
  endDate: string | null;
  category: string | null;
}

interface ForecastPageClientProps {
  recurring: SerializedRecurring[];
  scenarios: ScenarioResult;
  suggestions: SuggestedRecurring[] | null;
  settings: {
    startingCash: number;
    minCashBuffer: number;
    horizonMonths: number;
    effectiveTaxRate: number;
  };
}

export function ForecastPageClient({ recurring, scenarios, suggestions, settings }: ForecastPageClientProps) {
  const [scenario, setScenario] = useState<Scenario>("base");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(!!suggestions);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const forecast = scenarios[scenario];
  const incomeItems = recurring.filter((r) => r.type === "income");
  const expenseItems = recurring.filter((r) => r.type === "expense");

  async function handleDelete(id: string) {
    if (!confirm("Delete this recurring item?")) return;
    setIsPending(true);
    try {
      const res = await fetch("/api/recurring", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  async function handleAddSuggestion(s: SuggestedRecurring) {
    setIsPending(true);
    try {
      const res = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: s.type,
          name: s.name,
          amount: String(s.amount),
          cadence: "monthly",
          startDate: new Date().toISOString().split("T")[0],
          category: s.category,
        }),
      });
      if (res.ok) router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  async function handleAddFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    fd.forEach((v, k) => { data[k] = v as string; });
    setIsPending(true);
    try {
      const res = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) { setShowAddForm(false); router.refresh(); }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LineChart className="h-5 w-5 text-chart-forecast" />
            <h1 className="text-2xl font-bold tracking-tight">Forecast</h1>
          </div>
          <p className="text-muted-foreground text-sm">Manage recurring items and view your financial projections</p>
        </div>
        <ScenarioToggle value={scenario} onChange={setScenario} />
      </div>

      {showSuggestions && suggestions && suggestions.length > 0 && (
        <Card className="border-info/30 bg-info/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-info mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Suggested recurring plan generated from your history</p>
                <p className="text-xs text-muted-foreground mt-1">Based on your trailing 3-month average. Click to add any item, then edit as needed.</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {suggestions.map((s, i) => (
                    <Button key={i} variant="outline" size="sm" onClick={() => handleAddSuggestion(s)} disabled={isPending}>
                      <Plus className="h-3 w-3 mr-1" />{s.name}: {formatCHF(s.amount)}/mo
                    </Button>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowSuggestions(false)}>Dismiss</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-success" />Recurring Income</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)}><Plus className="h-3.5 w-3.5 mr-1" />Add</Button>
          </CardHeader>
          <CardContent>
            {incomeItems.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No recurring income items</p> : (
              <div className="space-y-2">
                {incomeItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 text-sm">
                    <div><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.cadence} · {item.category || "Uncategorized"}</p></div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-success">{formatCHF(item.amount)}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-danger hover:text-danger" onClick={() => handleDelete(item.id)} disabled={isPending}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2"><TrendingDown className="h-4 w-4 text-danger" />Recurring Expenses</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)}><Plus className="h-3.5 w-3.5 mr-1" />Add</Button>
          </CardHeader>
          <CardContent>
            {expenseItems.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No recurring expense items</p> : (
              <div className="space-y-2">
                {expenseItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 text-sm">
                    <div><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.cadence} · {item.category || "Uncategorized"}</p></div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-danger">{formatCHF(item.amount)}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-danger hover:text-danger" onClick={() => handleDelete(item.id)} disabled={isPending}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Add Recurring Item</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAddFormSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2"><Label htmlFor="type">Type</Label><Select id="type" name="type" options={[{ value: "income", label: "Income" }, { value: "expense", label: "Expense" }]} required /></div>
              <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" name="name" placeholder="e.g. Monthly retainer" required /></div>
              <div className="space-y-2"><Label htmlFor="amount">Amount (CHF)</Label><Input id="amount" name="amount" type="number" step="0.01" min="0" placeholder="0.00" required /></div>
              <div className="space-y-2"><Label htmlFor="cadence">Cadence</Label><Select id="cadence" name="cadence" options={[{ value: "monthly", label: "Monthly" }, { value: "quarterly", label: "Quarterly" }, { value: "yearly", label: "Yearly" }]} required /></div>
              <div className="space-y-2"><Label htmlFor="startDate">Start Date</Label><Input id="startDate" name="startDate" type="date" defaultValue={new Date().toISOString().split("T")[0]} required /></div>
              <div className="space-y-2"><Label htmlFor="endDate">End Date <span className="text-muted-foreground">(opt.)</span></Label><Input id="endDate" name="endDate" type="date" /></div>
              <div className="space-y-2"><Label htmlFor="category">Category <span className="text-muted-foreground">(opt.)</span></Label><Select id="category" name="category" options={[{ value: "", label: "None" }, ...INCOME_CATEGORIES.map((c) => ({ value: c, label: c })), ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))]} /></div>
              <div className="flex items-end gap-2"><Button type="submit" disabled={isPending}>{isPending ? "Adding..." : "Add Item"}</Button><Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <RunwayIndicator months={forecast.runwayMonths} horizonMonths={settings.horizonMonths} />

      <Card>
        <CardHeader><CardTitle className="text-base">Cash Balance Projection ({settings.horizonMonths} months)</CardTitle></CardHeader>
        <CardContent><CashflowChart projections={forecast.projections} minCashBuffer={settings.minCashBuffer} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Monthly Projection Details</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-2.5 font-medium text-muted-foreground">Month</th>
                <th className="text-right p-2.5 font-medium text-muted-foreground">Income</th>
                <th className="text-right p-2.5 font-medium text-muted-foreground">Expenses</th>
                <th className="text-right p-2.5 font-medium text-muted-foreground">Tax Reserve</th>
                <th className="text-right p-2.5 font-medium text-muted-foreground">Net Cashflow</th>
                <th className="text-right p-2.5 font-medium text-muted-foreground">Cash Balance</th>
              </tr></thead>
              <tbody>
                {forecast.projections.map((p) => (
                  <tr key={p.label} className={`border-b last:border-0 ${p.runwayBreached ? "bg-danger/5 text-danger" : "hover:bg-muted/30"}`}>
                    <td className="p-2.5 font-medium">{p.label}</td>
                    <td className="p-2.5 text-right text-success">{formatCHF(p.projectedIncome)}</td>
                    <td className="p-2.5 text-right text-danger">{formatCHF(p.projectedExpenses)}</td>
                    <td className="p-2.5 text-right text-warning">{formatCHF(p.taxReserve)}</td>
                    <td className="p-2.5 text-right font-medium">{formatCHF(p.netCashflow)}</td>
                    <td className="p-2.5 text-right font-bold">{formatCHF(p.endingCash)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
