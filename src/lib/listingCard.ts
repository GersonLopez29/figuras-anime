import { getActiveDiscountAmount } from "@/lib/format";
import { getActiveReservation } from "@/lib/reservation";

// Lo que cada consulta debe incluir para dibujar una tarjeta del catálogo.
export const cardInclude = {
  images: { take: 1, select: { url: true } },
  user: { select: { name: true, isOfficialStore: true } },
} as const;

type CardListing = {
  id: string;
  slug: string | null;
  title: string;
  price: number;
  discountAmount: number | null;
  discountExpiresAt: Date | null;
  category: string;
  condition: string;
  sold: boolean;
  views: number;
  deliveryZones: string[];
  featuredUntil: Date | null;
  isPreorder: boolean;
  reservedAmount: number | null;
  reservedUntil: Date | null;
  photoType?: string | null;
  userId: string;
  images: { url: string }[];
  user?: { name: string; isOfficialStore: boolean };
};

// Convierte una publicación de la base de datos en las props de <ListingCard>.
// trustedSellerIds: vendedores con la insignia "Vendedor confiable".
export function toCardProps(l: CardListing, trustedSellerIds?: Set<string>) {
  return {
    id: l.id,
    slug: l.slug,
    title: l.title,
    price: l.price,
    discountAmount: getActiveDiscountAmount(l.discountAmount, l.discountExpiresAt),
    category: l.category,
    condition: l.condition,
    imageUrl: l.images[0]?.url,
    sellerName: l.user?.name,
    officialStore: l.user?.isOfficialStore ?? false,
    sold: l.sold,
    views: l.views,
    deliveryZones: l.deliveryZones,
    featuredUntil: l.featuredUntil,
    isPreorder: l.isPreorder,
    isReserved: !!getActiveReservation(l.reservedAmount, l.reservedUntil),
    realPhotos: l.photoType === "real",
    trustedSeller: trustedSellerIds?.has(l.userId) ?? false,
  };
}
