import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) {
    return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 });
  }
  if (review.authorId !== user.id) {
    return NextResponse.json({ error: "No puedes eliminar esta reseña" }, { status: 403 });
  }

  await prisma.review.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
