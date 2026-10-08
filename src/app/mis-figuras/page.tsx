import Link from "next/link";
import { listingPath } from "@/lib/slug";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/session";
import { prisma } from "@/lib/db";
import DeleteListingButton from "@/components/DeleteListingButton";
import FeatureListingButton from "@/components/FeatureListingButton";
import StoryShareButton from "@/components/StoryShareButton";
import {
  FEATURE_DAYS,
  FEATURE_PRICE,
  formatShortDate,
  getFeaturePaymentInfo,
  isFeatured,
} from "@/lib/featured";
import ToggleSoldButton from "@/components/ToggleSoldButton";
import DiscountControl from "@/components/DiscountControl";
import ReservationControl from "@/components/ReservationControl";
import { getActiveReservation } from "@/lib/reservation";
import { formatPrice, getFinalPrice, getActiveDiscountAmount } from "@/lib/format";
import { getConditionLabel } from "@/lib/condition";
import {
  TRUST_MIN_ACCOUNT_DAYS,
  TRUST_MIN_RATING,
  TRUST_MIN_REVIEWS,
  TRUST_MIN_SALES,
  getTrustProgress,
} from "@/lib/trust";
import TrustedSellerBadge from "@/components/TrustedSellerBadge";
import { claimReferralRewards } from "@/lib/referrals";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SoldFilterTabs from "@/components/SoldFilterTabs";
import { matchesSoldFilter, parseSoldFilter, soldCounts } from "@/lib/soldFilter";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gerstore.club";

type MisFigurasPageProps = {
  searchParams: Promise<{ estado?: string }>;
};

