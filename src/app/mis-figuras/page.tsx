import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import DeleteListingButton from "@/components/DeleteListingButton";
import ToggleSoldButton from "@/components/ToggleSoldButton";
import DiscountControl from "@/components/DiscountControl";
import { formatPrice, getFinalPrice } from "@/lib/format";

export default async function MisFigurasPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const listings = await prisma.listing.findMany({
    where: { userId: user.id },
    include: { images: { take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Mis figuras</h1>
        <Link
          href="/publicar"
          className="rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        >
          Publicar nueva
        </Link>
      </div>

      {listings.length === 0 ? (
        <p className="mt-10 text-sm text-zinc-500">
          Todavía no has publicado ninguna figura.
        </p>
      ) : (
        <div className="mt-6 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
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

              <div className="flex-1 min-w-0">
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
                <p className="text-sm text-zinc-500">
                  {listing.discountAmount ? (
                    <>
                      <span className="mr-1.5 line-through">{formatPrice(listing.price)}</span>
                      <span className="font-semibold text-green-700">
                        {formatPrice(getFinalPrice(listing.price, listing.discountAmount))}
                      </span>
                    </>
                  ) : (
                    formatPrice(listing.price)
                  )}{" "}
                  · {listing.category}
                </p>
                <p className="flex items-center gap-1 text-xs text-zinc-400">
                  <span aria-hidden="true">👁️</span>
                  {listing.views} {listing.views === 1 ? "vista" : "vistas"}
                </p>
                <div className="mt-1.5">
                  <DiscountControl listingId={listing.id} discountAmount={listing.discountAmount} />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <ToggleSoldButton listingId={listing.id} sold={listing.sold} />
                <Link
                  href={`/mis-figuras/${listing.id}/editar`}
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
                >
                  Editar
                </Link>
                <DeleteListingButton listingId={listing.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
