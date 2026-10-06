import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/session";

async function loadOwnPost(id: string, allowAdmin: boolean) {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 }) };
  const post = await prisma.wantedPost.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!post) return { error: NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 }) };
  if (post.userId !== user.id && !(allowAdmin && isAdmin(user))) {
    return { error: NextResponse.json({ error: "No puedes modificar este pedido" }, { status: 403 }) };
  }
  return { post };
}

// Solo se puede marcar como conseguido (no reabrir: si sigue buscando, publica
// un pedido nuevo, que cuenta para el límite de pedidos abiertos).
const patchSchema = z.object({ status: z.literal("found") });

// El dueño marca su pedido como conseguido.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await loadOwnPost(id, false);
  if (result.error) return result.error;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }
  await prisma.wantedPost.update({ where: { id }, data: { status: parsed.data.status } });
  return NextResponse.json({ status: parsed.data.status });
}

// Lo borra el dueño o el administrador.
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await loadOwnPost(id, true);
  if (result.error) return result.error;
  await prisma.wantedPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
