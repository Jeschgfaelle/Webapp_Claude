"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { recurringItemSchema } from "@/lib/validations";

export async function getRecurringItems() {
  return prisma.recurringItem.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
}

export async function createRecurringItem(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = recurringItemSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  await prisma.recurringItem.create({
    data: {
      type: data.type,
      name: data.name,
      amount: data.amount,
      cadence: data.cadence,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      category: data.category || null,
    },
  });

  revalidatePath("/forecast");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateRecurringItem(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = recurringItemSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  await prisma.recurringItem.update({
    where: { id },
    data: {
      type: data.type,
      name: data.name,
      amount: data.amount,
      cadence: data.cadence,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      category: data.category || null,
    },
  });

  revalidatePath("/forecast");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteRecurringItem(id: string) {
  await prisma.recurringItem.delete({ where: { id } });
  revalidatePath("/forecast");
  revalidatePath("/dashboard");
  return { success: true };
}
