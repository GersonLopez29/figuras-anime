import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import ListingCard from "@/components/ListingCard";
import { getActiveDiscountAmount } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function FavoritosPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: {
      listing: {
        include: {
          images: { take: 1 },
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
        <span aria-hidden="true">❤️</span> Mis favoritos
      </h1>

      {favorites.length === 0 ? (
        <Card className="mt-10 flex-col items-center border-2 border-dashed border-border px-6 py-16 text-center shadow-none ring-0">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl ring-1 ring-red-100">
            🤍
          </span>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Todavía no guardaste ninguna figura. Toca el corazón en una figura para guardarla aquí.
          </p>
          <Button render={<Link href="/" />} nativeButton={false} className="mt-5 rounded-full">
            Explorar catálogo
          </Button>
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {favorites.map(({ listing }) => (
            <ListingCard
              key={listing.id}
              id={listing.id}
              title={listing.title}
              price={listing.price}
              discountAmount={getActiveDiscountAmount(listing.discountAmount, listing.discountExpiresAt)}
              category={listing.category}
              condition={listing.condition}
              imageUrl={listing.images[0]?.url}
              sellerName={listing.user.name}
              sold={listing.sold}
              views={listing.views}
              isFavorited={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
