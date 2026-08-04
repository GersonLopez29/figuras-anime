import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/session";

const soldSchema = z.object({ sold: z.boolean() });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }
  if (existing.userId !== user.id && !isAdmin(user)) {
    return NextResponse.json(
      { error: "No puedes modificar esta publicación" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = soldSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: { sold: parsed.data.sold },
  });

  return NextResponse.json(updated);
}
