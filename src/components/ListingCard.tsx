import Link from "next/link";
import Image from "next/image";
import { formatPrice, getFinalPrice } from "@/lib/format";
import { isNewCondition, isOpenBoxCondition } from "@/lib/condition";
import FavoriteButton from "@/components/FavoriteButton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ListingCardProps = {
  id: string;
  title: string;
  price: number;
  discountAmount?: number | null;
  category: string;
  condition?: string;
  imageUrl?: string;
  sellerName?: string;
  sold?: boolean;
  views?: number;
  isFavorited?: boolean;
};

export default function ListingCard({
  id,
  title,
  price,
  discountAmount,
  category,
  condition,
  imageUrl,
  sellerName,
  sold,
  views,
  isFavorited,
}: ListingCardProps) {
  const finalPrice = getFinalPrice(price, discountAmount);
  const hasDiscount = !!discountAmount && !sold;
  return (
    <Link href={`/figura/${id}`} className="group block transition hover:-translate-y-1">
      <Card className="gap-0 overflow-hidden py-0 ring-1 ring-border transition group-hover:shadow-xl group-hover:ring-primary/30">
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className={`object-cover transition duration-300 group-hover:scale-105 ${sold ? "grayscale" : ""}`}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Sin imagen
            </div>
          )}
          <Badge className="absolute left-2 top-2 bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-sm">
            {category}
          </Badge>
          {hasDiscount && (
            <Badge className="absolute left-2 bottom-2 bg-green-600 text-white shadow-sm">
              🏷️ Oferta
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
        <CardContent className="p-3">
          <h3 className="line-clamp-1 text-sm font-medium text-foreground">{title}</h3>
          {condition && (
            <Badge variant="outline" className="mt-1.5 border-blue-200 bg-blue-50 text-blue-700">
              {isNewCondition(condition)
                ? "🆕 Nueva"
                : isOpenBoxCondition(condition)
                  ? "📦 Open box"
                  : "♻️ Usada"}
            </Badge>
          )}
          {hasDiscount ? (
            <p className="mt-1.5 flex flex-wrap items-baseline gap-1.5">
              <span className="text-xs text-muted-foreground line-through">{formatPrice(price)}</span>
              <span className="text-base font-bold text-green-700 sm:text-lg">{formatPrice(finalPrice)}</span>
            </p>
          ) : (
            <p className="mt-1.5 text-base font-bold text-primary sm:text-lg">{formatPrice(price)}</p>
          )}
          <div className="mt-1 flex items-center justify-between gap-2 border-t border-border pt-1.5">
            {sellerName && (
              <p className="truncate text-xs text-muted-foreground">Vende: {sellerName}</p>
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
