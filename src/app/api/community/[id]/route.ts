import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/session";
import { deleteUploadedImage } from "@/lib/uploads";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const existing = await prisma.collectionPost.findUnique({
    where: { id },
    include: { images: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }
  if (existing.authorId !== user.id && !isAdmin(user)) {
    return NextResponse.json({ error: "No puedes eliminar esta publicación" }, { status: 403 });
  }

  await prisma.collectionPost.delete({ where: { id } });
  await Promise.all(existing.images.map((img) => deleteUploadedImage(img.url)));

  return NextResponse.json({ ok: true });
}
