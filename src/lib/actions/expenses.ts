import { prisma } from "@/lib/db";

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
  if (filters?.category) where.category = filters.category;
  if (filters?.vendor) where.vendor = { contains: filters.vendor };
  if (filters?.search) {
    where.OR = [
      { description: { contains: filters.search } },
      { vendor: { contains: filters.search } },
    ];
  }

  return prisma.expenseEntry.findMany({ where, orderBy: { date: "desc" } });
}
