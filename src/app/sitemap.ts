import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { DELIVERY_ZONES } from "@/lib/delivery";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gerstore.club";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listings, sellers, posts, categories, zoneCounts] = await Promise.all([
    prisma.listing.findMany({
      where: { sold: false },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 1000,
    }),
    prisma.user.findMany({
      select: { id: true },
      take: 1000,
    }),
    prisma.collectionPost.findMany({
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 1000,
    }),
    // Solo categorías y zonas con figuras disponibles: una página vacía no
    // aporta nada en Google.
    prisma.listing.groupBy({
      by: ["category"],
      where: { sold: false },
      _max: { updatedAt: true },
    }),
    Promise.all(
      DELIVERY_ZONES.map(async (zone) => ({
        zone: zone.value,
        count: await prisma.listing.count({
          where: { sold: false, deliveryZones: { has: zone.value } },
        }),
      }))
    ),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/comunidad`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/publicar`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/registro`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/contacto`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/te-la-vendemos`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/sobre-nosotros`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terminos-condiciones`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/politica-privacidad`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/?categoria=${encodeURIComponent(c.category)}`,
    lastModified: c._max.updatedAt ?? undefined,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const zoneRoutes: MetadataRoute.Sitemap = zoneCounts
    .filter((z) => z.count > 0)
    .map((z) => ({
      url: `${SITE_URL}/?zona=${z.zone}`,
      changeFrequency: "daily",
      priority: 0.7,
    }));

  const listingRoutes: MetadataRoute.Sitemap = listings.map((listing) => ({
    url: `${SITE_URL}/figura/${listing.id}`,
    lastModified: listing.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const sellerRoutes: MetadataRoute.Sitemap = sellers.map((seller) => ({
    url: `${SITE_URL}/vendedor/${seller.id}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/comunidad/${post.id}`,
    lastModified: post.createdAt,
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...zoneRoutes,
    ...listingRoutes,
    ...sellerRoutes,
    ...postRoutes,
  ];
}
