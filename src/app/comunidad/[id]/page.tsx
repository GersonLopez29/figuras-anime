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
      <Link href="/comunidad" className="text-sm text-zinc-500 hover:text-zinc-800">
        &larr; Volver a la comunidad
      </Link>

      <div className="mt-4 grid gap-8 sm:grid-cols-2">
        <ListingGallery images={post.images} title={post.caption} imageFit="contain" />

        <div>
          <p className="text-sm text-zinc-500">
            Publicado por{" "}
            <span className="font-medium text-zinc-900">{post.author.name}</span>
          </p>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-700">
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

          <div className="mt-3 flex items-center gap-4">
            {(isOwnPost || isAdmin(currentUser)) && (
              <DeletePostButton postId={post.id} />
            )}
            {currentUser && !isOwnPost && <ReportPostButton postId={post.id} />}
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-900">
          Comentarios ({post.comments.length})
        </h2>

        {currentUser ? (
          <div className="mt-4">
            <CommentForm postId={post.id} />
          </div>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
            <Link href="/login" className="font-medium text-orange-600 hover:underline">
              Inicia sesión
            </Link>{" "}
            para comentar.
          </p>
        )}

        <div className="mt-6 space-y-4">
          {post.comments.length === 0 ? (
            <p className="text-sm text-zinc-400">Todavía no hay comentarios.</p>
          ) : (
            post.comments.map((comment) => (
              <div key={comment.id} className="rounded-lg border border-zinc-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-900">{comment.author.name}</p>
                  {(currentUser?.id === comment.authorId || isAdmin(currentUser)) && (
                    <DeleteCommentButton commentId={comment.id} />
                  )}
                </div>
                <p className="mt-1 text-sm text-zinc-700">{comment.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
