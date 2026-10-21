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
import SalesBadge from "@/components/SalesBadge";
import { countQualifyingSales } from "@/lib/sellerRewards";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";

type VendedorPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: VendedorPageProps): Promise<Metadata> {
  const { id } = await params;
  const seller = await prisma.user.findUnique({
    where: { id },
    select: {
      name: true,
      isBlocked: true,
      _count: { select: { listings: { where: { sold: false } } } },
    },
  });

  if (!seller) {
    return { title: "Vendedor no encontrado — GerStore" };
  }

  const available = seller._count.listings;
  const title = `${seller.name} — Perfil de vendedor | GerStore`;
  const description =
    available > 0
      ? `${available} ${available === 1 ? "figura de anime disponible" : "figuras de anime disponibles"} de ${seller.name} en Lima, con sus reseñas como vendedor en GerStore.`
      : `Perfil de ${seller.name} en GerStore, el marketplace de figuras de anime en Perú.`;

  return {
    title,
    description,
    alternates: { canonical: `/vendedor/${id}` },
    openGraph: { title, description, type: "profile" },
    // Sin figuras disponibles el perfil no aporta nada en Google (página casi
    // vacía): se sigue viendo y compartiendo, pero no se indexa.
    ...(available === 0 || seller.isBlocked ? { robots: { index: false, follow: true } } : {}),
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
  const [trust, badgeSales] = await Promise.all([
    getTrustProgress(seller.id),
    countQualifyingSales(seller.id),
  ]);

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
        <Avatar className="h-16 w-16 ring-1 ring-orange-100 dark:ring-orange-800">
          <AvatarFallback className="bg-gradient-to-br from-orange-100 dark:from-orange-900/40 to-red-50 dark:to-red-950/20 text-2xl font-bold text-orange-700">
            {seller.name.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{seller.name}</h1>
          {seller.isOfficialStore && (
            <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">✔ {OFFICIAL_STORE_NAME}</p>
          )}
          {(trust?.trusted || badgeSales > 0) && (
            <div className="mt-1">
              <div className="flex flex-wrap gap-1.5">
                {trust?.trusted && <TrustedSellerBadge size="md" />}
                <SalesBadge sales={badgeSales} size="md" />
              </div>
              {trust?.trusted && (
                <p className="mt-1 text-xs text-muted-foreground">{TRUSTED_SELLER_EXPLANATION}</p>
              )}
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
