import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/session";
import { getCategories } from "@/lib/categories";
import { formatPrice } from "@/lib/format";
import { categoryPath } from "@/lib/slug";
import { wantedActiveSince, WANTED_ACTIVE_DAYS } from "@/lib/wanted";
import WantedPostForm from "@/components/WantedPostForm";
import WantedPostActions from "@/components/WantedPostActions";
import WantedContactButton from "@/components/WantedContactButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Se busca: figuras de anime que buscan los coleccionistas — FigurasAnime",
  description:
    "Coleccionistas de Perú publican las figuras de anime que buscan. Si tienes una, escríbeles por WhatsApp y véndela.",
  alternates: { canonical: "/se-busca" },
};

const PAGE_LIMIT = 60;

function timeAgo(date: Date, now: Date): string {
  const days = Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  return `hace ${days} días`;
}

export default async function SeBuscaPage() {
  const user = await getCurrentUser();
  const admin = isAdmin(user);
  const now = new Date();
  const since = wantedActiveSince(now);

  const [posts, myPosts, categories] = await Promise.all([
    prisma.wantedPost.findMany({
      where: { status: "open", createdAt: { gte: since }, user: { isBlocked: false } },
      select: {
        id: true,
        title: true,
        details: true,
        maxPrice: true,
        category: true,
        createdAt: true,
        userId: true,
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_LIMIT,
    }),
    user
      ? prisma.wantedPost.findMany({
          where: { userId: user.id, OR: [{ status: "found" }, { createdAt: { lt: since } }] },
          select: { id: true, title: true, status: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        })
      : Promise.resolve([]),
    getCategories(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold text-foreground">🔎 Se busca</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Coleccionistas que buscan una figura en particular. ¿Tienes alguna? Escríbeles por WhatsApp
        y véndela. ¿Buscas una tú? Publícala y te avisamos cuando aparezca.
      </p>
      <Button
        render={<a href="#publicar" />}
        nativeButton={false}
        variant="outline"
        className="mt-4 rounded-full lg:hidden"
      >
        🔎 Publicar lo que busco
      </Button>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <section>
          <h2 className="text-lg font-semibold text-foreground">
            Pedidos abiertos <span className="text-sm font-normal text-muted-foreground">({posts.length})</span>
          </h2>
          {posts.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Todavía no hay pedidos. ¡Sé el primero en publicar lo que buscas!
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {posts.map((post) => {
                const isOwner = user?.id === post.userId;
                return (
                  <li key={post.id}>
                    <Card className="gap-2 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground">{post.title}</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {post.maxPrice !== null && (
                            <Badge variant="outline" className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300">
                              Hasta {formatPrice(post.maxPrice)}
                            </Badge>
                          )}
                          {post.category && (
                            <Badge variant="secondary" render={<Link href={categoryPath(post.category)} />}>
                              {post.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {post.details && (
                        <p className="whitespace-pre-line text-sm text-foreground/80">{post.details}</p>
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <p className="text-xs text-muted-foreground">
                          Busca: <span className="font-medium text-foreground/80">{post.user.name}</span> ·{" "}
                          {timeAgo(post.createdAt, now)}
                        </p>
                        {isOwner ? (
                          <WantedPostActions postId={post.id} canMarkFound />
                        ) : user ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <WantedContactButton postId={post.id} />
                            {admin && <WantedPostActions postId={post.id} />}
                          </div>
                        ) : (
                          <Link
                            href="/login"
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Inicia sesión para responder
                          </Link>
                        )}
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside id="publicar" className="scroll-mt-24">
          <Card className="gap-4 p-5 shadow-sm">
            <h2 className="font-semibold text-foreground">Publica lo que buscas</h2>
            {user ? (
              user.emailVerified ? (
                <WantedPostForm categories={categories} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Confirma tu correo (revisa tu bandeja) para publicar pedidos.
                </p>
              )
            ) : (
              <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                <p>
                  Para publicar un pedido necesitas una cuenta gratis: así los vendedores pueden
                  escribirte por WhatsApp.
                </p>
                <Button render={<Link href="/registro" />} nativeButton={false} className="rounded-full">
                  Crear cuenta
                </Button>
                <p>
                  ¿Solo quieres que te avisemos por correo?{" "}
                  <Link href="/avisame" className="font-medium text-primary hover:underline">
                    Usa Avísame
                  </Link>
                  , sin registrarte.
                </p>
              </div>
            )}
          </Card>

          {myPosts.length > 0 && (
            <div className="mt-4 rounded-lg bg-muted/50 p-4 text-sm">
              <p className="font-semibold text-foreground">Tus pedidos cerrados</p>
              <ul className="mt-2 space-y-2">
                {myPosts.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-muted-foreground">
                      {p.status === "found" ? "✅" : "⌛"} {p.title}
                    </span>
                    <WantedPostActions postId={p.id} />
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                Los pedidos se muestran {WANTED_ACTIVE_DAYS} días. Si sigues buscando, publícalo de nuevo.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
