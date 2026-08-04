import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/session";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const comment = await prisma.postComment.findUnique({ where: { id } });
  if (!comment) {
    return NextResponse.json({ error: "Comentario no encontrado" }, { status: 404 });
  }
  if (comment.authorId !== user.id && !isAdmin(user)) {
    return NextResponse.json({ error: "No puedes eliminar este comentario" }, { status: 403 });
  }

  await prisma.postComment.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
