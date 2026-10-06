import Link from "next/link";
import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { formatPrice, getFinalPrice, getActiveDiscountAmount, getDaysRemaining } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { getConditionLabel, getConditionIcon, isNewCondition } from "@/lib/condition";
import ListingGallery from "@/components/ListingGallery";
import ListingCard from "@/components/ListingCard";
import { categoryPath, listingPath } from "@/lib/slug";
import { resolveListingParam } from "@/lib/listingSlug";
import { cardInclude, toCardProps } from "@/lib/listingCard";
import { formatArrival } from "@/lib/preorder";
import { getActiveReservation, formatReservationDate } from "@/lib/reservation";
import { isFeatured } from "@/lib/featured";
import { OFFICIAL_STORE_NAME } from "@/lib/store";
import { getDeliveryZoneLabel, sortDeliveryZones } from "@/lib/delivery";
import StarRating from "@/components/StarRating";
import FavoriteButton from "@/components/FavoriteButton";
import ShareButton from "@/components/ShareButton";
import MessageButton from "@/components/MessageButton";
import WhatsAppContactButton from "@/components/WhatsAppContactButton";
import StoryShareButton from "@/components/StoryShareButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gerstore.club";

type FiguraPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: FiguraPageProps): Promise<Metadata> {
  const { slug: param } = await params;
  const resolved = await resolveListingParam(param);
  if (!resolved) {
    return { title: "Figura no encontrada — FigurasAnime" };
  }
  const id = resolved.id;
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      price: true,
      discountAmount: true,
      discountExpiresAt: true,
    },
  });

  if (!listing) {
    return { title: "Figura no encontrada — FigurasAnime" };
  }

  const activeDiscount = getActiveDiscountAmount(listing.discountAmount, listing.discountExpiresAt);
  const displayPrice = activeDiscount ? getFinalPrice(listing.price, activeDiscount) : listing.price;
  const title = `${listing.title} — ${formatPrice(displayPrice)} | FigurasAnime`;
  const description = listing.description.slice(0, 155);

  // La imagen de vista previa la generan opengraph-image.tsx y twitter-image.tsx
  // (foto + precio + estado + marca), que tienen prioridad sobre este objeto.
  return {
    title,
    description,
    alternates: { canonical: listingPath(listing) },
    openGraph: { title, description, type: "website", url: listingPath(listing) },
    twitter: { card: "summary_large_image", title, description },
  };
}

