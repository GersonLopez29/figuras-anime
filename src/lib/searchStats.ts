// Registro anónimo de búsquedas del catálogo para el reporte "Demanda" del
// administrador: qué buscan y qué no encuentran. Solo se guarda el término
// normalizado y la fecha, nunca quién buscó.

import { prisma } from "@/lib/db";
import { normalizeAlertQuery } from "@/lib/alertMatch";

// Buscadores, vistas previas de redes y herramientas automáticas no cuentan.
const BOT_USER_AGENT =
  /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|lighthouse|headless|curl|wget|python|axios|node-fetch/i;

// Las búsquedas se guardan hasta 6 meses.
export const SEARCH_STATS_KEEP_DAYS = 180;

export function isBotUserAgent(userAgent: string | null): boolean {
  return !userAgent || BOT_USER_AGENT.test(userAgent);
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function recordSearch(rawQuery: string, hadResults: boolean): Promise<void> {
  const query = normalizeAlertQuery(rawQuery.slice(0, 100));
  if (query.length < 2) return;
  const date = startOfUtcDay(new Date());
  const increment = { searches: { increment: 1 }, noResults: { increment: hadResults ? 0 : 1 } };

  try {
    await prisma.searchStat.upsert({
      where: { date_query: { date, query } },
      create: { date, query, searches: 1, noResults: hadResults ? 0 : 1 },
      update: increment,
    });
  } catch {
    // Dos búsquedas iguales al mismo tiempo: la otra creó la fila, se suma a ella.
    await prisma.searchStat
      .update({ where: { date_query: { date, query } }, data: increment })
      .catch((err) => console.error("[búsquedas] No se pudo registrar:", err));
  }
}
