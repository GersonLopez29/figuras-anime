import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import ListingCard from "@/components/ListingCard";
import { cardInclude, toCardProps } from "@/lib/listingCard";
import { getTrustedSellerIds } from "@/lib/trust";
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
      listing: { include: cardInclude },
    },
    orderBy: { createdAt: "desc" },
  });
  const trustedSellerIds = await getTrustedSellerIds();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
        <span aria-hidden="true">❤️</span> Mis favoritos
      </h1>

      {favorites.length === 0 ? (
        <Card className="mt-10 flex-col items-center border-2 border-dashed border-border px-6 py-16 text-center shadow-none ring-0">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40 text-2xl ring-1 ring-red-100 dark:ring-red-800">
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
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {favorites.map(({ listing }) => (
            <ListingCard key={listing.id} {...toCardProps(listing, trustedSellerIds)} isFavorited={true} />
          ))}
        </div>
      )}
    </div>
  );
}
