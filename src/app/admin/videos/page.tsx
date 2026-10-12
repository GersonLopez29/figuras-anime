import { prisma } from "@/lib/db";
import { formatPrice, getActiveDiscountAmount, getFinalPrice } from "@/lib/format";
import { isNewCondition, isOpenBoxCondition } from "@/lib/condition";
import { listingPath } from "@/lib/slug";
import TikTokVideoGenerator, { type VideoListing } from "@/components/admin/TikTokVideoGenerator";

// Generador de videos estilo anime para TikTok/Reels de cualquier figura
// disponible. El video se arma en el navegador (lib/animeVideo.ts).
export default async function AdminVideosPage() {
  const listings = await prisma.listing.findMany({
    where: { sold: false },
    orderBy: { createdAt: "desc" },
    take: 80,
    select: {
      id: true,
      slug: true,
      title: true,
      price: true,
      discountAmount: true,
      discountExpiresAt: true,
      condition: true,
      category: true,
      images: { select: { url: true }, orderBy: { id: "asc" } },
    },
  });

  const items: VideoListing[] = listings.map((l) => {
    const price = getFinalPrice(l.price, getActiveDiscountAmount(l.discountAmount, l.discountExpiresAt));
    return {
      id: l.id,
      title: l.title,
      path: listingPath(l),
      category: l.category,
      priceLabel: `S/ ${Number.isInteger(price) ? price : price.toFixed(2)}`,
      priceText: formatPrice(price),
      conditionChip: isNewCondition(l.condition)
        ? "NUEVA"
        : isOpenBoxCondition(l.condition)
          ? "OPEN BOX"
          : "USADA",
      images: l.images.map((img) => img.url),
    };
  });

  return <TikTokVideoGenerator listings={items} />;
}
