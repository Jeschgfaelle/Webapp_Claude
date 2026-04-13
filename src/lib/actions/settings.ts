"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { settingsSchema } from "@/lib/validations";

export async function getSettings() {
  let settings = await prisma.settings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    settings = await prisma.settings.create({
      data: { id: "default" },
    });
  }

  return settings;
}

export async function updateSettings(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = settingsSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  await prisma.settings.upsert({
    where: { id: "default" },
    update: {
      startingCash: data.startingCash,
      minCashBuffer: data.minCashBuffer,
      horizonMonths: data.horizonMonths,
      effectiveTaxRate: data.effectiveTaxRate,
      taxDeductions: data.taxDeductions,
      taxReservePercent: data.taxReservePercent,
      taxPaymentSchedule: data.taxPaymentSchedule,
      currency: data.currency,
    },
    create: {
      id: "default",
      startingCash: data.startingCash,
      minCashBuffer: data.minCashBuffer,
      horizonMonths: data.horizonMonths,
      effectiveTaxRate: data.effectiveTaxRate,
      taxDeductions: data.taxDeductions,
      taxReservePercent: data.taxReservePercent,
      taxPaymentSchedule: data.taxPaymentSchedule,
      currency: data.currency,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/forecast");
  return { success: true };
}
