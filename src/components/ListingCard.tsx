import Link from "next/link";
import Image from "next/image";
import { formatPrice, getFinalPrice } from "@/lib/format";
import { isNewCondition, isOpenBoxCondition } from "@/lib/condition";
import FavoriteButton from "@/components/FavoriteButton";

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
    <Link
      href={`/figura/${id}`}
      className="group overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className={`object-cover transition duration-300 group-hover:scale-105 ${sold ? "grayscale" : ""}`}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            Sin imagen
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-gradient-to-r from-red-600 to-orange-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
          {category}
        </span>
        {hasDiscount && (
          <span className="absolute left-2 bottom-2 flex items-center gap-1 rounded-full bg-green-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            🏷️ Oferta
          </span>
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
      <div className="p-3">
        <h3 className="line-clamp-1 text-sm font-medium text-zinc-900">{title}</h3>
        {condition && (
          <span className="mt-1.5 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
            {isNewCondition(condition)
              ? "🆕 Nueva"
              : isOpenBoxCondition(condition)
                ? "📦 Open box"
                : "♻️ Usada"}
          </span>
        )}
        {hasDiscount ? (
          <p className="mt-1.5 flex flex-wrap items-baseline gap-1.5">
            <span className="text-xs text-zinc-400 line-through">{formatPrice(price)}</span>
            <span className="text-base font-bold text-green-700 sm:text-lg">{formatPrice(finalPrice)}</span>
          </p>
        ) : (
          <p className="mt-1.5 text-base font-bold text-orange-600 sm:text-lg">{formatPrice(price)}</p>
        )}
        <div className="mt-1 flex items-center justify-between gap-2 border-t border-zinc-100 pt-1.5">
          {sellerName && (
            <p className="truncate text-xs text-zinc-400">Vende: {sellerName}</p>
          )}
          {typeof views === "number" && (
            <span className="flex shrink-0 items-center gap-0.5 text-xs text-zinc-400">
              <span aria-hidden="true">👁️</span>
              {views}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
