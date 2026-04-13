import { prisma } from "@/lib/db";

export async function getRecurringItems() {
  return prisma.recurringItem.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
}
