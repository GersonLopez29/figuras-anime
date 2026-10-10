import Link from "next/link";
import { prisma } from "@/lib/db";
import CommunityPostCard from "@/components/CommunityPostCard";
import { Button } from "@/components/ui/button";

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
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 dark:from-orange-950/40 via-orange-50 dark:via-orange-950/30 to-amber-50 dark:to-amber-950/20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-200/40 dark:bg-orange-500/10 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-block rounded-full bg-card/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-300 shadow-sm ring-1 ring-orange-200 dark:ring-orange-800">
                🎏 Comunidad
              </p>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Comunidad de coleccionistas
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Muestra tu colección, comenta las de otros y califícalas con estrellas.
              </p>
            </div>
            <Button
              render={<Link href="/comunidad/publicar" />}
              nativeButton={false}
              size="lg"
              className="shrink-0 rounded-full"
            >
              Publicar mi colección
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8">

      {posts.length === 0 ? (
        <p className="mt-16 text-center text-sm text-muted-foreground">
          Todavía no hay publicaciones. ¡Sé el primero en mostrar tu colección!
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
