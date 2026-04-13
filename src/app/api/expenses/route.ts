import { prisma } from "@/lib/db";
import { expenseEntrySchema } from "@/lib/validations";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = expenseEntrySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const data = parsed.data;
    const entry = await prisma.expenseEntry.create({
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
    return Response.json({ success: true, entry });
  } catch (e) {
    return Response.json({ error: "Failed to create entry" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...rest } = body;
    if (!id) return Response.json({ error: "ID required" }, { status: 400 });

    const parsed = expenseEntrySchema.safeParse(rest);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const data = parsed.data;
    const entry = await prisma.expenseEntry.update({
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
    return Response.json({ success: true, entry });
  } catch (e) {
    return Response.json({ error: "Failed to update entry" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return Response.json({ error: "ID required" }, { status: 400 });
    await prisma.expenseEntry.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
