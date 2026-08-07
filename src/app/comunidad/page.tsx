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
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-fuchsia-50 via-orange-50 to-orange-50">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-fuchsia-200/30 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-block rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-fuchsia-600 shadow-sm ring-1 ring-fuchsia-100">
                🎏 Comunidad
              </p>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
                Comunidad de coleccionistas
              </h1>
              <p className="mt-1 text-sm text-zinc-600">
                Muestra tu colección, comenta las de otros y califícalas con estrellas.
              </p>
            </div>
            <Link
              href="/comunidad/publicar"
              className="inline-block shrink-0 rounded-full bg-orange-600 px-5 py-2.5 text-center text-sm font-bold text-white shadow-md shadow-orange-600/20 transition hover:-translate-y-0.5 hover:bg-orange-700 hover:shadow-lg"
            >
              Publicar mi colección
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">

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
    </div>
  );
}
