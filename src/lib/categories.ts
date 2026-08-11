import { prisma } from "@/lib/db";

export type CategoryOption = { name: string; icon: string };

export async function getCategories(): Promise<CategoryOption[]> {
  return prisma.category.findMany({
    orderBy: { createdAt: "asc" },
    select: { name: true, icon: true },
  });
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
