// Catálogo de productos para Google Merchant Center (Google Shopping, gratis)
// y para el catálogo de Facebook/Instagram. Ambos leen el mismo formato: un RSS
// con los campos g:* de Google. Se publica en /feeds/google.xml y
// /feeds/facebook.xml y se actualiza cada hora.

import { prisma } from "@/lib/db";
import { listingPath } from "@/lib/slug";
import { getActiveDiscountAmount, getFinalPrice } from "@/lib/format";
import { detectBrand, prettyListingTitle } from "@/lib/listingSeo";
import { PRODUCT_LINES } from "@/lib/catalog";
import { getConditionLabel } from "@/lib/condition";

// Facebook exige marca: si no se reconoce en el título se usa "Genérico".

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://gerstore.club").replace(/\/$/, "");

export type FeedDestination = "google" | "facebook";

// Categoría de la taxonomía de Google para figuras coleccionables.
const GOOGLE_PRODUCT_CATEGORY = "Toys & Games > Toys > Dolls, Playsets & Toy Figures > Action & Toy Figures";

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

// Línea de producto detectada en el título (misma regla que el catálogo).
function detectLineLabel(title: string): string | undefined {
  const t = title.toLowerCase();
  return PRODUCT_LINES.find(
    (l) => l.contains.some((k) => t.includes(k)) || l.startsWith.some((k) => t.startsWith(k))
  )?.label;
}

// Muchas descripciones de los vendedores son de una línea. Google Merchant
// Center pide descripciones con detalles del producto, así que se antepone un
// resumen armado con los datos de la publicación.
function feedDescription(l: {
  title: string;
  description: string;
  category: string;
  condition: string;
  isPreorder: boolean;
}, brand: string | undefined): string {
  const name = prettyListingTitle(l.title);
  const line = detectLineLabel(l.title);
  const facts = [
    `${name}: figura ${l.category === "Otras" ? "coleccionable" : `de ${l.category}`}${line ? ` de la línea ${line}` : ""}${brand && !line?.includes(brand) ? ` (${brand})` : ""}.`,
    `Estado: ${getConditionLabel(l.condition)}.`,
    l.isPreorder ? "Disponible en preventa." : "",
    "Se vende en GerStore, el marketplace de figuras de anime en Perú: entrega en Lima, envíos a provincias y contacto directo con el vendedor por WhatsApp.",
  ]
    .filter(Boolean)
    .join(" ");
  const own = l.description.trim();
  return (own ? `${facts}\n\n${own}` : facts).slice(0, 4900);
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
    const description = feedDescription(l, detectBrand(l.title) ?? undefined);
    // Preventa con fecha de llegada; sin fecha (o ya pasada) se publica como disponible.
    const preorder = l.isPreorder && l.preorderArrival && l.preorderArrival > now;

    return [
      "<item>",
      tag("id", l.id),
      tag("title", prettyListingTitle(l.title).slice(0, 150)),
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
    "<title>GerStore — figuras de anime en Perú</title>",
    `<link>${SITE_URL}</link>`,
    "<description>Figuras de anime disponibles en GerStore (gerstore.club)</description>",
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
