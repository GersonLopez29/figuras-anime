import { cache } from "react";
import { headers } from "next/headers";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";

const SITE_STATS_ID = "global";

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

// cache() evita contar la misma peticion dos veces si Next renderiza
// el layout mas de una vez en la misma peticion.
// Bots, buscadores y vistas previas de redes sociales no son visitas reales:
// no se cuentan, y así tampoco despiertan la base de datos para escribir.
const BOT_UA =
  /bot|crawl|spider|slurp|facebookexternalhit|facebookcatalog|meta-externalagent|whatsapp|telegram|discord|preview|mediapartners|adsbot|google-|lighthouse|headless|pingdom|uptime|monitor|curl|wget|python|axios|node-fetch|go-http/i;

export function isBotUserAgent(ua: string | null): boolean {
  return !ua || BOT_UA.test(ua);
}

// Total para el footer cuando la visita no se cuenta (cacheado 10 minutos).
const getCachedTotalVisits = unstable_cache(
  async () => {
    const stats = await prisma.siteStats.findUnique({
      where: { id: SITE_STATS_ID },
      select: { totalVisits: true },
    });
    return stats?.totalVisits ?? 0;
  },
  ["site-total-visits-v1"],
  { revalidate: 600 }
);

export const registerSiteVisit = cache(async () => {
  const headersList = await headers();
  if (isBotUserAgent(headersList.get("user-agent"))) return getCachedTotalVisits();
  // Vercel agrega este header automaticamente segun la IP del visitante;
  // en local (o fuera de Vercel) no existe, por eso el valor por defecto.
  const country = headersList.get("x-vercel-ip-country") ?? "XX";
  const today = startOfUtcDay(new Date());

  const [stats] = await prisma.$transaction([
    prisma.siteStats.upsert({
      where: { id: SITE_STATS_ID },
      create: { id: SITE_STATS_ID, totalVisits: 1 },
      update: { totalVisits: { increment: 1 } },
    }),
    prisma.visitStat.upsert({
      where: { date_country: { date: today, country } },
      create: { date: today, country, count: 1 },
      update: { count: { increment: 1 } },
    }),
  ]);

  return stats.totalVisits;
});