// cache() evita que un doble-render de este Server Component (algo que
// Next.js puede hacer en la misma petición) cuente la visita dos veces.
const getListingAndRegisterView = cache(async (id: string, viewerId: string | null) => {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: true,
      user: {
        select: { id: true, name: true, createdAt: true, isOfficialStore: true },
      },
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
  const { slug: param } = await params;

  // Los enlaces anteriores (/figura/<id>, /figura/<nombre>-<id> o con un título
  // anterior) redirigen al enlace actual, antes de contar la visita.
  const resolved = await resolveListingParam(param);
  if (!resolved) {
    notFound();
  }
  if (!resolved.isCanonical) {
    permanentRedirect(listingPath(resolved));
  }
  const id = resolved.id;

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
  const memberSince = listing.user.createdAt.toLocaleDateString("es-PE", {
    month: "long",
    year: "numeric",
  });

  // "Más de este vendedor" y "Figuras similares" (misma categoría) para que el
  // comprador siga explorando en vez de salir de la página.
  const RELATED_LIMIT = 4;
  const sellerListings = await prisma.listing.findMany({
    where: { userId: listing.user.id, sold: false, id: { not: listing.id } },
    include: cardInclude,
    orderBy: { createdAt: "desc" },
    take: RELATED_LIMIT,
  });
  const similarListings = await prisma.listing.findMany({
    where: {
      category: listing.category,
      sold: false,
      id: { notIn: [listing.id, ...sellerListings.map((l) => l.id)] },
    },
    include: cardInclude,
    orderBy: { createdAt: "desc" },
    take: RELATED_LIMIT,
  });


  const isFavorited = currentUser
    ? !!(await prisma.favorite.findUnique({
        where: { userId_listingId: { userId: currentUser.id, listingId: listing.id } },
      }))
    : false;

  const activeDiscount = getActiveDiscountAmount(listing.discountAmount, listing.discountExpiresAt);
  const reservation = listing.sold
    ? null
    : getActiveReservation(listing.reservedAmount, listing.reservedUntil);
  const totalPrice = activeDiscount ? getFinalPrice(listing.price, activeDiscount) : listing.price;
  const discountDaysRemaining = getDaysRemaining(listing.discountExpiresAt);
  const discountExpiresLabel = listing.discountExpiresAt
    ? new Date(listing.discountExpiresAt).toLocaleDateString("es-PE", {
        day: "numeric",
        month: "long",
      })
    : null;

  const pageUrl = `${SITE_URL}${listingPath(listing)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: listing.description,
    image: listing.images.map((img) => img.url),
    url: pageUrl,
    itemCondition: isNewCondition(listing.condition)
      ? "https://schema.org/NewCondition"
      : "https://schema.org/UsedCondition",
    offers: {
      "@type": "Offer",
      url: pageUrl,
      priceCurrency: "PEN",
      price: activeDiscount ? getFinalPrice(listing.price, activeDiscount) : listing.price,
      availability: listing.sold
        ? "https://schema.org/SoldOut"
        : listing.isPreorder
          ? "https://schema.org/PreOrder"
          : "https://schema.org/InStock",
    },
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
            {reservation && (
              <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                🔖 Separada
              </Badge>
            )}
            {!listing.sold && listing.isPreorder && (
              <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-700">
                🕒 Preventa
              </Badge>
            )}
            {!listing.sold && isFeatured(listing.featuredUntil) && (
              <Badge className="bg-amber-400 text-amber-950">⭐ Destacada</Badge>
            )}
            {listing.sold && <Badge variant="secondary">Vendido</Badge>}
          </div>

          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <span aria-hidden="true">👁️</span>
            {views} {views === 1 ? "vista" : "vistas"}
          </div>

          <div className="mt-3 flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-foreground">{listing.title}</h1>
            <div className="flex shrink-0 gap-2">
              <ShareButton
                title={listing.title}
                text={`${listing.title} — ${formatPrice(
                  activeDiscount ? getFinalPrice(listing.price, activeDiscount) : listing.price
                )} en FigurasAnime`}
                url={pageUrl}
              />
              {currentUser && (
                <FavoriteButton
                  listingId={listing.id}
                  initialFavorited={isFavorited}
                  variant="inline"
                />
              )}
            </div>
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

          {reservation && (
            <div className="mt-4 rounded-lg bg-sky-50 p-3 text-sm text-sky-900 ring-1 ring-sky-200">
              <p className="font-semibold">🔖 Figura separada</p>
              <p className="mt-1">
                Alguien dejó un adelanto de <strong>{formatPrice(reservation.amount)}</strong>
                {reservation.until
                  ? ` y la tiene separada hasta el ${formatReservationDate(reservation.until)}`
                  : ""}
                . Todavía puedes comprarla si pagas el total de{" "}
                <strong>{formatPrice(totalPrice)}</strong>.
              </p>
            </div>
          )}

          {!listing.sold && listing.isPreorder && listing.preorderArrival && (
            <div className="mt-4 rounded-lg bg-violet-50 p-3 text-sm text-violet-900 ring-1 ring-violet-200">
              <p className="font-semibold">🕒 Preventa</p>
              <p className="mt-1">
                Llega aprox. en <strong>{formatArrival(listing.preorderArrival)}</strong>.
                {listing.preorderDeposit ? (
                  <>
                    {" "}
                    Sepárala con un adelanto de{" "}
                    <strong>{formatPrice(listing.preorderDeposit)}</strong> y paga el resto cuando
                    llegue.
                  </>
                ) : (
                  " Coordina con el vendedor cómo separarla."
                )}
              </p>
            </div>
          )}

          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
            {listing.description}
          </p>

          {listing.deliveryZones.length > 0 && (
            <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm">
              <p className="font-semibold text-foreground">📍 Entrega en</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {sortDeliveryZones(listing.deliveryZones).map((zone) => (
                  <Badge
                    key={zone}
                    variant="outline"
                    className="bg-white"
                    render={<Link href={`/?zona=${zone}#catalogo`} />}
                  >
                    {getDeliveryZoneLabel(zone)}
                  </Badge>
                ))}
              </div>
              {listing.deliveryNotes && (
                <p className="mt-2 text-muted-foreground">
                  Puntos de encuentro: {listing.deliveryNotes}
                </p>
              )}
            </div>
          )}

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
              {listing.user.isOfficialStore && (
                <p className="text-xs font-semibold text-orange-700">✔ {OFFICIAL_STORE_NAME}</p>
              )}
              <div className="mt-0.5">
                {reviewCount > 0 ? (
                  <StarRating rating={averageRating} reviewCount={reviewCount} />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    🆕 Vendedor nuevo · aún sin reseñas
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Miembro desde {memberSince}</p>
            </div>
          </Link>

          {listing.sold ? (
            <Alert className="mt-6 text-center">
              <AlertDescription className="justify-center text-center font-medium">
                Este producto ya fue vendido.
              </AlertDescription>
            </Alert>
          ) : (
            // Cualquiera puede contactar al vendedor, tenga cuenta o no.
            <div className="mt-6">
              <WhatsAppContactButton listingId={listing.id} />
              {currentUser && currentUser.id !== listing.user.id && (
                <MessageButton listingId={listing.id} />
              )}
              <StoryShareButton
                imageUrl={`${listingPath(listing)}/historia`}
                fileName={`figurasanime-${listing.id}-historia.png`}
                shareText={`${listing.title} — ${formatPrice(totalPrice)} en ${pageUrl}`}
                label="📲 Compartir en historias o TikTok"
                className="mt-3 w-full"
                showHint
              />
            </div>
          )}

          {!listing.sold && (
            <div className="mt-6 rounded-lg bg-muted/50 p-4 text-sm">
              <p className="font-semibold text-foreground">🛡️ Consejos para comprar seguro</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                <li>Pide fotos o un video reciente de la figura antes de pagar.</li>
                <li>Si se encuentran en persona, que sea en un lugar público y concurrido.</li>
                <li>Revisa la figura (y que sea original) antes de entregar el dinero.</li>
                <li>Evita adelantar el pago completo a alguien que no conoces.</li>
              </ul>
            </div>
          )}
        </Card>
      </div>

      {sellerListings.length > 0 && (
        <RelatedSection
          title={`Más de ${listing.user.name}`}
          href={`/vendedor/${listing.user.id}`}
          listings={sellerListings}
        />
      )}

      {similarListings.length > 0 && (
        <RelatedSection
          title="Figuras similares"
          href={categoryPath(listing.category)}
          listings={similarListings}
        />
      )}
    </div>
  );
}

type RelatedListing = Parameters<typeof toCardProps>[0];

function RelatedSection({
  title,
  href,
  listings,
}: {
  title: string;
  href: string;
  listings: RelatedListing[];
}) {
  return (
    <section className="mt-12">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <Link href={href} className="shrink-0 text-sm font-medium text-primary hover:underline">
          Ver todo
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {listings.map((l) => (
          <ListingCard key={l.id} {...toCardProps(l)} />
        ))}
      </div>
    </section>
  );
}
