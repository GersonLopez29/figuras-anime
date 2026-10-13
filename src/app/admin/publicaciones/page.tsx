import Link from "next/link";
import { listingPath } from "@/lib/slug";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { getCategoryNames } from "@/lib/categories";
import DeleteListingButton from "@/components/DeleteListingButton";
import ToggleSoldButton from "@/components/ToggleSoldButton";
import CategorySelect from "@/components/CategorySelect";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { SOLD_FILTERS, parseSoldFilter, soldCounts, soldWhere } from "@/lib/soldFilter";
import {
  AdminEmpty,
  AdminFilterChips,
  AdminPageHeader,
  AdminSearch,
} from "@/components/admin/AdminUi";

const BASE = "/admin/publicaciones";
const PAGE_SIZE = 150;

type AdminPublicacionesPageProps = {
  searchParams: Promise<{ estado?: string; q?: string }>;
};

export default async function AdminPublicacionesPage({ searchParams }: AdminPublicacionesPageProps) {
  const params = await searchParams;
  const filter = parseSoldFilter(params.estado);
  const q = (params.q ?? "").trim().slice(0, 100);
  const where: Prisma.ListingWhereInput = {
    ...soldWhere(filter),
    ...(q && {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } },
      ],
    }),
  };
  const [listings, matching, categoryNames, soldGroups] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        images: { take: 1 },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
    }),
    prisma.listing.count({ where }),
    getCategoryNames(),
    prisma.listing.groupBy({ by: ["sold"], _count: { _all: true } }),
  ]);
  const countFor = (sold: boolean) => soldGroups.find((g) => g.sold === sold)?._count._all ?? 0;
  const counts = soldCounts(countFor(false), countFor(true));
  const current = { q: q || undefined, estado: filter === "todas" ? undefined : filter };

  return (
    <div>
      <AdminPageHeader
        icon={Package}
        title="Publicaciones"
        description="Todas las figuras de la página. Puedes cambiarles la categoría, marcarlas como vendidas o eliminarlas."
      />
      <div className="mb-4 flex flex-col gap-3">
        <AdminSearch
          basePath={BASE}
          query={q}
          placeholder="Buscar por figura o vendedor"
          keep={{ estado: filter === "todas" ? undefined : filter }}
        />
        <AdminFilterChips
          basePath={BASE}
          param="estado"
          active={filter}
          current={current}
          label="Filtrar por estado"
          filters={SOLD_FILTERS.map((f) => ({ value: f.value, label: f.label, count: counts[f.value] }))}
        />
      </div>
      {q && (
        <p className="mb-3 text-sm text-muted-foreground">
          {matching === 0
            ? `Ninguna figura coincide con "${q}".`
            : `${matching} resultado${matching === 1 ? "" : "s"} para "${q}".`}
        </p>
      )}

      {listings.length === 0 ? (
        !q && (
          <AdminEmpty>
            {filter === "vendidas"
              ? "Todavía no hay figuras vendidas."
              : filter === "disponibles"
                ? "No hay figuras disponibles."
                : "Todavía no hay publicaciones."}
          </AdminEmpty>
        )
      ) : (
        <Card className="gap-0 divide-y divide-border py-0 shadow-sm">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="flex flex-col gap-3 p-4 transition hover:bg-primary/5 lg:flex-row lg:items-center lg:gap-4"
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {listing.images[0] ? (
                    <Image
                      src={listing.images[0].url}
                      alt={listing.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={listingPath(listing)}
                      className="line-clamp-1 text-sm font-medium text-foreground hover:underline"
                    >
                      {listing.title}
                    </Link>
                    {listing.sold && <Badge variant="secondary">Vendido</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{formatPrice(listing.price)}</p>
                  <p className="break-words text-xs text-muted-foreground">
                    Publicado por {listing.user.name} ({listing.user.email}) ·{" "}
                    <span className="inline-flex items-center gap-0.5">
                      <span aria-hidden="true">👁️</span>
                      {listing.views} {listing.views === 1 ? "vista" : "vistas"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <CategorySelect
                  listingId={listing.id}
                  category={listing.category}
                  categories={categoryNames}
                />
                <ToggleSoldButton listingId={listing.id} sold={listing.sold} />
                <DeleteListingButton listingId={listing.id} />
              </div>
            </div>
          ))}
        </Card>
      )}

      {matching > listings.length && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Se muestran las {listings.length} más recientes de {matching}. Usa el buscador para
          encontrar una figura en particular.
        </p>
      )}
    </div>
  );
}
