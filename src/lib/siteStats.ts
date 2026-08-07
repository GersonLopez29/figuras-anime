import { cache } from "react";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

const SITE_STATS_ID = "global";

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

// cache() evita contar la misma peticion dos veces si Next renderiza
// el layout mas de una vez en la misma peticion.
export const registerSiteVisit = cache(async () => {
  const headersList = await headers();
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
