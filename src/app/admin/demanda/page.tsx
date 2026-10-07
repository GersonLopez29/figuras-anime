import Link from "next/link";
import { prisma } from "@/lib/db";
import { matchesQuery, normalizeAlertQuery } from "@/lib/alertMatch";
import { ALERT_ACTIVE_DAYS } from "@/lib/newListingNotifications";
import { wantedActiveSince } from "@/lib/wanted";
import { SEARCH_STATS_KEEP_DAYS } from "@/lib/searchStats";
import { formatPrice } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

const PERIODS = [7, 30, 90] as const;
const TABLE_LIMIT = 25;
const DAY_MS = 24 * 60 * 60 * 1000;

type DemandRow = {
  query: string;
  searches: number;
  noResults: number;
  alerts: number;
  wanted: number;
  maxBudget: number | null;
  available: number;
};

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

// Personas que esperan la figura: búsquedas sin resultado + avisos + pedidos.
function interest(row: DemandRow) {
  return row.noResults + row.alerts + row.wanted;
}

type DemandaPageProps = {
  searchParams: Promise<{ dias?: string }>;
};

export default async function AdminDemandaPage({ searchParams }: DemandaPageProps) {
  const { dias } = await searchParams;
  const days = PERIODS.find((p) => String(p) === dias) ?? 30;
  const now = new Date();
  const since = new Date(startOfUtcDay(now).getTime() - (days - 1) * DAY_MS);

  // Limpieza: las búsquedas se guardan hasta 6 meses.
  await prisma.searchStat.deleteMany({
    where: { date: { lt: new Date(now.getTime() - SEARCH_STATS_KEEP_DAYS * DAY_MS) } },
  });

  const [searchRows, alertRows, wantedPosts, availableListings] = await Promise.all([
    prisma.searchStat.groupBy({
      by: ["query"],
      where: { date: { gte: since } },
      _sum: { searches: true, noResults: true },
    }),
    prisma.stockAlert.groupBy({
      by: ["query"],
      where: {
        confirmedAt: { not: null },
        createdAt: { gte: new Date(now.getTime() - ALERT_ACTIVE_DAYS * DAY_MS) },
      },
      _count: { _all: true },
    }),
    prisma.wantedPost.findMany({
      where: { status: "open", createdAt: { gte: wantedActiveSince(now) }, user: { isBlocked: false } },
      select: { title: true, maxPrice: true },
    }),
    prisma.listing.findMany({ where: { sold: false }, select: { title: true, category: true } }),
  ]);

  const rows = new Map<string, DemandRow>();
  const rowFor = (query: string) => {
    let row = rows.get(query);
    if (!row) {
      row = { query, searches: 0, noResults: 0, alerts: 0, wanted: 0, maxBudget: null, available: 0 };
      rows.set(query, row);
    }
    return row;
  };
  for (const r of searchRows) {
    const row = rowFor(r.query);
    row.searches += r._sum.searches ?? 0;
    row.noResults += r._sum.noResults ?? 0;
  }
  for (const r of alertRows) rowFor(r.query).alerts += r._count._all;
  for (const post of wantedPosts) {
    const query = normalizeAlertQuery(post.title);
    if (query.length < 2) continue;
    const row = rowFor(query);
    row.wanted += 1;
    if (post.maxPrice && (row.maxBudget === null || post.maxPrice > row.maxBudget)) {
      row.maxBudget = post.maxPrice;
    }
  }
  for (const row of rows.values()) {
    row.available = availableListings.filter((l) => matchesQuery(row.query, l)).length;
  }

  const all = [...rows.values()];
  const opportunities = all
    .filter((r) => r.available === 0 && interest(r) > 0)
    .sort((a, b) => interest(b) - interest(a) || b.searches - a.searches)
    .slice(0, TABLE_LIMIT);
  const mostSearched = all
    .filter((r) => r.searches > 0)
    .sort((a, b) => b.searches - a.searches)
    .slice(0, TABLE_LIMIT);

  const totalSearches = all.reduce((sum, r) => sum + r.searches, 0);
  const totalNoResults = all.reduce((sum, r) => sum + r.noResults, 0);
  const totalAlerts = alertRows.reduce((sum, r) => sum + r._count._all, 0);
  const noResultsPct = totalSearches > 0 ? Math.round((totalNoResults / totalSearches) * 100) : 0;

  const summary = [
    { label: `Búsquedas (${days} días)`, value: totalSearches.toLocaleString("es-PE") },
    { label: "Sin resultados", value: `${totalNoResults.toLocaleString("es-PE")} (${noResultsPct}%)` },
    { label: "Avisos activos", value: totalAlerts.toLocaleString("es-PE") },
    { label: "Pedidos en Se busca", value: wantedPosts.length.toLocaleString("es-PE") },
  ];

  const searchLink = (query: string) => `/?q=${encodeURIComponent(query)}#catalogo`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">🔎 Demanda</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Qué buscan los compradores y qué no encuentran: búsquedas del catálogo, avisos de
            &quot;Avísame&quot; y pedidos de &quot;Se busca&quot;. Úsalo para decidir qué figuras
            conseguir para tu tienda.
          </p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <Badge
              key={p}
              render={<Link href={`/admin/demanda?dias=${p}`} />}
              variant={p === days ? "default" : "outline"}
              className="h-auto rounded-full px-3 py-1.5 text-sm"
            >
              {p} días
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summary.map((s) => (
          <Card key={s.label} className="gap-1 p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="gap-3 p-4 sm:p-5">
        <div>
          <h3 className="font-semibold text-foreground">🎯 Lo piden y no hay</h3>
          <p className="text-xs text-muted-foreground">
            Figuras sin ninguna disponible ahora, ordenadas por cuántas personas las esperan.
            Avisos y pedidos son los activos hoy; las búsquedas, las del período.
          </p>
        </div>
        {opportunities.length === 0 ? (
          <p className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            Todavía no hay datos. Las búsquedas se registran desde que se publicó este reporte.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Figura</TableHead>
                <TableHead className="text-right">Búsquedas sin resultado</TableHead>
                <TableHead className="text-right">Avísame</TableHead>
                <TableHead className="text-right">Se busca</TableHead>
                <TableHead className="text-right">Presupuesto máx.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opportunities.map((r) => (
                <TableRow key={r.query}>
                  <TableCell className="font-medium">
                    {r.query}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {interest(r)} {interest(r) === 1 ? "interesado" : "interesados"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{r.noResults || "—"}</TableCell>
                  <TableCell className="text-right">{r.alerts || "—"}</TableCell>
                  <TableCell className="text-right">
                    {r.wanted ? (
                      <Link href="/se-busca" className="text-primary hover:underline">
                        {r.wanted}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.maxBudget !== null ? formatPrice(r.maxBudget) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="gap-3 p-4 sm:p-5">
        <div>
          <h3 className="font-semibold text-foreground">🔥 Lo más buscado ({days} días)</h3>
          <p className="text-xs text-muted-foreground">
            Si algo se busca mucho y hay pocas disponibles, conviene conseguir más.
          </p>
        </div>
        {mostSearched.length === 0 ? (
          <p className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            Todavía no hay búsquedas registradas en este período.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Búsqueda</TableHead>
                <TableHead className="text-right">Veces</TableHead>
                <TableHead className="text-right">Sin resultado</TableHead>
                <TableHead className="text-right">Disponibles ahora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mostSearched.map((r) => (
                <TableRow key={r.query}>
                  <TableCell className="font-medium">
                    <Link href={searchLink(r.query)} className="hover:text-primary hover:underline">
                      {r.query}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">{r.searches}</TableCell>
                  <TableCell className="text-right">{r.noResults || "—"}</TableCell>
                  <TableCell className="text-right">
                    {r.available === 0 ? (
                      <span className="font-medium text-destructive">0</span>
                    ) : (
                      r.available
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <p className="text-xs text-muted-foreground">
        Las búsquedas se guardan sin datos de quién buscó y se borran a los {SEARCH_STATS_KEEP_DAYS}{" "}
        días. No se cuentan tus propias búsquedas ni las de buscadores como Google.
      </p>
    </div>
  );
}
