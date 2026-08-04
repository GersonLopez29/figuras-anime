import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/format";

type ListingCardProps = {
  id: string;
  title: string;
  price: number;
  category: string;
  imageUrl?: string;
  sellerName?: string;
  sold?: boolean;
  views?: number;
};

export default function ListingCard({
  id,
  title,
  price,
  category,
  imageUrl,
  sellerName,
  sold,
  views,
}: ListingCardProps) {
  return (
    <Link
      href={`/figura/${id}`}
      className="group overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg"
    >
      <div className="relative aspect-square w-full bg-zinc-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className={`object-cover transition group-hover:scale-105 ${sold ? "grayscale" : ""}`}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            Sin imagen
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
          {category}
        </span>
        {sold && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="-rotate-12 rounded bg-zinc-900 px-3 py-1 text-sm font-extrabold uppercase tracking-wide text-white shadow-lg">
              Vendido
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-1 text-sm font-medium text-zinc-900">{title}</h3>
        <p className="mt-1 text-base font-bold text-orange-600">
          {formatPrice(price)}
        </p>
        <div className="mt-0.5 flex items-center justify-between gap-2">
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
