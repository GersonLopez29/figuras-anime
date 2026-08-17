import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }
  if (!user.emailVerified) {
    return NextResponse.json(
      { error: "Verifica tu correo antes de contactar a un vendedor" },
      { status: 403 }
    );
  }

  const listing = await prisma.listing.findUnique({ where: { id }, select: { userId: true } });
  if (!listing) {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }

  // No registramos cuando el vendedor hace clic en su propia publicación.
  if (listing.userId !== user.id) {
    await prisma.whatsAppClick.create({ data: { userId: user.id, listingId: id } });
  }

  return NextResponse.json({ ok: true });
}
