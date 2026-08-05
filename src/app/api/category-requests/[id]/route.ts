import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/session";

const resolveSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const existing = await prisma.categoryRequest.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
  }
  if (existing.status !== "pending") {
    return NextResponse.json({ error: "Esta solicitud ya fue resuelta" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = resolveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  if (parsed.data.action === "approve") {
    await prisma.$transaction(async (tx) => {
      const alreadyExists = await tx.category.findFirst({
        where: { name: { equals: existing.name, mode: "insensitive" } },
      });
      if (!alreadyExists) {
        await tx.category.create({ data: { name: existing.name } });
      }
      await tx.categoryRequest.update({
        where: { id },
        data: { status: "approved", resolvedAt: new Date() },
      });
    });
  } else {
    await prisma.categoryRequest.update({
      where: { id },
      data: { status: "rejected", resolvedAt: new Date() },
    });
  }

  const updated = await prisma.categoryRequest.findUnique({ where: { id } });
  return NextResponse.json(updated);
}
