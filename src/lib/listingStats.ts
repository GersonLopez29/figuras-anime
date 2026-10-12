import { prisma } from "@/lib/db";

// Estadísticas por figura para "Mis figuras": visitas, contactos por WhatsApp
// (WhatsAppClick, no cuenta los del propio vendedor) y cuántos la guardaron.

export type ListingStats = {
  contacts: number;
  contactsWeek: number;
  favorites: number;
  // Cuántos contactos fueron con "Hacer una oferta".
  offers: number;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Una consulta por tipo de dato para todas las figuras del vendedor.
export async function getListingStats(listingIds: string[]): Promise<Map<string, ListingStats>> {
  const stats = new Map<string, ListingStats>(
    listingIds.map((id) => [id, { contacts: 0, contactsWeek: 0, favorites: 0, offers: 0 }])
  );
  if (listingIds.length === 0) return stats;
  const weekAgo = new Date(Date.now() - WEEK_MS);
  const [contacts, contactsWeek, favorites, offers] = await Promise.all([
    prisma.whatsAppClick.groupBy({
      by: ["listingId"],
      where: { listingId: { in: listingIds } },
      _count: { _all: true },
    }),
    prisma.whatsAppClick.groupBy({
      by: ["listingId"],
      where: { listingId: { in: listingIds }, createdAt: { gte: weekAgo } },
      _count: { _all: true },
    }),
    prisma.favorite.groupBy({
      by: ["listingId"],
      where: { listingId: { in: listingIds } },
      _count: { _all: true },
    }),
    prisma.whatsAppClick.groupBy({
      by: ["listingId"],
      where: { listingId: { in: listingIds }, offerAmount: { not: null } },
      _count: { _all: true },
    }),
  ]);
  for (const c of contacts) stats.get(c.listingId)!.contacts = c._count._all;
  for (const c of contactsWeek) stats.get(c.listingId)!.contactsWeek = c._count._all;
  for (const f of favorites) stats.get(f.listingId)!.favorites = f._count._all;
  for (const o of offers) stats.get(o.listingId)!.offers = o._count._all;
  return stats;
}

// Consejo corto según cómo le va a la figura (null si no hay nada que decir).
export function listingTip(input: {
  views: number;
  contacts: number;
  favorites: number;
  createdAt: Date;
  sold: boolean;
  featured: boolean;
}): { tone: "warn" | "good"; text: string } | null {
  const { views, contacts, favorites, createdAt, sold, featured } = input;
  const ageDays = Math.floor((Date.now() - createdAt.getTime()) / 86400000);
  if (sold) return null;
  if (views >= 40 && contacts === 0) {
    return {
      tone: "warn",
      text: "Muchas visitas pero nadie escribe: revisa el precio, agrega fotos reales o un descuento.",
    };
  }
  if (favorites >= 3 && contacts <= 1) {
    return {
      tone: "warn",
      text: `${favorites} personas la guardaron: con un descuento les llega un aviso de rebaja.`,
    };
  }
  if (ageDays >= 7 && views < 15 && !featured) {
    return {
      tone: "warn",
      text: "Pocas visitas: compártela en tu historia o TikTok, o destácala.",
    };
  }
  if (contacts >= 3) {
    return { tone: "good", text: "¡Está interesando! Responde rápido los mensajes de WhatsApp." };
  }
  return null;
}
