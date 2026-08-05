import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import DeleteListingButton from "@/components/DeleteListingButton";
import ToggleSoldButton from "@/components/ToggleSoldButton";
import CategorySelect from "@/components/CategorySelect";

export default async function AdminPublicacionesPage() {
  const listings = await prisma.listing.findMany({
    include: {
      images: { take: 1 },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-900">
        Publicaciones ({listings.length})
      </h2>

      {listings.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">Todavía no hay publicaciones.</p>
      ) : (
        <div className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
          {listings.map((listing) => (
            <div key={listing.id} className="flex items-center gap-4 p-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-zinc-100">
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
                    className="line-clamp-1 text-sm font-medium text-zinc-900 hover:underline"
                  >
                    {listing.title}
                  </Link>
                  {listing.sold && (
                    <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-medium text-white">
                      Vendido
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-500">{formatPrice(listing.price)}</p>
                <p className="text-xs text-zinc-400">
                  Publicado por {listing.user.name} ({listing.user.email}) ·{" "}
                  <span className="inline-flex items-center gap-0.5">
                    <span aria-hidden="true">👁️</span>
                    {listing.views} {listing.views === 1 ? "vista" : "vistas"}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <CategorySelect listingId={listing.id} category={listing.category} />
                <ToggleSoldButton listingId={listing.id} sold={listing.sold} />
                <DeleteListingButton listingId={listing.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
