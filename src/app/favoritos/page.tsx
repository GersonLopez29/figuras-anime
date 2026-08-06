import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import ListingCard from "@/components/ListingCard";

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
      <h1 className="text-2xl font-bold text-zinc-900">Mis favoritos</h1>

      {favorites.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">
          Todavía no guardaste ninguna figura. Toca el corazón en una figura para guardarla aquí.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {favorites.map(({ listing }) => (
            <ListingCard
              key={listing.id}
              id={listing.id}
              title={listing.title}
              price={listing.price}
              category={listing.category}
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
