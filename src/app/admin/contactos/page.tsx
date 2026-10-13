import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { listingPath } from "@/lib/slug";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AdminEmpty,
  AdminFilterChips,
  AdminPageHeader,
  AdminSearch,
} from "@/components/admin/AdminUi";

const BASE = "/admin/contactos";
const LIMIT = 200;

type Props = { searchParams: Promise<{ q?: string; filtro?: string }> };

export default async function AdminContactosPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 100);
  const onlyOffers = params.filtro === "ofertas";

  const where: Prisma.WhatsAppClickWhereInput = {
    ...(onlyOffers && { offerAmount: { not: null } }),
    ...(q && {
      OR: [
        { listing: { title: { contains: q, mode: "insensitive" } } },
        { listing: { user: { name: { contains: q, mode: "insensitive" } } } },
        { user: { name: { contains: q, mode: "insensitive" } } },
      ],
    }),
  };

  const [clicks, total, offers] = await Promise.all([
    prisma.whatsAppClick.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        listing: {
          select: { id: true, slug: true, title: true, price: true, user: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: LIMIT,
    }),
    prisma.whatsAppClick.count(),
    prisma.whatsAppClick.count({ where: { offerAmount: { not: null } } }),
  ]);

  const current = { q: q || undefined, filtro: onlyOffers ? "ofertas" : undefined };

  return (
    <div>
      <AdminPageHeader
        icon={MessageCircle}
        title="Contactos por WhatsApp"
        description={
          <>
            Cada vez que alguien toca &quot;Contactar por WhatsApp&quot; o &quot;Hacer una
            oferta&quot; en una figura aparece aquí, tenga cuenta o no. Se muestran los últimos{" "}
            {LIMIT}.
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        <AdminSearch
          basePath={BASE}
          query={q}
          placeholder="Buscar por figura, vendedor o comprador"
          keep={{ filtro: current.filtro }}
        />
        <AdminFilterChips
          basePath={BASE}
          param="filtro"
          active={onlyOffers ? "ofertas" : "todos"}
          current={current}
          label="Filtrar contactos"
          filters={[
            { value: "todos", label: "Todos", count: total },
            { value: "ofertas", label: "🤝 Con oferta", count: offers },
          ]}
        />
      </div>

      {clicks.length === 0 ? (
        <AdminEmpty>
          {q ? `Ningún contacto coincide con "${q}".` : "Todavía no hay contactos registrados."}
        </AdminEmpty>
      ) : (
        <Card className="gap-0 divide-y divide-border py-0 shadow-sm">
          {clicks.map((click) => (
            <div
              key={click.id}
              className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
            >
              <div className="min-w-0">
                <Link
                  href={listingPath(click.listing)}
                  className="line-clamp-1 text-sm font-medium text-foreground hover:underline"
                >
                  {click.listing.title}
                </Link>
                <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    {click.user ? (
                      <span className="font-medium text-foreground/80">{click.user.name}</span>
                    ) : (
                      "Visitante sin cuenta"
                    )}{" "}
                    → {click.listing.user.name}
                  </span>
                  {click.offerAmount !== null && (
                    <Badge className="h-auto bg-green-100 px-2 py-0 text-xs text-green-800 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300">
                      🤝 ofertó {formatPrice(click.offerAmount)} (precio {formatPrice(click.listing.price)})
                    </Badge>
                  )}
                </p>
              </div>
              <p className="shrink-0 text-xs text-muted-foreground">
                {click.createdAt.toLocaleString("es-PE", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "America/Lima",
                })}
              </p>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
