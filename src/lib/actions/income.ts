import { prisma } from "@/lib/db";

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
  if (filters?.category) where.category = filters.category;
  if (filters?.client) where.client = { contains: filters.client };
  if (filters?.search) {
    where.OR = [
      { description: { contains: filters.search } },
      { client: { contains: filters.search } },
    ];
  }

  return prisma.incomeEntry.findMany({ where, orderBy: { date: "desc" } });
}
