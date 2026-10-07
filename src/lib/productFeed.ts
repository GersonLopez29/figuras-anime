// Catálogo de productos para Google Merchant Center (Google Shopping, gratis)
// y para el catálogo de Facebook/Instagram. Ambos leen el mismo formato: un RSS
// con los campos g:* de Google. Se publica en /feeds/google.xml y
// /feeds/facebook.xml y se actualiza cada hora.

import { prisma } from "@/lib/db";
import { listingPath } from "@/lib/slug";
import { getActiveDiscountAmount, getFinalPrice } from "@/lib/format";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://gerstore.club").replace(/\/$/, "");

export type FeedDestination = "google" | "facebook";

// Categoría de la taxonomía de Google para figuras coleccionables.
const GOOGLE_PRODUCT_CATEGORY = "Toys & Games > Toys > Dolls, Playsets & Toy Figures > Action & Toy Figures";

// Marca según palabras del título. Google prefiere no recibir marca a recibir
// una inventada; Facebook la exige, así que ahí se usa "Genérico" si no hay.
const BRANDS: { brand: string; words: string[] }[] = [
  { brand: "Bandai Spirits", words: ["figuarts", "shf", "s.h.", "ichiban", "masterlise", "tamashii"] },
  { brand: "Banpresto", words: ["banpresto", "grandista", "luminasta", "dxf", "clearise"] },
  { brand: "Good Smile Company", words: ["nendoroid", "pop up parade", "good smile"] },
  { brand: "Max Factory", words: ["figma"] },
  { brand: "MegaHouse", words: ["megahouse", "portrait of pirates", "p.o.p", "g.e.m."] },
  { brand: "Kotobukiya", words: ["kotobukiya", "artfx"] },
  { brand: "SEGA", words: ["sega", "spm"] },
  { brand: "Taito", words: ["taito"] },
  { brand: "FuRyu", words: ["furyu", "noodle stopper"] },
  { brand: "Hasbro", words: ["hasbro", "marvel legends", "gi joe", "g.i. joe"] },
  { brand: "Funko", words: ["funko"] },
  { brand: "Bandai", words: ["bandai"] },
];

export function detectBrand(title: string): string | undefined {
  const text = ` ${title.toLowerCase()} `;
  return BRANDS.find((b) => b.words.some((w) => text.includes(w)))?.brand;
}

function escapeXml(value: string): string {
  return value
    // Caracteres de control que rompen el XML.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function absoluteUrl(url: string): string {
  return /^https?:\/\//.test(url) ? url : `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function money(amount: number): string {
  return `${amount.toFixed(2)} PEN`;
}

function tag(name: string, value: string | undefined | null): string {
  return value ? `<g:${name}>${escapeXml(value)}</g:${name}>` : "";
}

export async function buildProductFeed(destination: FeedDestination): Promise<string> {
  const now = new Date();
  const listings = await prisma.listing.findMany({
    where: { sold: false, user: { isBlocked: false }, images: { some: {} } },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      price: true,
      discountAmount: true,
      discountExpiresAt: true,
      category: true,
      condition: true,
      isPreorder: true,
      preorderArrival: true,
      featuredUntil: true,
      images: { select: { url: true }, take: 11 },
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });
  const items = listings.map((l) => {
    const discount = getActiveDiscountAmount(l.discountAmount, l.discountExpiresAt);
    const brand = detectBrand(l.title) ?? (destination === "facebook" ? "Genérico" : undefined);
    const [main, ...extra] = l.images.map((i) => absoluteUrl(i.url));
    const description = (l.description.trim() || l.title).slice(0, 4900);
    // Preventa con fecha de llegada; sin fecha (o ya pasada) se publica como disponible.
    const preorder = l.isPreorder && l.preorderArrival && l.preorderArrival > now;

    return [
      "<item>",
      tag("id", l.id),
      tag("title", l.title.slice(0, 150)),
      tag("description", description),
      tag("link", `${SITE_URL}${listingPath(l)}`),
      tag("image_link", main),
      ...extra.slice(0, 10).map((url) => tag("additional_image_link", url)),
      tag("availability", preorder ? "preorder" : "in stock"),
      preorder ? tag("availability_date", l.preorderArrival!.toISOString()) : "",
      tag("price", money(l.price)),
      discount
        ? tag("sale_price", money(getFinalPrice(l.price, discount)))
        : "",
      discount && l.discountExpiresAt
        ? tag("sale_price_effective_date", `${now.toISOString()}/${l.discountExpiresAt.toISOString()}`)
        : "",
      // "Open box" ya no está en su empaque cerrado: para Google cuenta como usada.
      tag("condition", l.condition === "nuevo" ? "new" : "used"),
      tag("brand", brand),
      destination === "google" ? tag("identifier_exists", "no") : "",
      tag("google_product_category", GOOGLE_PRODUCT_CATEGORY),
      tag("product_type", `Figuras de anime > ${l.category}`),
      // Etiquetas para filtrar en las campañas (ej. solo destacadas).
      tag("custom_label_0", l.category),
      tag("custom_label_1", l.featuredUntil && l.featuredUntil > now ? "destacada" : "normal"),
      "</item>",
    ]
      .filter(Boolean)
      .join("");
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    "<channel>",
    "<title>FigurasAnime — figuras de anime en Perú</title>",
    `<link>${SITE_URL}</link>`,
    "<description>Figuras de anime disponibles en FigurasAnime (gerstore.club)</description>",
    ...items,
    "</channel>",
    "</rss>",
  ].join("\n");
}

export function feedResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=600",
    },
  });
}
