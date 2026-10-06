import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { WANTED_CONTACTS_PER_HOUR, wantedActiveSince } from "@/lib/wanted";

// "Tengo esta figura": entrega el enlace de WhatsApp del comprador. Solo para
// usuarios con cuenta y con límite por hora, para proteger los números de bots.
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Inicia sesión para responder" }, { status: 401 });
  }
  if (!user.emailVerified) {
    return NextResponse.json({ error: "Verifica tu correo para responder pedidos" }, { status: 403 });
  }

  const post = await prisma.wantedPost.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      userId: true,
      user: { select: { whatsapp: true, isBlocked: true } },
    },
  });
  if (!post || post.user.isBlocked) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }
  if (post.userId === user.id) {
    return NextResponse.json({ error: "Este pedido es tuyo" }, { status: 400 });
  }
  if (post.status !== "open" || post.createdAt < wantedActiveSince()) {
    return NextResponse.json({ error: "Este pedido ya no está abierto" }, { status: 410 });
  }

  // Primero se registra y después se cuenta: así muchas peticiones al mismo
  // tiempo no pasan todas el límite. Si se pasó, se borra el registro.
  const contact = await prisma.wantedContact.create({
    data: { wantedPostId: post.id, userId: user.id },
    select: { id: true },
  });
  const hourAgo = new Date(Date.now() - 60 * 60_000);
  const recent = await prisma.wantedContact.count({
    where: { userId: user.id, createdAt: { gte: hourAgo } },
  });
  if (recent > WANTED_CONTACTS_PER_HOUR) {
    await prisma.wantedContact.delete({ where: { id: contact.id } });
    return NextResponse.json(
      { error: "Respondiste muchos pedidos seguidos. Intenta de nuevo en un rato." },
      { status: 429 }
    );
  }

  const message = `Hola, vi tu pedido "${post.title}" en FigurasAnime (Se busca) y tengo esa figura. ¿Sigues buscándola?`;
  return NextResponse.json({ url: buildWhatsAppLink(post.user.whatsapp, message) });
}
