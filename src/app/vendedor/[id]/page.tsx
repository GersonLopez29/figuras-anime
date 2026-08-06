import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import StarRating from "@/components/StarRating";
import ReviewForm from "@/components/ReviewForm";
import DeleteReviewButton from "@/components/DeleteReviewButton";
import ListingCard from "@/components/ListingCard";

type VendedorPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: VendedorPageProps): Promise<Metadata> {
  const { id } = await params;
  const seller = await prisma.user.findUnique({ where: { id }, select: { name: true } });

  if (!seller) {
    return { title: "Vendedor no encontrado — FigurasAnime" };
  }

  const title = `${seller.name} — Perfil de vendedor | FigurasAnime`;
  const description = `Figuras de anime publicadas por ${seller.name} y sus reseñas como vendedor en FigurasAnime.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
  };
}

export default async function VendedorPage({ params }: VendedorPageProps) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  const seller = await prisma.user.findUnique({
    where: { id },
    include: {
      reviewsReceived: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      listings: {
        include: { images: { take: 1 } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!seller) {
    notFound();
  }

  const reviewCount = seller.reviewsReceived.length;
  const averageRating =
    reviewCount > 0
      ? seller.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0;

  const isOwnProfile = currentUser?.id === seller.id;

  const favoritedIds = currentUser
    ? new Set(
        (
          await prisma.favorite.findMany({
            where: {
              userId: currentUser.id,
              listingId: { in: seller.listings.map((l) => l.id) },
            },
            select: { listingId: true },
          })
        ).map((f) => f.listingId)
      )
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-zinc-900">{seller.name}</h1>
        <div className="mt-2">
          <StarRating rating={averageRating} reviewCount={reviewCount} size="md" />
        </div>
      </div>

      {seller.listings.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-zinc-900">
            Figuras publicadas por {seller.name}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {seller.listings.map((listing) => (
              <ListingCard
                key={listing.id}
                id={listing.id}
                title={listing.title}
                price={listing.price}
                discountAmount={listing.discountAmount}
                category={listing.category}
                imageUrl={listing.images[0]?.url}
                sold={listing.sold}
                views={listing.views}
                isFavorited={favoritedIds ? favoritedIds.has(listing.id) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900">Reseñas</h2>

        {!isOwnProfile && (
          <div className="mt-4">
            {currentUser ? (
              <ReviewForm sellerId={seller.id} />
            ) : (
              <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
                <Link href="/login" className="font-medium text-orange-600 hover:underline">
                  Inicia sesión
                </Link>{" "}
                para dejar una reseña.
              </p>
            )}
          </div>
        )}

        <div className="mt-6 space-y-4">
          {seller.reviewsReceived.length === 0 ? (
            <p className="text-sm text-zinc-400">Todavía no tiene reseñas.</p>
          ) : (
            seller.reviewsReceived.map((review) => (
              <div key={review.id} className="rounded-lg border border-zinc-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{review.author.name}</p>
                    <StarRating rating={review.rating} />
                  </div>
                  {currentUser?.id === review.authorId && (
                    <DeleteReviewButton reviewId={review.id} />
                  )}
                </div>
                <p className="mt-2 text-sm text-zinc-700">{review.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
