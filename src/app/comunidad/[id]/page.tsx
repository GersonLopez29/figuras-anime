import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/session";
import ListingGallery from "@/components/ListingGallery";
import PostRatingWidget from "@/components/PostRatingWidget";
import CommentForm from "@/components/CommentForm";
import DeleteCommentButton from "@/components/DeleteCommentButton";
import DeletePostButton from "@/components/DeletePostButton";
import ReportPostButton from "@/components/ReportPostButton";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ComunidadDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ComunidadDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await prisma.collectionPost.findUnique({
    where: { id },
    select: {
      caption: true,
      author: { select: { name: true } },
      images: { take: 1, select: { url: true } },
    },
  });

  if (!post) {
    return { title: "Publicación no encontrada — FigurasAnime" };
  }

  const title = `${post.author.name} en Comunidad | FigurasAnime`;
  const description = post.caption.slice(0, 155);
  const image = post.images[0]?.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ComunidadDetailPage({ params }: ComunidadDetailPageProps) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  const post = await prisma.collectionPost.findUnique({
    where: { id },
    include: {
      images: true,
      author: { select: { id: true, name: true } },
      ratings: true,
      comments: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!post) {
    notFound();
  }

  const ratingCount = post.ratings.length;
  const averageRating =
    ratingCount > 0 ? post.ratings.reduce((sum, r) => sum + r.value, 0) / ratingCount : 0;
  const userRating = currentUser
    ? post.ratings.find((r) => r.authorId === currentUser.id)?.value ?? null
    : null;
  const isOwnPost = currentUser?.id === post.author.id;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/comunidad" className="text-sm text-muted-foreground hover:text-foreground">
        &larr; Volver a la comunidad
      </Link>

      <div className="mt-4 grid gap-8 sm:grid-cols-2">
        <ListingGallery images={post.images} title={post.caption} imageFit="contain" />

        <Card className="p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <Avatar size="lg" className="ring-1 ring-fuchsia-100">
              <AvatarFallback className="bg-gradient-to-br from-fuchsia-100 to-orange-50 font-bold text-fuchsia-700">
                {post.author.name.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm text-muted-foreground">
              Publicado por{" "}
              <span className="font-medium text-foreground">{post.author.name}</span>
            </p>
          </div>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
            {post.caption}
          </p>

          <div className="mt-4">
            <PostRatingWidget
              postId={post.id}
              averageRating={averageRating}
              ratingCount={ratingCount}
              canRate={!!currentUser && !isOwnPost}
              initialUserValue={userRating}
            />
          </div>

          <div className="mt-4 flex items-center gap-4 border-t border-border pt-4">
            {(isOwnPost || isAdmin(currentUser)) && (
              <DeletePostButton postId={post.id} />
            )}
            {currentUser && !isOwnPost && <ReportPostButton postId={post.id} />}
          </div>
        </Card>
      </div>

      <Card className="mt-10 p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">
          Comentarios ({post.comments.length})
        </h2>

        {currentUser ? (
          <div className="mt-4">
            <CommentForm postId={post.id} />
          </div>
        ) : (
          <Alert className="mt-4">
            <AlertDescription>
              <Link href="/login" className="font-medium text-primary hover:underline">
                Inicia sesión
              </Link>{" "}
              para comentar.
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-6 space-y-3">
          {post.comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay comentarios.</p>
          ) : (
            post.comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 rounded-lg border border-border bg-muted/40 p-3">
                <Avatar className="shrink-0">
                  <AvatarFallback>{comment.author.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{comment.author.name}</p>
                    {(currentUser?.id === comment.authorId || isAdmin(currentUser)) && (
                      <DeleteCommentButton commentId={comment.id} />
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-foreground/80">{comment.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
