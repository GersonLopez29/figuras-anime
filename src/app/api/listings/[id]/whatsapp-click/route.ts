import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { buildWhatsAppLink } from "@/lib/whatsapp";

// Cualquier visitante (con o sin cuenta) puede contactar al vendedor. El número
// no se escribe en el HTML de la figura: se entrega aquí recién al tocar el
// botón, con un límite por IP para que un bot no pueda juntar los WhatsApp de
// todos los vendedores.
const MAX_CONTACTS_PER_HOUR = 30;
const WINDOW_MS = 60 * 60 * 1000;

function getClientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ip = getClientIp(request);
  const user = await getCurrentUser();

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { title: true, sold: true, userId: true, user: { select: { name: true, whatsapp: true } } },
  });
  if (!listing) {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }
  if (listing.sold) {
    return NextResponse.json({ error: "Esta figura ya fue vendida" }, { status: 410 });
  }

  const isOwner = user?.id === listing.userId;

  if (!isOwner) {
    const recent = await prisma.whatsAppClick.count({
      where: { ip, createdAt: { gte: new Date(Date.now() - WINDOW_MS) } },
    });
    if (recent >= MAX_CONTACTS_PER_HOUR) {
      return NextResponse.json(
        { error: "Hiciste muchas consultas seguidas. Intenta de nuevo en un rato." },
        { status: 429 }
      );
    }
    // No registramos cuando el vendedor toca el botón de su propia publicación.
    await prisma.whatsAppClick.create({
      data: { listingId: id, userId: user?.id ?? null, ip },
    });
  }

  const message = `Hola ${listing.user.name}, vi tu figura "${listing.title}" en FigurasAnime y me interesa. ¿Sigue disponible?`;
  return NextResponse.json({ link: buildWhatsAppLink(listing.user.whatsapp, message) });
}
