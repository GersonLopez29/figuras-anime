import Link from "next/link";
import { prisma } from "@/lib/db";
import CommunityPostCard from "@/components/CommunityPostCard";

export default async function ComunidadPage() {
  const posts = await prisma.collectionPost.findMany({
    include: {
      images: { take: 1 },
      author: { select: { name: true } },
      ratings: { select: { value: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Comunidad</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Muestra tu colección, comenta las de otros y califícalas con estrellas.
          </p>
        </div>
        <Link
          href="/comunidad/publicar"
          className="inline-block shrink-0 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
        >
          Publicar mi colección
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="mt-16 text-center text-sm text-zinc-400">
          Todavía no hay publicaciones. ¡Sé el primero en mostrar tu colección!
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {posts.map((post) => {
            const ratingCount = post.ratings.length;
            const averageRating =
              ratingCount > 0
                ? post.ratings.reduce((sum, r) => sum + r.value, 0) / ratingCount
                : 0;

            return (
              <CommunityPostCard
                key={post.id}
                id={post.id}
                caption={post.caption}
                imageUrl={post.images[0]?.url}
                authorName={post.author.name}
                averageRating={averageRating}
                ratingCount={ratingCount}
                commentCount={post._count.comments}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
