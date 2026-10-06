import { prisma } from "@/lib/db";

// Precio y duración de una publicación destacada. Cambia estos valores para
// ajustar la tarifa: se usan en el aviso al vendedor y al aprobar el pago.
export const FEATURE_PRICE = 10;
export const FEATURE_DAYS = 7;

// Cuántas destacadas se muestran como máximo arriba del catálogo.
export const FEATURED_SECTION_LIMIT = 4;

export function isFeatured(featuredUntil: Date | null | undefined, now = new Date()): boolean {
  return !!featuredUntil && featuredUntil > now;
}

export function activeFeaturedWhere(now = new Date()) {
  return { featuredUntil: { gt: now } };
}

// Al aprobar se suman días a partir de hoy o, si la figura ya estaba
// destacada, a partir de su vencimiento actual (renovar no pierde días).
export function extendFeaturedUntil(current: Date | null, days: number, now = new Date()): Date {
  const start = current && current > now ? current : now;
  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
}

// Número de Yape/Plin donde pagan los vendedores: el WhatsApp del primer
// administrador. FEATURE_PAYMENT_NUMBER en Vercel lo reemplaza si hace falta.
export async function getFeaturePaymentInfo(): Promise<{ name: string; number: string } | null> {
  const admin = await prisma.user.findFirst({
    where: { role: "admin" },
    orderBy: { createdAt: "asc" },
    select: { name: true, whatsapp: true },
  });
  const number = process.env.FEATURE_PAYMENT_NUMBER ?? admin?.whatsapp;
  if (!number) return null;
  return { name: admin?.name ?? "FigurasAnime", number };
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    timeZone: "America/Lima",
  });
}

// Mezcla y toma n elementos, para rotar qué destacadas se ven primero.
export function pickRandom<T>(items: T[], n: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}
