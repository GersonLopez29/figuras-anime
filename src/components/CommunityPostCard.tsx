import Link from "next/link";
import Image from "next/image";
import StarRating from "@/components/StarRating";

type CommunityPostCardProps = {
  id: string;
  caption: string;
  imageUrl?: string;
  authorName: string;
  averageRating: number;
  ratingCount: number;
  commentCount: number;
};

export default function CommunityPostCard({
  id,
  caption,
  imageUrl,
  authorName,
  averageRating,
  ratingCount,
  commentCount,
}: CommunityPostCardProps) {
  return (
    <Link
      href={`/comunidad/${id}`}
      className="group overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={caption}
            fill
            className="object-contain transition duration-300 group-hover:scale-105"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            Sin imagen
          </div>
        )}
        <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-zinc-600 shadow-sm backdrop-blur">
          💬 {commentCount}
        </span>
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm text-zinc-800">{caption}</p>
        <p className="mt-1 text-xs text-zinc-400">Por {authorName}</p>
        <div className="mt-2 border-t border-zinc-100 pt-1.5">
          <StarRating rating={averageRating} reviewCount={ratingCount} label="calificación" />
        </div>
      </div>
    </Link>
  );
}
