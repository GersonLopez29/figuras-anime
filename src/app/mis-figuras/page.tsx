import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/session";
import { prisma } from "@/lib/db";
import DeleteListingButton from "@/components/DeleteListingButton";
import FeatureListingButton from "@/components/FeatureListingButton";
import {
  FEATURE_DAYS,
  FEATURE_PRICE,
  formatShortDate,
  getFeaturePaymentInfo,
  isFeatured,
} from "@/lib/featured";
import ToggleSoldButton from "@/components/ToggleSoldButton";
import DiscountControl from "@/components/DiscountControl";
import { formatPrice, getFinalPrice, getActiveDiscountAmount } from "@/lib/format";
import { getConditionLabel } from "@/lib/condition";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default async function MisFigurasPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [listings, payment] = await Promise.all([
    prisma.listing.findMany({
      where: { userId: user.id },
      include: {
        images: { take: 1 },
        featureRequests: { where: { status: "pending" }, select: { id: true }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    }),
    getFeaturePaymentInfo(),
  ]);
  const userIsAdmin = isAdmin(user);
  const missingZoneCount = listings.filter(
    (l) => !l.sold && l.deliveryZones.length === 0
  ).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Mis figuras</h1>
        <Button render={<Link href="/publicar" />} nativeButton={false} className="rounded-full">
          Publicar nueva
        </Button>
      </div>

      {missingZoneCount > 0 && (
        <Alert className="mt-6 border-amber-200 bg-amber-50">
          <AlertDescription className="text-amber-900">
            📍 {missingZoneCount === 1 ? "1 figura no tiene" : `${missingZoneCount} figuras no tienen`}{" "}
            zona de entrega. Los compradores ahora filtran por zona, así que esas figuras no
            aparecen en esos resultados. Toca <strong>Agregar zona</strong> para completarla.
          </AlertDescription>
        </Alert>
      )}

      {listings.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">
          Todavía no has publicado ninguna figura.
        </p>
      ) : (
        <Card className="mt-6 gap-0 divide-y divide-border py-0 shadow-sm">
          {listings.map((listing) => {
            const activeDiscount = getActiveDiscountAmount(
              listing.discountAmount,
              listing.discountExpiresAt
            );
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
                      href={`/figura/${listing.id}`}
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
