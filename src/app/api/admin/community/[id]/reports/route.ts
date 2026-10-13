import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/session";

// "Está bien": el admin revisó una publicación reportada y la deja. Se borran
// sus reportes para que deje de figurar como pendiente en el panel.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  if (!isAdmin(currentUser)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { count } = await prisma.postReport.deleteMany({ where: { postId: id } });
  return NextResponse.json({ dismissed: count });
}
