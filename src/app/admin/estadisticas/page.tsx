import { prisma } from "@/lib/db";
import { getCountryName, getCountryFlag } from "@/lib/geo";

const DAYS = 30;
const TOP_COUNTRIES = 8;
const SITE_STATS_ID = "global";

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
}

export default async function AdminEstadisticasPage() {
  const today = startOfUtcDay(new Date());
  const rangeStart = new Date(today);
  rangeStart.setUTCDate(rangeStart.getUTCDate() - (DAYS - 1));

  const [siteStats, dailyRows, countryRows] = await Promise.all([
    prisma.siteStats.findUnique({ where: { id: SITE_STATS_ID } }),
    prisma.visitStat.groupBy({
      by: ["date"],
      where: { date: { gte: rangeStart } },
      _sum: { count: true },
    }),
    prisma.visitStat.groupBy({
      by: ["country"],
      _sum: { count: true },
      orderBy: { _sum: { count: "desc" } },
    }),
  ]);

  const dailyMap = new Map(dailyRows.map((r) => [r.date.getTime(), r._sum.count ?? 0]));
  const days = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(rangeStart);
    d.setUTCDate(d.getUTCDate() + i);
    return { date: d, count: dailyMap.get(d.getTime()) ?? 0 };
  });

  const maxDaily = Math.max(1, ...days.map((d) => d.count));
  const last7 = days.slice(-7).reduce((sum, d) => sum + d.count, 0);
  const todayCount = days[days.length - 1].count;

  const topCountries = countryRows.slice(0, TOP_COUNTRIES).map((c) => ({
    country: c.country,
    count: c._sum.count ?? 0,
  }));
  const otherCount = countryRows
    .slice(TOP_COUNTRIES)
    .reduce((sum, c) => sum + (c._sum.count ?? 0), 0);
  const totalCountryVisits =
    topCountries.reduce((sum, c) => sum + c.count, 0) + otherCount;
  const maxCountry = Math.max(1, ...topCountries.map((c) => c.count), otherCount);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Visitas totales
          </p>
          <p className="mt-1 text-3xl font-bold text-zinc-900">
            {(siteStats?.totalVisits ?? 0).toLocaleString("es-PE")}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Hoy</p>
          <p className="mt-1 text-3xl font-bold text-zinc-900">
            {todayCount.toLocaleString("es-PE")}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Últimos 7 días
          </p>
          <p className="mt-1 text-3xl font-bold text-zinc-900">
            {last7.toLocaleString("es-PE")}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-zinc-900">
          Visitas por día (últimos {DAYS} días)
        </h3>

        <div className="mt-4 overflow-x-auto pb-1">
          <div
            className="flex h-40 items-end gap-[3px]"
            style={{ minWidth: `${days.length * 13}px` }}
          >
            {days.map((d) => (
              <div
                key={d.date.getTime()}
                title={`${formatDayLabel(d.date)}: ${d.count} ${d.count === 1 ? "visita" : "visitas"}`}
                className="w-2.5 shrink-0 rounded-t bg-orange-500 transition hover:bg-orange-600"
                style={{ height: `${Math.max(2, (d.count / maxDaily) * 100)}%` }}
              />
            ))}
          </div>
          <div
            className="mt-1 flex justify-between text-[11px] text-zinc-400"
            style={{ minWidth: `${days.length * 13}px` }}
          >
            <span>{formatDayLabel(days[0].date)}</span>
            <span>{formatDayLabel(days[days.length - 1].date)}</span>
          </div>
        </div>

        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-medium text-zinc-500 hover:text-zinc-800">
            Ver tabla de datos
          </summary>
          <div className="mt-2 max-h-64 overflow-y-auto rounded border border-zinc-100">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-zinc-50 text-zinc-500">
                <tr>
                  <th className="px-3 py-1.5">Fecha</th>
                  <th className="px-3 py-1.5">Visitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {[...days].reverse().map((d) => (
                  <tr key={d.date.getTime()}>
                    <td className="px-3 py-1.5 text-zinc-600">
                      {d.date.toLocaleDateString("es-PE", { timeZone: "UTC" })}
                    </td>
                    <td className="px-3 py-1.5 font-medium tabular-nums text-zinc-900">
                      {d.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-zinc-900">Visitas por país</h3>

        {topCountries.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-400">Todavía no hay datos suficientes.</p>
        ) : (
          <div className="mt-4 space-y-2.5">
            {topCountries.map((c) => (
              <div key={c.country} className="flex items-center gap-3">
                <span className="w-20 shrink-0 truncate text-sm text-zinc-700 sm:w-32">
                  {getCountryFlag(c.country)} {getCountryName(c.country)}
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-orange-500"
                    style={{ width: `${Math.max(2, (c.count / maxCountry) * 100)}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-sm font-medium tabular-nums text-zinc-900">
                  {c.count}
                </span>
              </div>
            ))}
            {otherCount > 0 && (
              <div className="flex items-center gap-3">
                <span className="w-20 shrink-0 truncate text-sm text-zinc-500 sm:w-32">
                  🌎 Otros países
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-zinc-400"
                    style={{ width: `${Math.max(2, (otherCount / maxCountry) * 100)}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-sm font-medium tabular-nums text-zinc-500">
                  {otherCount}
                </span>
              </div>
            )}
          </div>
        )}

        <p className="mt-3 text-xs text-zinc-400">
          {totalCountryVisits.toLocaleString("es-PE")} visitas con país identificado desde que
          se activó esta estadística.
        </p>
      </div>
    </div>
  );
}
