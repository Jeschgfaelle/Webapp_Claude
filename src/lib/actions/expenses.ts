"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { expenseEntrySchema } from "@/lib/validations";

export async function getExpenseEntries(filters?: {
  month?: string;
  category?: string;
  vendor?: string;
  search?: string;
}) {
  const where: Record<string, unknown> = {};

  if (filters?.month) {
    const [year, month] = filters.month.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    where.date = { gte: start, lt: end };
  }

  if (filters?.category) {
    where.category = filters.category;
  }

  if (filters?.vendor) {
    where.vendor = { contains: filters.vendor };
  }

  if (filters?.search) {
    where.OR = [
      { description: { contains: filters.search } },
      { vendor: { contains: filters.search } },
    ];
  }

  return prisma.expenseEntry.findMany({
    where,
    orderBy: { date: "desc" },
  });
}

export async function getExpenseMonthlyTotals() {
  const entries = await prisma.expenseEntry.findMany({
    orderBy: { date: "asc" },
  });

  const totals = new Map<string, number>();
  for (const entry of entries) {
    const key = `${entry.date.getFullYear()}-${String(entry.date.getMonth() + 1).padStart(2, "0")}`;
    totals.set(key, (totals.get(key) || 0) + entry.amount);
  }

  return Array.from(totals.entries()).map(([month, total]) => ({ month, total }));
}

export async function createExpenseEntry(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = expenseEntrySchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  await prisma.expenseEntry.create({
    data: {
      date: new Date(data.date),
      vendor: data.vendor || null,
      description: data.description,
      category: data.category,
      amount: data.amount,
      currency: data.currency,
      deductible: data.deductible,
    },
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateExpenseEntry(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = expenseEntrySchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  await prisma.expenseEntry.update({
    where: { id },
    data: {
      date: new Date(data.date),
      vendor: data.vendor || null,
      description: data.description,
      category: data.category,
      amount: data.amount,
      currency: data.currency,
      deductible: data.deductible,
    },
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteExpenseEntry(id: string) {
  await prisma.expenseEntry.delete({ where: { id } });
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: true };
}
