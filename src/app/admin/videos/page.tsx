import { prisma } from "@/lib/db";
import { formatPrice, getActiveDiscountAmount, getFinalPrice } from "@/lib/format";
import { isNewCondition, isOpenBoxCondition } from "@/lib/condition";
import { listingPath } from "@/lib/slug";
import TikTokVideoGenerator, { type VideoListing } from "@/components/admin/TikTokVideoGenerator";
import { facebookEnabled } from "@/lib/facebook";
import { Clapperboard } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminUi";

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

  return (
    <div>
      <AdminPageHeader
        icon={Clapperboard}
        title="Videos TikTok"
        description="Elige una figura disponible y arma un video vertical estilo anime para TikTok, Reels o historias. Al terminar puedes descargarlo, guardarlo en tu Google Drive o enviarlo como borrador a tu página de Facebook para ponerle música."
      />
      <TikTokVideoGenerator listings={items} facebookEnabled={facebookEnabled()} />
    </div>
  );
}
