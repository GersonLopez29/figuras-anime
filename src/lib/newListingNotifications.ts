import { prisma } from "@/lib/db";
import { matchesQuery, normalizeAlertQuery } from "@/lib/alertMatch";
import { sendAlertMatchEmail, sendWantedMatchEmail } from "@/lib/email";
import { formatPrice } from "@/lib/format";
import { listingPath } from "@/lib/slug";
import { WANTED_ACTIVE_DAYS } from "@/lib/wanted";

// Un aviso dura 6 meses; después hay que volver a pedirlo.
export const ALERT_ACTIVE_DAYS = 180;
// Si un vendedor sube varias figuras parecidas seguidas, el comprador recibe
// un solo correo (que trae el enlace a todas las de su búsqueda).
const NOTIFY_COOLDOWN_MINUTES = 30;
// Tope de correos por figura nueva, para no agotar el plan de Resend.
const MAX_EMAILS_PER_LISTING = 50;

function daysAgo(days: number, now: Date) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

// Se llama (con after()) cuando se publica una figura: avisa a quienes la
// pidieron en "Avísame cuando llegue" y a quienes la buscan en "Se busca".
export async function notifyNewListing(listingId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      price: true,
      userId: true,
      sold: true,
      images: { take: 1, select: { url: true } },
      user: { select: { email: true } },
    },
  });
  if (!listing || listing.sold) return;

  const now = new Date();
  const cooldownStart = new Date(now.getTime() - NOTIFY_COOLDOWN_MINUTES * 60_000);
  const emailListing = {
    title: listing.title,
    path: listingPath(listing),
    priceLabel: formatPrice(listing.price),
    imageUrl: listing.images[0]?.url ?? null,
  };
  let budget = MAX_EMAILS_PER_LISTING;
  // Una persona recibe como mucho un correo por figura, aunque tenga varios avisos.
  const alreadyEmailed = new Set<string>([listing.user.email]);

  const alerts = await prisma.stockAlert.findMany({
    where: {
      confirmedAt: { not: null },
      createdAt: { gte: daysAgo(ALERT_ACTIVE_DAYS, now) },
      OR: [{ lastNotifiedAt: null }, { lastNotifiedAt: { lt: cooldownStart } }],
    },
    select: { id: true, email: true, query: true, token: true },
    orderBy: { createdAt: "asc" },
  });

  for (const alert of alerts) {
    if (budget <= 0) break;
    if (alreadyEmailed.has(alert.email)) continue;
    if (!matchesQuery(alert.query, listing)) continue;
    alreadyEmailed.add(alert.email);
    budget--;
    await prisma.stockAlert.update({ where: { id: alert.id }, data: { lastNotifiedAt: now } });
    await sendAlertMatchEmail(alert.email, alert.query, alert.token, emailListing);
  }

  const wanted = await prisma.wantedPost.findMany({
    where: {
      status: "open",
      createdAt: { gte: daysAgo(WANTED_ACTIVE_DAYS, now) },
      userId: { not: listing.userId },
      user: { emailVerified: true, isBlocked: false },
      OR: [{ lastNotifiedAt: null }, { lastNotifiedAt: { lt: cooldownStart } }],
    },
    select: {
      id: true,
      title: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  for (const post of wanted) {
    if (budget <= 0) break;
    if (alreadyEmailed.has(post.user.email)) continue;
    if (!matchesQuery(normalizeAlertQuery(post.title), listing)) continue;
    alreadyEmailed.add(post.user.email);
    budget--;
    await prisma.wantedPost.update({ where: { id: post.id }, data: { lastNotifiedAt: now } });
    await sendWantedMatchEmail(post.user.email, post.user.name, post.title, emailListing);
  }
}
