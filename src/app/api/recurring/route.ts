import { prisma } from "@/lib/db";
import { recurringItemSchema } from "@/lib/validations";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = recurringItemSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const data = parsed.data;
    const item = await prisma.recurringItem.create({
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
    return Response.json({ success: true, item });
  } catch (e) {
    return Response.json({ error: "Failed to create item" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return Response.json({ error: "ID required" }, { status: 400 });
    await prisma.recurringItem.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
