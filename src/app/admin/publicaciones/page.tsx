import Link from "next/link";
import { listingPath } from "@/lib/slug";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { getCategoryNames } from "@/lib/categories";
import DeleteListingButton from "@/components/DeleteListingButton";
import ToggleSoldButton from "@/components/ToggleSoldButton";
import CategorySelect from "@/components/CategorySelect";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminPublicacionesPage() {
  const [listings, categoryNames] = await Promise.all([
    prisma.listing.findMany({
      include: {
        images: { take: 1 },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    getCategoryNames(),
  ]);

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground">
        Publicaciones ({listings.length})
      </h2>

      {listings.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Todavía no hay publicaciones.</p>
      ) : (
        <Card className="mt-4 gap-0 divide-y divide-border py-0 shadow-sm">
          {listings.map((listing) => (
            <div key={listing.id} className="flex items-center gap-4 p-4 transition hover:bg-primary/5">
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
                </div>
                <p className="text-sm text-muted-foreground">{formatPrice(listing.price)}</p>
                <p className="text-xs text-muted-foreground">
                  Publicado por {listing.user.name} ({listing.user.email}) ·{" "}
                  <span className="inline-flex items-center gap-0.5">
                    <span aria-hidden="true">👁️</span>
                    {listing.views} {listing.views === 1 ? "vista" : "vistas"}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <CategorySelect
                  listingId={listing.id}
                  category={listing.category}
                  categories={categoryNames}
                />
                <ToggleSoldButton listingId={listing.id} sold={listing.sold} />
                <DeleteListingButton listingId={listing.id} />
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
