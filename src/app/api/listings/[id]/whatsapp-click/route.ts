import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { formatPrice, getActiveDiscountAmount, getFinalPrice } from "@/lib/format";
import { getActiveReservation } from "@/lib/reservation";
import { offerError } from "@/lib/offers";

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
    select: {
      title: true,
      sold: true,
      userId: true,
      price: true,
      discountAmount: true,
      discountExpiresAt: true,
      reservedAmount: true,
      reservedUntil: true,
      acceptsOffers: true,
      user: { select: { name: true, whatsapp: true } },
    },
  });
  if (!listing) {
    return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
  }
  if (listing.sold) {
    return NextResponse.json({ error: "Esta figura ya fue vendida" }, { status: 410 });
  }

  const isOwner = user?.id === listing.userId;

  // Si el comprador toca "Hacer una oferta", llega el monto ofrecido.
  const body = await request.json().catch(() => null);
  const rawOffer = body && typeof body.offer === "number" ? body.offer : null;
  const reserved = getActiveReservation(listing.reservedAmount, listing.reservedUntil);
  const total = getFinalPrice(
    listing.price,
    getActiveDiscountAmount(listing.discountAmount, listing.discountExpiresAt)
  );
  let offer: number | null = null;
  if (rawOffer !== null) {
    if (!listing.acceptsOffers || reserved) {
      return NextResponse.json(
        { error: "Esta figura tiene precio fijo: el vendedor no recibe ofertas." },
        { status: 400 }
      );
    }
    const err = offerError(rawOffer, total);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    offer = Math.round(rawOffer * 100) / 100;
  }

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
      data: { listingId: id, userId: user?.id ?? null, ip, offerAmount: offer },
    });
  }

  // Si está separada, el comprador ya avisa que pagaría el total.
  const message = offer !== null
    ? `Hola ${listing.user.name}, vi tu figura "${listing.title}" en GerStore (publicada a ${formatPrice(total)}). ¿Aceptarías ${formatPrice(offer)}? Si te parece, coordinamos la entrega.`
    : reserved
    ? `Hola ${listing.user.name}, vi tu figura "${listing.title}" en GerStore. Sé que está separada, pero me interesa comprarla pagando el total de ${formatPrice(total)}. ¿Es posible?`
    : `Hola ${listing.user.name}, vi tu figura "${listing.title}" en GerStore y me interesa. ¿Sigue disponible?`;
  return NextResponse.json({ link: buildWhatsAppLink(listing.user.whatsapp, message) });
}
