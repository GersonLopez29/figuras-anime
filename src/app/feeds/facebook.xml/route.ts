import { buildProductFeed, feedResponse } from "@/lib/productFeed";

// Catálogo de productos para Facebook / Instagram. Se regenera cada hora.
export const revalidate = 3600;

export async function GET() {
  return feedResponse(await buildProductFeed("facebook"));
}
