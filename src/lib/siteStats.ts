import { cache } from "react";
import { prisma } from "@/lib/db";

const SITE_STATS_ID = "global";

// cache() evita contar la misma peticion dos veces si Next renderiza
// el layout mas de una vez en la misma peticion.
export const registerSiteVisit = cache(async () => {
  const stats = await prisma.siteStats.upsert({
    where: { id: SITE_STATS_ID },
    create: { id: SITE_STATS_ID, totalVisits: 1 },
    update: { totalVisits: { increment: 1 } },
  });
  return stats.totalVisits;
});
