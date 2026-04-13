"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EntryFormModal } from "./entry-form-modal";
import { formatCHF, formatDate, formatDateInput } from "@/lib/format";
import { Pencil, Trash2, Plus, FileText } from "lucide-react";

interface Entry {
  id: string;
  date: Date | string;
  description: string;
  category: string;
  amount: number;
  clientOrVendor?: string | null;
  flagValue?: boolean;
}

interface EntryTableProps {
  type: "income" | "expense";
  entries: Entry[];
  totalLabel?: string;
}

export function EntryTable({ type, entries, totalLabel = "Total" }: EntryTableProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const total = entries.reduce((sum, e) => sum + e.amount, 0);
  const apiPath = type === "income" ? "/api/income" : "/api/expenses";

  async function handleAdd(data: Record<string, unknown>) {
    const res = await fetch(apiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (res.ok) router.refresh();
    return result;
  }

  async function handleEdit(id: string, data: Record<string, unknown>) {
    const res = await fetch(apiPath, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    const result = await res.json();
    if (res.ok) router.refresh();
    return result;
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    setIsPending(true);
    try {
      const res = await fetch(apiPath, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  if (entries.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add {type === "income" ? "Income" : "Expense"}
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No {type} entries yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Start tracking your {type} by adding your first entry.
            This data will power your forecasts and runway calculations.
          </p>
          <Button className="mt-4" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add your first entry
          </Button>
        </div>
        <EntryFormModal
          type={type}
          open={addOpen}
          onOpenChange={setAddOpen}
          onSubmit={handleAdd}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {entries.length} entries · {totalLabel}:{" "}
          <span className="font-semibold text-foreground">{formatCHF(total)}</span>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add {type === "income" ? "Income" : "Expense"}
        </Button>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Description</th>
                <th className="text-left p-3 font-medium text-muted-foreground">
                  {type === "income" ? "Client" : "Vendor"}
                </th>
                <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-right p-3 font-medium text-muted-foreground w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 whitespace-nowrap">{formatDate(entry.date)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {entry.description}
                      {entry.flagValue && (
                        <Badge variant="secondary" className="text-[10px]">
                          {type === "income" ? "VAT" : "Deductible"}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{entry.clientOrVendor || "—"}</td>
                  <td className="p-3"><Badge variant="outline">{entry.category}</Badge></td>
                  <td className="p-3 text-right font-medium whitespace-nowrap">{formatCHF(entry.amount)}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditEntry(entry)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-danger hover:text-danger"
                        onClick={() => handleDelete(entry.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EntryFormModal type={type} open={addOpen} onOpenChange={setAddOpen} onSubmit={handleAdd} />

      {editEntry && (
        <EntryFormModal
          type={type}
          open={!!editEntry}
          onOpenChange={(open) => { if (!open) setEditEntry(null); }}
          onSubmit={(data) => handleEdit(editEntry.id, data)}
          initialData={{
            id: editEntry.id,
            date: formatDateInput(editEntry.date),
            clientOrVendor: editEntry.clientOrVendor || "",
            description: editEntry.description,
            category: editEntry.category,
            amount: editEntry.amount,
            vatOrDeductible: editEntry.flagValue,
          }}
        />
      )}
    </div>
  );
}
