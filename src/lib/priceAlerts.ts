import { prisma } from "@/lib/db";
import { getActiveDiscountAmount, getFinalPrice } from "@/lib/format";
import { listingPath } from "@/lib/slug";
import { sendPriceDropEmail } from "@/lib/email";

// Aviso de rebaja: cuando baja el precio final de una figura (el vendedor edita
// el precio o le pone un descuento), se avisa por correo a quienes la tienen
// en Favoritos.

// Bajas menores a esto no se avisan (evita correos por S/ 0.50).
export const PRICE_DROP_MIN = 1;

type PriceFields = {
  price: number;
  discountAmount: number | null;
  discountExpiresAt: Date | null;
};

// Precio que paga el comprador hoy (con el descuento si sigue vigente).
export function effectivePrice(l: PriceFields): number {
  return getFinalPrice(l.price, getActiveDiscountAmount(l.discountAmount, l.discountExpiresAt));
}

// Revisa si la figura bajó respecto de previousPrice y avisa a quienes la
// guardaron. Cada favorito recuerda el último precio avisado (notifiedPrice):
// solo se vuelve a escribir si baja todavía más, nunca dos veces por lo mismo.
// Devuelve cuántos correos se enviaron.
export async function notifyPriceDrop(listingId: string, previousPrice: number): Promise<number> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      slug: true,
      title: true,
      userId: true,
      sold: true,
      price: true,
      discountAmount: true,
      discountExpiresAt: true,
      images: { take: 1, select: { url: true } },
    },
  });
  if (!listing || listing.sold) return 0;
  const newPrice = effectivePrice(listing);
  if (newPrice > previousPrice - PRICE_DROP_MIN) return 0;

  const favorites = await prisma.favorite.findMany({
    where: {
      listingId,
      userId: { not: listing.userId },
      user: { emailVerified: true, isBlocked: false },
    },
    select: { id: true, notifiedPrice: true, user: { select: { email: true, name: true } } },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gerstore.club";
  let sent = 0;
  for (const fav of favorites) {
    const lastPrice = fav.notifiedPrice ?? previousPrice;
    if (newPrice > lastPrice - PRICE_DROP_MIN) continue;
    // Solo avisa quien todavía tenía el precio leído (dos cambios a la vez no
    // mandan dos correos).
    const claimed = await prisma.favorite.updateMany({
      where: { id: fav.id, notifiedPrice: fav.notifiedPrice },
      data: { notifiedPrice: newPrice },
    });
    if (claimed.count !== 1) continue;
    await sendPriceDropEmail(fav.user.email, fav.user.name, {
      title: listing.title,
      oldPrice: lastPrice,
      newPrice,
      url: `${siteUrl}${listingPath(listing)}`,
      imageUrl: listing.images[0]?.url ?? null,
      discountUntil: getActiveDiscountAmount(listing.discountAmount, listing.discountExpiresAt)
        ? listing.discountExpiresAt
        : null,
    });
    sent++;
  }
  return sent;
}
