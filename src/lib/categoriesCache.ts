import { revalidateTag } from "next/cache";
import { CATEGORIES_TAG } from "@/lib/categories";

// Borra al instante la caché de categorías (menú, footer, formularios).
export function expireCategoriesCache() {
  revalidateTag(CATEGORIES_TAG, { expire: 0 });
}
