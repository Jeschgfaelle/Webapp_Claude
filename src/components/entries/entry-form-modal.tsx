"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatDateInput } from "@/lib/format";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/validations";

type EntryType = "income" | "expense";

interface EntryFormModalProps {
  type: EntryType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: FormData) => Promise<{ error?: Record<string, string[]>; success?: boolean }>;
  initialData?: {
    id?: string;
    date: string;
    clientOrVendor?: string;
    description: string;
    category: string;
    amount: number;
    vatOrDeductible?: boolean;
  };
}

export function EntryFormModal({
  type,
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: EntryFormModalProps) {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const categories =
    type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const isEditing = !!initialData?.id;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await onSubmit(formData);
      if (result?.error) {
        setErrors(result.error);
      } else {
        setErrors({});
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit" : "Add"}{" "}
            {type === "income" ? "Income" : "Expense"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the entry details below."
              : `Record a new ${type} entry.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={
                  initialData?.date || formatDateInput(new Date())
                }
                required
              />
              {errors.date && (
                <p className="text-xs text-danger">{errors.date[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (CHF)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={initialData?.amount || ""}
                placeholder="0.00"
                required
              />
              {errors.amount && (
                <p className="text-xs text-danger">{errors.amount[0]}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              defaultValue={initialData?.description || ""}
              placeholder={
                type === "income"
                  ? "e.g. Web development project"
                  : "e.g. Office rent January"
              }
              required
            />
            {errors.description && (
              <p className="text-xs text-danger">{errors.description[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                id="category"
                name="category"
                defaultValue={initialData?.category || ""}
                options={categories.map((c) => ({ value: c, label: c }))}
                placeholder="Select category"
                required
              />
              {errors.category && (
                <p className="text-xs text-danger">{errors.category[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={type === "income" ? "client" : "vendor"}>
                {type === "income" ? "Client" : "Vendor"}{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id={type === "income" ? "client" : "vendor"}
                name={type === "income" ? "client" : "vendor"}
                defaultValue={initialData?.clientOrVendor || ""}
                placeholder={
                  type === "income" ? "Client name" : "Vendor name"
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={type === "income" ? "vatIncluded" : "deductible"}
              name={type === "income" ? "vatIncluded" : "deductible"}
              defaultChecked={
                initialData?.vatOrDeductible ??
                (type === "expense" ? true : false)
              }
              value="true"
              className="h-4 w-4 rounded border-input text-primary focus:ring-ring cursor-pointer"
            />
            <Label
              htmlFor={type === "income" ? "vatIncluded" : "deductible"}
              className="cursor-pointer"
            >
              {type === "income" ? "VAT included" : "Tax deductible"}
            </Label>
          </div>

          <input type="hidden" name="currency" value="CHF" />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving..."
                : isEditing
                  ? "Update"
                  : "Add Entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
