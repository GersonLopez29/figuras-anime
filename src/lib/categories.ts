import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";

// Las categorías casi no cambian y se leen en cada página (menú y footer):
// se guardan en caché para no despertar la base de datos en cada visita.
// Al crear, editar o borrar una categoría se llama a expireCategoriesCache().
export const CATEGORIES_TAG = "categories";

export type CategoryOption = { name: string; icon: string };
export type CategoryWithCoverImage = CategoryOption & { imageUrl: string | null };

export const getCategories = unstable_cache(
  async (): Promise<CategoryOption[]> => {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "asc" },
      select: { name: true, icon: true },
    });
    // "Otras" es el cajón de sastre — siempre va al final, sin importar cuándo se creó.
    return categories.sort((a, b) => Number(a.name === "Otras") - Number(b.name === "Otras"));
  },
  ["categories-v1"],
  { tags: [CATEGORIES_TAG], revalidate: 3600 }
);

// Usa la foto real de la publicación activa más reciente de cada categoría
// como miniatura, en vez de un ícono genérico. Si la categoría todavía no
// tiene publicaciones, se cae de vuelta al emoji.
export async function getCategoriesWithCoverImage(): Promise<CategoryWithCoverImage[]> {
  const categories = await getCategories();

  return Promise.all(
    categories.map(async (cat) => {
      const listing = await prisma.listing.findFirst({
        where: { category: cat.name, sold: false },
        orderBy: { createdAt: "desc" },
        select: { images: { take: 1, select: { url: true } } },
      });
      return { ...cat, imageUrl: listing?.images[0]?.url ?? null };
    })
  );
}

export async function getCategoryNames(): Promise<string[]> {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "asc" },
    select: { name: true },
  });
  return categories.map((c) => c.name);
}

export async function isValidCategory(name: string): Promise<boolean> {
  const found = await prisma.category.findUnique({ where: { name } });
  return found !== null;
}
