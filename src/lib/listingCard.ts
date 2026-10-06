import { getActiveDiscountAmount } from "@/lib/format";

// Lo que cada consulta debe incluir para dibujar una tarjeta del catálogo.
export const cardInclude = {
  images: { take: 1, select: { url: true } },
  user: { select: { name: true, isOfficialStore: true } },
} as const;

type CardListing = {
  id: string;
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
  images: { url: string }[];
  user?: { name: string; isOfficialStore: boolean };
};

// Convierte una publicación de la base de datos en las props de <ListingCard>.
export function toCardProps(l: CardListing) {
  return {
    id: l.id,
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
  };
}
