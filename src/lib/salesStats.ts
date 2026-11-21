import { prisma } from "@/lib/db";

// Ventas por día y por mes para el panel admin. El monto es "soldPrice" (lo
// que se registró al marcar la figura como vendida). Las ventas anteriores a
// ese campo usan el precio actual de la publicación.
//
// Perú no tiene horario de verano: UTC-5 fijo. Agrupamos por día/mes en hora
// de Lima para que una venta de la noche caiga en el día correcto.

const LIMA_OFFSET_MS = 5 * 60 * 60 * 1000;

export type SalesBucket = { key: string; count: number; amount: number };

function limaKey(date: Date, granularity: "day" | "month") {
  const local = new Date(date.getTime() - LIMA_OFFSET_MS).toISOString();
  return granularity === "day" ? local.slice(0, 10) : local.slice(0, 7);
}

export function limaTodayKey() {
  return limaKey(new Date(), "day");
}

export function limaMonthKey() {
  return limaKey(new Date(), "month");
}

type RawRow = { key: string; n: number; amount: number };

async function salesBuckets(granularity: "day" | "month", since: Date): Promise<SalesBucket[]> {
  const rows =
    granularity === "day"
      ? await prisma.$queryRaw<RawRow[]>`
          SELECT to_char(bucket, 'YYYY-MM-DD') AS key, COUNT(*)::int AS n,
                 COALESCE(SUM(amount), 0)::float AS amount
          FROM (
            SELECT date_trunc('day', ("soldAt" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Lima') AS bucket,
                   COALESCE("soldPrice", "price") AS amount
            FROM "Listing"
            WHERE "sold" = true AND "soldAt" IS NOT NULL AND "soldAt" >= ${since}
          ) s
          GROUP BY bucket ORDER BY bucket`
      : await prisma.$queryRaw<RawRow[]>`
          SELECT to_char(bucket, 'YYYY-MM') AS key, COUNT(*)::int AS n,
                 COALESCE(SUM(amount), 0)::float AS amount
          FROM (
            SELECT date_trunc('month', ("soldAt" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Lima') AS bucket,
                   COALESCE("soldPrice", "price") AS amount
            FROM "Listing"
            WHERE "sold" = true AND "soldAt" IS NOT NULL AND "soldAt" >= ${since}
          ) s
          GROUP BY bucket ORDER BY bucket`;

  return rows.map((r) => ({ key: r.key, count: r.n, amount: r.amount }));
}

// Últimos `days` días (incluido hoy), con días sin ventas en cero.
export async function getSalesByDay(days: number) {
  const since = new Date(Date.now() - (days + 1) * 24 * 60 * 60 * 1000);
  const rows = await salesBuckets("day", since);
  const map = new Map(rows.map((r) => [r.key, r]));
  const out: SalesBucket[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = limaKey(new Date(Date.now() - i * 24 * 60 * 60 * 1000), "day");
    out.push(map.get(key) ?? { key, count: 0, amount: 0 });
  }
  return out;
}

// Últimos `months` meses (incluido el actual), con meses vacíos en cero.
export async function getSalesByMonth(months: number) {
  const since = new Date(Date.now() - (months + 1) * 31 * 24 * 60 * 60 * 1000);
  const rows = await salesBuckets("month", since);
  const map = new Map(rows.map((r) => [r.key, r]));
  const out: SalesBucket[] = [];
  const now = new Date(Date.now() - LIMA_OFFSET_MS);
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = d.toISOString().slice(0, 7);
    out.push(map.get(key) ?? { key, count: 0, amount: 0 });
  }
  return out;
}
