import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gerstore.club";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listings, sellers, posts] = await Promise.all([
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
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/comunidad`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/publicar`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/registro`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/contacto`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/sobre-nosotros`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terminos-condiciones`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/politica-privacidad`, changeFrequency: "yearly", priority: 0.2 },
  ];

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

  return [...staticRoutes, ...listingRoutes, ...sellerRoutes, ...postRoutes];
}
