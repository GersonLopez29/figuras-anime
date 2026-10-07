import { buildProductFeed, feedResponse } from "@/lib/productFeed";

// Catálogo para Google Merchant Center (Google Shopping). Se regenera cada hora.
export const revalidate = 3600;

export async function GET() {
  return feedResponse(await buildProductFeed("google"));
}
