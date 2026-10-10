import Link from "next/link";
import Image from "next/image";
import StarRating from "@/components/StarRating";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <Link href={`/comunidad/${id}`} className="group block transition hover:-translate-y-1">
      <Card className="gap-0 overflow-hidden py-0 ring-1 ring-border transition group-hover:shadow-xl group-hover:ring-primary/30">
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={caption}
              fill
              className="object-contain transition duration-300 group-hover:scale-105"
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Sin imagen
            </div>
          )}
          <Badge
            variant="secondary"
            className="absolute right-2 bottom-2 gap-1 bg-card/90 shadow-sm backdrop-blur"
          >
            💬 {commentCount}
          </Badge>
        </div>
        <CardContent className="p-3">
          <p className="line-clamp-2 text-sm text-foreground/90">{caption}</p>
          <p className="mt-1 text-xs text-muted-foreground">Por {authorName}</p>
          <div className="mt-2 border-t border-border pt-1.5">
            <StarRating rating={averageRating} reviewCount={ratingCount} label="calificación" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
