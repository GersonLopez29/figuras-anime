import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import StarRating from "@/components/StarRating";
import ReviewForm from "@/components/ReviewForm";
import DeleteReviewButton from "@/components/DeleteReviewButton";
import ListingCard from "@/components/ListingCard";
import { OFFICIAL_STORE_NAME } from "@/lib/store";
import { cardInclude, toCardProps } from "@/lib/listingCard";
import { getTrustProgress } from "@/lib/trust";
import TrustedSellerBadge, { TRUSTED_SELLER_EXPLANATION } from "@/components/TrustedSellerBadge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    select: {
      id: true,
      name: true,
      createdAt: true,
      isOfficialStore: true,
      reviewsReceived: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rating: true,
          comment: true,
          authorId: true,
          author: { select: { name: true } },
        },
      },
      listings: {
        // Primero las disponibles, después las vendidas.
        orderBy: [{ sold: "asc" }, { createdAt: "desc" }],
        include: cardInclude,
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
  const trust = await getTrustProgress(seller.id);

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

  const memberSince = seller.createdAt.toLocaleDateString("es-PE", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Card className="flex-row items-center gap-4 p-6">
        <Avatar className="h-16 w-16 ring-1 ring-orange-100">
          <AvatarFallback className="bg-gradient-to-br from-orange-100 to-red-50 text-2xl font-bold text-orange-700">
            {seller.name.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{seller.name}</h1>
          {seller.isOfficialStore && (
            <p className="text-sm font-semibold text-orange-700">✔ {OFFICIAL_STORE_NAME}</p>
          )}
          {trust?.trusted && (
            <div className="mt-1">
              <TrustedSellerBadge size="md" />
              <p className="mt-1 text-xs text-muted-foreground">{TRUSTED_SELLER_EXPLANATION}</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Miembro desde {memberSince}
            {trust && trust.sales > 0 && ` · ${trust.sales} ${trust.sales === 1 ? "figura vendida" : "figuras vendidas"}`}
          </p>
          <div className="mt-1.5">
            <StarRating rating={averageRating} reviewCount={reviewCount} size="md" />
          </div>
        </div>
      </Card>

      {seller.listings.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">
            Figuras publicadas por {seller.name}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {seller.listings.map((listing) => (
              <ListingCard
                key={listing.id}
                {...toCardProps(listing, trust?.trusted ? new Set([seller.id]) : undefined)}
                sellerName={undefined}
                isFavorited={favoritedIds ? favoritedIds.has(listing.id) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">Reseñas</h2>

        {!isOwnProfile && (
          <div className="mt-4">
            {currentUser ? (
              <ReviewForm sellerId={seller.id} />
            ) : (
              <Alert>
                <AlertDescription>
                  <Link href="/login" className="font-medium text-primary hover:underline">
                    Inicia sesión
                  </Link>{" "}
                  para dejar una reseña.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="mt-6 space-y-4">
          {seller.reviewsReceived.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no tiene reseñas.</p>
          ) : (
            seller.reviewsReceived.map((review) => (
              <Card key={review.id} className="flex-row gap-3 p-4">
                <Avatar className="shrink-0">
                  <AvatarFallback>{review.author.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{review.author.name}</p>
                      <StarRating rating={review.rating} />
                    </div>
                    {currentUser?.id === review.authorId && (
                      <DeleteReviewButton reviewId={review.id} />
                    )}
                  </div>
                  <p className="mt-2 text-sm text-foreground/80">{review.comment}</p>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
