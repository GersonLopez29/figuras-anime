import Link from "next/link";
import Image from "next/image";
import { discountPercent, formatPrice, getFinalPrice } from "@/lib/format";
import { isNewCondition, isOpenBoxCondition } from "@/lib/condition";
import { getDeliveryZoneLabel, sortDeliveryZones } from "@/lib/delivery";
import { isFeatured } from "@/lib/featured";
import { OFFICIAL_STORE_NAME } from "@/lib/store";
import { listingPath } from "@/lib/slug";
import FavoriteButton from "@/components/FavoriteButton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ListingCardProps = {
  id: string;
  slug?: string | null;
  title: string;
  price: number;
  discountAmount?: number | null;
  category: string;
  condition?: string;
  imageUrl?: string;
  sellerName?: string;
  sold?: boolean;
  views?: number;
  deliveryZones?: string[];
  featuredUntil?: Date | null;
  isPreorder?: boolean;
  isReserved?: boolean;
  officialStore?: boolean;
  isFavorited?: boolean;
  realPhotos?: boolean;
  trustedSeller?: boolean;
};

export default function ListingCard({
  id,
  slug,
  title,
  price,
  discountAmount,
  category,
  condition,
  imageUrl,
  sellerName,
  sold,
  views,
  deliveryZones,
  featuredUntil,
  isPreorder,
  isReserved,
  officialStore,
  isFavorited,
  realPhotos,
  trustedSeller,
}: ListingCardProps) {
  const featured = !sold && isFeatured(featuredUntil);
  const finalPrice = getFinalPrice(price, discountAmount);
  const zones = sortDeliveryZones(deliveryZones ?? []).map(getDeliveryZoneLabel);
  const zoneSummary =
    zones.length === 0 ? null : zones.length === 1 ? zones[0] : `${zones[0]} +${zones.length - 1}`;
  const zoneTitle = zones.length > 0 ? `Entrega en: ${zones.join(", ")}` : undefined;
  const hasDiscount = !!discountAmount && !sold;
  const percentOff = hasDiscount ? discountPercent(price, discountAmount!) : 0;
  const conditionLabel = condition
    ? isNewCondition(condition)
      ? "Nueva"
      : isOpenBoxCondition(condition)
        ? "Open box"
        : "Usada"
    : null;
  // Sobre la foto van como máximo dos etiquetas: el estado más importante
  // (arriba) y el descuento (abajo). El resto va en una línea de texto.
  const statusBadge = sold
    ? null
    : featured
      ? { label: "⭐ Destacada", className: "bg-amber-400 text-amber-950" }
      : isPreorder
        ? { label: "🕒 Preventa", className: "bg-violet-600 text-white" }
        : isReserved
          ? { label: "🔖 Separada", className: "bg-sky-600 text-white" }
          : null;
  const details = [
    conditionLabel,
    featured && isPreorder && !sold ? "Preventa" : null,
    (featured || isPreorder) && isReserved && !sold ? "Separada" : null,
    realPhotos && !sold ? "📷 Foto real" : null,
  ].filter(Boolean) as string[];

  return (
    <Link
      href={listingPath({ id, slug: slug ?? null })}
      className="reveal group block h-full transition duration-300 ease-out hover:-translate-y-1"
    >
      <Card
        className={`h-full gap-0 overflow-hidden py-0 ring-1 transition group-hover:shadow-xl ${
          featured
            ? "ring-2 ring-amber-400 group-hover:ring-amber-500"
            : "ring-border group-hover:ring-primary/30"
        }`}
      >
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className={`object-cover transition duration-500 ease-out group-hover:scale-105 ${sold ? "grayscale" : ""}`}
              sizes="(min-width: 1280px) 240px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Sin imagen
            </div>
          )}
          {statusBadge && (
            <Badge className={`absolute left-2 top-2 shadow-sm ${statusBadge.className}`}>
              {statusBadge.label}
            </Badge>
          )}
          {hasDiscount && percentOff > 0 && (
            <Badge className="absolute bottom-2 left-2 bg-green-600 font-bold text-white shadow-sm">
              -{percentOff} %
            </Badge>
          )}
          {typeof isFavorited === "boolean" && (
            <FavoriteButton listingId={id} initialFavorited={isFavorited} />
          )}
          {sold && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 backdrop-blur-[1px]">
              <span className="rounded-full bg-zinc-900/90 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg ring-1 ring-white/20">
                Vendido
              </span>
            </div>
          )}
        </div>
        <CardContent className="flex flex-1 flex-col p-3">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-300">
            {category}
          </p>
          <h3 className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-foreground">
            {title}
          </h3>
          <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5">
            <span className="text-base font-bold text-primary sm:text-lg">
              {formatPrice(hasDiscount ? finalPrice : price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">{formatPrice(price)}</span>
            )}
          </p>
          {(details.length > 0 || zoneSummary) && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground" title={zoneTitle}>
              {details.join(" · ")}
              {zoneSummary && (
                <>
                  {details.length > 0 && " · "}
                  <span aria-hidden="true">📍</span> {zoneSummary}
                </>
              )}
            </p>
          )}
          {/* Empuja el vendedor al fondo para que todas las tarjetas de la fila
              terminen a la misma altura. */}
          <div aria-hidden="true" className="min-h-2 flex-1" />
          <div className="flex items-center justify-between gap-2 border-t border-border pt-1.5">
            {officialStore ? (
              <p className="truncate text-xs font-semibold text-orange-700 dark:text-orange-300">✔ {OFFICIAL_STORE_NAME}</p>
            ) : (
              sellerName && (
                <p className="truncate text-xs text-muted-foreground">
                  {sellerName}
                  {trustedSeller && (
                    <span className="ml-1" title="Vendedor confiable" aria-label="Vendedor confiable">
                      🏅
                    </span>
                  )}
                </p>
              )
            )}
            {typeof views === "number" && (
              <span className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground">
                <span aria-hidden="true">👁️</span>
                {views}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
