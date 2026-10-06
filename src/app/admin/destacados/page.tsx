import Link from "next/link";
import { listingPath } from "@/lib/slug";
import { prisma } from "@/lib/db";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/format";
import { FEATURE_DAYS, FEATURE_PRICE, activeFeaturedWhere, formatShortDate } from "@/lib/featured";
import FeatureRequestActions from "@/components/admin/FeatureRequestActions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminDestacadosPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [pending, active, earnedThisMonth] = await Promise.all([
    prisma.featureRequest.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
      include: {
        listing: { select: { id: true, slug: true, title: true, price: true } },
        user: { select: { name: true, whatsapp: true } },
      },
    }),
    prisma.listing.findMany({
      where: { ...activeFeaturedWhere(now), sold: false },
      orderBy: { featuredUntil: "asc" },
      select: { id: true, slug: true, title: true, featuredUntil: true, user: { select: { name: true } } },
    }),
    prisma.featureRequest.aggregate({
      where: { status: "approved", resolvedAt: { gte: monthStart } },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <Card className="min-w-40 flex-1 p-4">
          <p className="text-xs text-muted-foreground">Por confirmar</p>
          <p className="text-2xl font-bold text-foreground">{pending.length}</p>
        </Card>
        <Card className="min-w-40 flex-1 p-4">
          <p className="text-xs text-muted-foreground">Destacadas ahora</p>
          <p className="text-2xl font-bold text-foreground">{active.length}</p>
        </Card>
        <Card className="min-w-40 flex-1 p-4">
          <p className="text-xs text-muted-foreground">Cobrado este mes</p>
          <p className="text-2xl font-bold text-green-700">
            {formatPrice(earnedThisMonth._sum.amount ?? 0)}
          </p>
        </Card>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-foreground">Solicitudes por confirmar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tarifa actual: {formatPrice(FEATURE_PRICE)} por {FEATURE_DAYS} días. Confirma que el pago
          llegó a tu Yape o Plin antes de aprobar.
        </p>
        {pending.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No hay solicitudes pendientes.</p>
        ) : (
          <Card className="mt-4 gap-0 divide-y divide-border py-0">
            {pending.map((req) => (
              <div
                key={req.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    href={listingPath(req.listing)}
                    className="line-clamp-1 text-sm font-medium text-foreground hover:underline"
                  >
                    {req.listing.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {req.user.name} · pagaría {formatPrice(req.amount)} por {req.days} días ·{" "}
                    {req.createdAt.toLocaleDateString("es-PE", { timeZone: "America/Lima" })}
                  </p>
                  <a
                    href={buildWhatsAppLink(
                      req.user.whatsapp,
                      `Hola ${req.user.name}, te escribo por el destacado de "${req.listing.title}" en FigurasAnime.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-green-700 underline"
                  >
                    Escribirle por WhatsApp
                  </a>
                </div>
                <FeatureRequestActions requestId={req.id} />
              </div>
            ))}
          </Card>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground">Destacadas ahora</h2>
        {active.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Ninguna figura destacada por ahora.</p>
        ) : (
          <Card className="mt-4 gap-0 divide-y divide-border py-0">
            {active.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <Link
                    href={listingPath(l)}
                    className="line-clamp-1 text-sm font-medium text-foreground hover:underline"
                  >
                    {l.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">{l.user.name}</p>
                </div>
                <Badge className="shrink-0 bg-amber-400 text-amber-950">
                  Hasta el {formatShortDate(l.featuredUntil!)}
                </Badge>
              </div>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
