import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { formatPrice, getFinalPrice, getActiveDiscountAmount, getDaysRemaining } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { getConditionLabel, getConditionIcon } from "@/lib/condition";
import ListingGallery from "@/components/ListingGallery";
import StarRating from "@/components/StarRating";
import FavoriteButton from "@/components/FavoriteButton";
import MessageButton from "@/components/MessageButton";
import WhatsAppContactButton from "@/components/WhatsAppContactButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";

type FiguraPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: FiguraPageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      title: true,
      description: true,
      price: true,
      images: { take: 1, select: { url: true } },
    },
  });

  if (!listing) {
    return { title: "Figura no encontrada — FigurasAnime" };
  }

  const title = `${listing.title} — ${formatPrice(listing.price)} | FigurasAnime`;
  const description = listing.description.slice(0, 155);
  const image = listing.images[0]?.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
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

// cache() evita que un doble-render de este Server Component (algo que
// Next.js puede hacer en la misma petición) cuente la visita dos veces.
const getListingAndRegisterView = cache(async (id: string, viewerId: string | null) => {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: true,
      user: { select: { id: true, name: true, whatsapp: true } },
    },
  });

  if (!listing) return null;

  let views = listing.views;
  if (viewerId !== listing.userId) {
    const updated = await prisma.listing.update({
      where: { id: listing.id },
      data: { views: { increment: 1 } },
      select: { views: true },
    });
    views = updated.views;
  }

  return { listing, views };
});

export default async function FiguraPage({ params }: FiguraPageProps) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  const result = await getListingAndRegisterView(id, currentUser?.id ?? null);
  if (!result) {
    notFound();
  }
  const { listing, views } = result;

  const ratingAgg = await prisma.review.aggregate({
    where: { sellerId: listing.user.id },
    _avg: { rating: true },
    _count: true,
  });
  const averageRating = ratingAgg._avg.rating ?? 0;
  const reviewCount = ratingAgg._count;

  const message = `Hola ${listing.user.name}, vi tu figura "${listing.title}" en FigurasAnime y me interesa. ¿Sigue disponible?`;
  const whatsappLink = currentUser
    ? buildWhatsAppLink(listing.user.whatsapp, message)
    : null;

  const isFavorited = currentUser
    ? !!(await prisma.favorite.findUnique({
        where: { userId_listingId: { userId: currentUser.id, listingId: listing.id } },
      }))
    : false;

  const activeDiscount = getActiveDiscountAmount(listing.discountAmount, listing.discountExpiresAt);
  const discountDaysRemaining = getDaysRemaining(listing.discountExpiresAt);
  const discountExpiresLabel = listing.discountExpiresAt
    ? new Date(listing.discountExpiresAt).toLocaleDateString("es-PE", {
        day: "numeric",
        month: "long",
      })
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        &larr; Volver al catálogo
      </Link>

      <div className="mt-4 grid gap-8 sm:grid-cols-2">
        <ListingGallery images={listing.images} title={listing.title} />

        <Card className="p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{listing.category}</Badge>
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
              {getConditionIcon(listing.condition)} {getConditionLabel(listing.condition)}
            </Badge>
            {!listing.sold && !!activeDiscount && (
              <Badge className="bg-green-600 text-white">Oferta</Badge>
            )}
            {listing.sold && <Badge variant="secondary">Vendido</Badge>}
          </div>

          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <span aria-hidden="true">👁️</span>
            {views} {views === 1 ? "vista" : "vistas"}
          </div>

          <div className="mt-3 flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-foreground">{listing.title}</h1>
            {currentUser && (
              <FavoriteButton
                listingId={listing.id}
                initialFavorited={isFavorited}
                variant="inline"
              />
            )}
          </div>
          {!listing.sold && activeDiscount ? (
            <p className="mt-2 flex items-baseline gap-2">
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(listing.price)}
              </span>
              <span className="text-3xl font-bold text-green-700">
                {formatPrice(getFinalPrice(listing.price, activeDiscount))}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-3xl font-bold text-primary">
              {formatPrice(listing.price)}
            </p>
          )}

          {!listing.sold && activeDiscount && (
            <Alert className="mt-3 border-green-200 bg-green-50 text-green-800">
              <AlertDescription className="flex items-center gap-2 text-green-800">
                <span aria-hidden="true">⏰</span>
                <span>
                  Oferta por tiempo limitado: válida hasta el {discountExpiresLabel} (
                  {discountDaysRemaining} {discountDaysRemaining === 1 ? "día" : "días"} restante
                  {discountDaysRemaining === 1 ? "" : "s"}).
                </span>
              </AlertDescription>
            </Alert>
          )}

          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
            {listing.description}
          </p>

          <Link
            href={`/vendedor/${listing.user.id}`}
            className="mt-4 flex items-center gap-3 rounded-xl border border-border p-3 transition hover:border-primary/40 hover:bg-primary/5"
          >
            <Avatar size="lg" className="ring-1 ring-orange-100">
              <AvatarFallback className="bg-gradient-to-br from-orange-100 to-red-50 font-bold text-orange-700">
                {listing.user.name.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-muted-foreground">
                Vendido por{" "}
                <span className="font-medium text-foreground">{listing.user.name}</span>
              </p>
              <div className="mt-0.5">
                <StarRating rating={averageRating} reviewCount={reviewCount} />
              </div>
            </div>
          </Link>

          {listing.sold ? (
            <Alert className="mt-6 text-center">
              <AlertDescription className="justify-center text-center font-medium">
                Este producto ya fue vendido.
              </AlertDescription>
            </Alert>
          ) : whatsappLink ? (
            <div className="mt-6">
              <WhatsAppContactButton listingId={listing.id} whatsappLink={whatsappLink} />
              {currentUser && currentUser.id !== listing.user.id && (
                <MessageButton listingId={listing.id} />
              )}
            </div>
          ) : (
            <Alert className="mt-6 text-center">
              <AlertDescription className="justify-center text-center">
                Inicia sesión para contactar al vendedor por WhatsApp.
              </AlertDescription>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button render={<Link href="/login" />} nativeButton={false} className="rounded-full">
                  Iniciar sesión
                </Button>
                <Button
                  render={<Link href="/registro" />}
                  nativeButton={false}
                  variant="outline"
                  className="rounded-full"
                >
                  Crear cuenta
                </Button>
              </div>
            </Alert>
          )}
        </Card>
      </div>
    </div>
  );
}
