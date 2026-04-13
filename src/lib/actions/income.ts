"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { incomeEntrySchema } from "@/lib/validations";

export async function getIncomeEntries(filters?: {
  month?: string;
  category?: string;
  client?: string;
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

  if (filters?.client) {
    where.client = { contains: filters.client };
  }

  if (filters?.search) {
    where.OR = [
      { description: { contains: filters.search } },
      { client: { contains: filters.search } },
    ];
  }

  return prisma.incomeEntry.findMany({
    where,
    orderBy: { date: "desc" },
  });
}

export async function getIncomeMonthlyTotals() {
  const entries = await prisma.incomeEntry.findMany({
    orderBy: { date: "asc" },
  });

  const totals = new Map<string, number>();
  for (const entry of entries) {
    const key = `${entry.date.getFullYear()}-${String(entry.date.getMonth() + 1).padStart(2, "0")}`;
    totals.set(key, (totals.get(key) || 0) + entry.amount);
  }

  return Array.from(totals.entries()).map(([month, total]) => ({ month, total }));
}

export async function createIncomeEntry(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = incomeEntrySchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  await prisma.incomeEntry.create({
    data: {
      date: new Date(data.date),
      client: data.client || null,
      description: data.description,
      category: data.category,
      amount: data.amount,
      currency: data.currency,
      vatIncluded: data.vatIncluded,
    },
  });

  revalidatePath("/income");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateIncomeEntry(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = incomeEntrySchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  await prisma.incomeEntry.update({
    where: { id },
    data: {
      date: new Date(data.date),
      client: data.client || null,
      description: data.description,
      category: data.category,
      amount: data.amount,
      currency: data.currency,
      vatIncluded: data.vatIncluded,
    },
  });

  revalidatePath("/income");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteIncomeEntry(id: string) {
  await prisma.incomeEntry.delete({ where: { id } });
  revalidatePath("/income");
  revalidatePath("/dashboard");
  return { success: true };
}
