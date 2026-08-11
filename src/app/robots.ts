import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gerstore.club";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/mis-figuras", "/mensajes", "/favoritos"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
