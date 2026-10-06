import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/session";

const schema = z.object({ isOfficialStore: z.boolean() });

// Marca o desmarca una cuenta como "Tienda FigurasAnime". A diferencia de
// bloquear o borrar, el admin sí puede marcar su propia cuenta.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  if (!isAdmin(currentUser)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!target) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isOfficialStore: parsed.data.isOfficialStore },
    select: { id: true, isOfficialStore: true },
  });

  return NextResponse.json(updated);
}
