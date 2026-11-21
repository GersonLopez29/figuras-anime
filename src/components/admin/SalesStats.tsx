import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import {
  getSalesByDay,
  getSalesByMonth,
  limaMonthKey,
  limaTodayKey,
  type SalesBucket,
} from "@/lib/salesStats";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

const DAYS = 30;
const MONTHS = 12;

function dayLabel(key: string) {
  const [, m, d] = key.split("-");
  return `${d}/${m}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  const names = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];
  return `${names[Number(m) - 1]} ${y}`;
}

function sum(buckets: SalesBucket[]) {
  return buckets.reduce(
    (acc, b) => ({ count: acc.count + b.count, amount: acc.amount + b.amount }),
    { count: 0, amount: 0 }
  );
}

export default async function SalesStats() {
  const [days, months] = await Promise.all([getSalesByDay(DAYS), getSalesByMonth(MONTHS)]);

  const todayKey = limaTodayKey();
  const monthKey = limaMonthKey();
  const today = days.find((d) => d.key === todayKey) ?? { count: 0, amount: 0 };
  const last30 = sum(days);
  const thisMonth = months.find((m) => m.key === monthKey) ?? { count: 0, amount: 0 };
  const maxDay = Math.max(1, ...days.map((d) => d.amount));

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Ventas (montos)</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Monto de cada figura al marcarla como vendida, con el descuento vigente en ese momento.
          Las ventas anteriores a esta estadística usan el precio actual de la publicación. Es el
          precio de la publicación, no un acuerdo de regateo.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Hoy</p>
          <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">
            {formatPrice(today.amount)}
          </p>
          <p className="text-xs text-muted-foreground">{today.count} venta(s)</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Este mes
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">
            {formatPrice(thisMonth.amount)}
          </p>
          <p className="text-xs text-muted-foreground">{thisMonth.count} venta(s)</p>
        </Card>
        <Card className="p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Últimos {DAYS} días
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">
            {formatPrice(last30.amount)}
          </p>
          <p className="text-xs text-muted-foreground">{last30.count} venta(s)</p>
        </Card>
      </div>

      <Card className="p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">Monto por día (últimos {DAYS} días)</h3>
        <div className="mt-4 overflow-x-auto pb-1">
          <div className="flex h-40 items-end gap-[3px]" style={{ minWidth: `${days.length * 13}px` }}>
            {days.map((d) => (
              <div
                key={d.key}
                title={`${dayLabel(d.key)}: ${formatPrice(d.amount)} (${d.count} venta(s))`}
                className="w-2.5 shrink-0 rounded-t bg-emerald-500 transition hover:bg-emerald-600"
                style={{ height: `${d.amount > 0 ? Math.max(4, (d.amount / maxDay) * 100) : 2}%` }}
              />
            ))}
          </div>
          <div
            className="mt-1 flex justify-between text-[11px] text-muted-foreground"
            style={{ minWidth: `${days.length * 13}px` }}
          >
            <span>{dayLabel(days[0].key)}</span>
            <span>{dayLabel(days[days.length - 1].key)}</span>
          </div>
        </div>
      </Card>

      <Card className="p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">Por mes (últimos {MONTHS} meses)</h3>
        <div className="mt-3 overflow-hidden rounded border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted text-muted-foreground">
                <TableHead className="h-auto py-1.5 text-xs">Mes</TableHead>
                <TableHead className="h-auto py-1.5 text-right text-xs">Ventas</TableHead>
                <TableHead className="h-auto py-1.5 text-right text-xs">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...months].reverse().map((m) => (
                <TableRow key={m.key}>
                  <TableCell className="py-1.5 text-xs text-muted-foreground">
                    {monthLabel(m.key)}
                    {m.key === monthKey && " (actual)"}
                  </TableCell>
                  <TableCell className="py-1.5 text-right text-xs tabular-nums text-foreground">
                    {m.count}
                  </TableCell>
                  <TableCell className="py-1.5 text-right text-xs font-medium tabular-nums text-foreground">
                    {formatPrice(m.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </section>
  );
}
