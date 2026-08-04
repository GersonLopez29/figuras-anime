import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import DeleteListingButton from "@/components/DeleteListingButton";

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
                <Link
                  href={`/figura/${listing.id}`}
                  className="line-clamp-1 text-sm font-medium text-zinc-900 hover:underline"
                >
                  {listing.title}
                </Link>
                <p className="text-sm text-zinc-500">
                  {formatPrice(listing.price)} · {listing.category}
                </p>
                <p className="text-xs text-zinc-400">
                  Publicado por {listing.user.name} ({listing.user.email})
                </p>
              </div>

              <DeleteListingButton listingId={listing.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