export default async function MisFigurasPage({ searchParams }: MisFigurasPageProps) {
  const filter = parseSoldFilter((await searchParams).estado);
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Entrega los destacados gratis de invitados que ya cumplen las condiciones.
  await claimReferralRewards(user.id);
  const [listings, payment, trust, credits] = await Promise.all([
    prisma.listing.findMany({
      where: { userId: user.id },
      include: {
        images: { take: 1 },
        featureRequests: { where: { status: "pending" }, select: { id: true }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    }),
    getFeaturePaymentInfo(),
    getTrustProgress(user.id),
    prisma.user
      .findUnique({ where: { id: user.id }, select: { freeFeatureCredits: true } })
      .then((u) => u?.freeFeatureCredits ?? 0),
  ]);
  const userIsAdmin = isAdmin(user);
  const soldCount = listings.filter((l) => l.sold).length;
  const counts = soldCounts(listings.length - soldCount, soldCount);
  const visibleListings = listings.filter((l) => matchesSoldFilter(filter, l.sold));
  const missingZoneCount = listings.filter(
    (l) => !l.sold && l.deliveryZones.length === 0
  ).length;
  const missingPhotoTypeCount = listings.filter((l) => !l.sold && !l.photoType).length;
  // Qué le falta para la insignia "Vendedor confiable".
  const trustMissing = trust && !trust.trusted
    ? [
        trust.sales < TRUST_MIN_SALES &&
          `${TRUST_MIN_SALES - trust.sales} ${TRUST_MIN_SALES - trust.sales === 1 ? "venta" : "ventas"} (marca tus figuras como vendidas)`,
        trust.reviews < TRUST_MIN_REVIEWS &&
          `${TRUST_MIN_REVIEWS - trust.reviews} ${TRUST_MIN_REVIEWS - trust.reviews === 1 ? "reseña" : "reseñas"} de tus compradores`,
        trust.reviews >= TRUST_MIN_REVIEWS &&
          trust.rating < TRUST_MIN_RATING &&
          `subir tu calificación a ${TRUST_MIN_RATING} estrellas o más`,
        trust.accountDays < TRUST_MIN_ACCOUNT_DAYS &&
          `${TRUST_MIN_ACCOUNT_DAYS - trust.accountDays} días más de antigüedad`,
      ].filter((x): x is string => typeof x === "string")
    : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Mis figuras</h1>
        <Button render={<Link href="/publicar" />} nativeButton={false} className="rounded-full">
          Publicar nueva
        </Button>
      </div>

      {listings.length > 0 && trust && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-muted/50 p-4 text-sm">
            {trust.trusted ? (
              <>
                <TrustedSellerBadge />
                <p className="mt-2 text-muted-foreground">
                  Tus figuras muestran la insignia. ¡Sigue así!
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-foreground">🏅 Insignia de Vendedor confiable</p>
                <p className="mt-1 text-muted-foreground">
                  Te falta: {trustMissing.join(", ")}. Se activa sola.
                </p>
              </>
            )}
          </div>
          <Link
            href="/invitar"
            className="rounded-lg bg-green-50 p-4 text-sm ring-1 ring-green-200 transition hover:bg-green-100/70"
          >
            <p className="font-semibold text-green-900">
              🎁 {credits > 0
                ? `Tienes ${credits} ${credits === 1 ? "destacado gratis" : "destacados gratis"}`
                : "Gana destacados gratis"}
            </p>
            <p className="mt-1 text-green-800">
              {credits > 0
                ? "Úsalo con el botón ⭐ Destacar de cualquier figura. Invita a más amigos para ganar otro →"
                : "Invita a un amigo a vender: cuando publique su primera figura, ganas 7 días de destacado →"}
            </p>
          </Link>
        </div>
      )}

      {missingPhotoTypeCount > 0 && (
        <Alert className="mt-6 border-sky-200 bg-sky-50">
          <AlertDescription className="text-sky-900">
            📷 {missingPhotoTypeCount === 1 ? "1 figura no indica" : `${missingPhotoTypeCount} figuras no indican`}{" "}
            si sus fotos son reales o referenciales. Las que tienen <strong>Foto real</strong> muestran
            una etiqueta en el catálogo y generan más confianza. Toca <strong>Editar</strong> para
            marcarlo.
          </AlertDescription>
        </Alert>
      )}

      {missingZoneCount > 0 && (
        <Alert className="mt-6 border-amber-200 bg-amber-50">
          <AlertDescription className="text-amber-900">
            📍 {missingZoneCount === 1 ? "1 figura no tiene" : `${missingZoneCount} figuras no tienen`}{" "}
            zona de entrega. Los compradores ahora filtran por zona, así que esas figuras no
            aparecen en esos resultados. Toca <strong>Agregar zona</strong> para completarla.
          </AlertDescription>
        </Alert>
      )}

      {listings.length > 0 && (
        <div className="mt-6">
          <SoldFilterTabs basePath="/mis-figuras" active={filter} counts={counts} />
        </div>
      )}

      {listings.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">
          Todavía no has publicado ninguna figura.
        </p>
      ) : visibleListings.length === 0 ? (
        <p className="mt-6 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
          {filter === "vendidas"
            ? "Todavía no tienes figuras vendidas. Cuando vendas una, márcala con \"Marcar como vendido\" para que aparezca aquí."
            : "No tienes figuras disponibles en este momento."}
        </p>
      ) : (
        <Card className="mt-4 gap-0 divide-y divide-border py-0 shadow-sm">
          {visibleListings.map((listing) => {
            const activeDiscount = getActiveDiscountAmount(
              listing.discountAmount,
              listing.discountExpiresAt
            );
            const reservation = getActiveReservation(listing.reservedAmount, listing.reservedUntil);
            return (
            <div
              key={listing.id}
              className="flex flex-col gap-3 p-4 transition hover:bg-primary/5 sm:flex-row sm:items-center sm:gap-4"
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {listing.images[0] ? (
                    <Image
                      src={listing.images[0].url}
                      alt={listing.title}
                      fill
                      className="object-cover"
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={listingPath(listing)}
                      className="line-clamp-1 text-sm font-medium text-foreground hover:underline"
                    >
                      {listing.title}
                    </Link>
                    {listing.sold && <Badge variant="secondary">Vendido</Badge>}
                    {!listing.sold && isFeatured(listing.featuredUntil) && (
                      <Badge className="shrink-0 bg-amber-400 text-amber-950">
                        ⭐ Destacada hasta el {formatShortDate(listing.featuredUntil!)}
                      </Badge>
                    )}
                    {!listing.sold && listing.deliveryZones.length === 0 && (
                      <Badge
                        variant="outline"
                        className="shrink-0 border-amber-300 bg-amber-50 text-amber-800"
                        render={<Link href={`/mis-figuras/${listing.id}/editar`} />}
                      >
                        📍 Agregar zona
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activeDiscount ? (
                      <>
                        <span className="mr-1.5 line-through">{formatPrice(listing.price)}</span>
                        <span className="font-semibold text-green-700">
                          {formatPrice(getFinalPrice(listing.price, activeDiscount))}
                        </span>
                      </>
                    ) : (
                      formatPrice(listing.price)
                    )}{" "}
                    · {listing.category} · {getConditionLabel(listing.condition)}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span aria-hidden="true">👁️</span>
                    {listing.views} {listing.views === 1 ? "vista" : "vistas"}
                  </p>
                  <div className="mt-1.5">
                    <DiscountControl
                      listingId={listing.id}
                      discountAmount={activeDiscount}
                      discountExpiresAt={listing.discountExpiresAt}
                    />
                  </div>
                  {!listing.sold && (
                    <div className="mt-1.5">
                      <ReservationControl
                        listingId={listing.id}
                        reservedAmount={reservation?.amount ?? null}
                        reservedUntil={reservation?.until ?? null}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
                {!listing.sold && (
                  <FeatureListingButton
                    listingId={listing.id}
                    listingTitle={listing.title}
                    price={FEATURE_PRICE}
                    days={FEATURE_DAYS}
                    featuredUntilLabel={
                      isFeatured(listing.featuredUntil)
                        ? formatShortDate(listing.featuredUntil!)
                        : null
                    }
                    pending={listing.featureRequests.length > 0}
                    isAdmin={userIsAdmin}
                    payment={payment}
                    freeCredits={credits}
                  />
                )}
                {!listing.sold && (
                  <StoryShareButton
                    imageUrl={`${listingPath(listing)}/historia`}
                    fileName={`figurasanime-${listing.id}-historia.png`}
                    shareText={`${listing.title} en ${SITE_URL}${listingPath(listing)}`}
                    label="📲 Historia o TikTok"
                    size="sm"
                  />
                )}
                <ToggleSoldButton listingId={listing.id} sold={listing.sold} />
                <Button
                  render={<Link href={`/mis-figuras/${listing.id}/editar`} />}
                  nativeButton={false}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                >
                  Editar
                </Button>
                <DeleteListingButton listingId={listing.id} />
              </div>
            </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
