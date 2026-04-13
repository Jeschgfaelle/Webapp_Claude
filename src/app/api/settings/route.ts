import { prisma } from "@/lib/db";
import { settingsSchema } from "@/lib/validations";
import { NextRequest } from "next/server";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const data = parsed.data;
    await prisma.settings.upsert({
      where: { id: "default" },
      update: { ...data },
      create: { id: "default", ...data },
    });
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
