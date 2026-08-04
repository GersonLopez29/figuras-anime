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
      className="group overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg"
    >
      <div className="relative aspect-square w-full bg-zinc-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={caption}
            fill
            className="object-contain transition group-hover:scale-105"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            Sin imagen
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm text-zinc-800">{caption}</p>
        <p className="mt-1 text-xs text-zinc-400">Por {authorName}</p>
        <div className="mt-2 flex items-center justify-between">
          <StarRating rating={averageRating} reviewCount={ratingCount} label="calificación" />
          <span className="text-xs text-zinc-400">💬 {commentCount}</span>
        </div>
      </div>
    </Link>
  );
}
