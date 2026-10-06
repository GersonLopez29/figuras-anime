import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryNames } from "@/lib/categories";
import { findCategoryBySlug } from "@/lib/slug";
import CatalogPage, {
  catalogMetadata,
  type CatalogSearchParams,
} from "@/components/catalog/CatalogPage";

// /categoria/naruto, /categoria/dragon-ball-z… El resto de filtros (zona,
// línea, precio, orden, página) siguen como parámetros: ?zona=lima-sur.
type CategoriaPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: CatalogSearchParams;
};

async function resolveCategory(params: CategoriaPageProps["params"]) {
  const { slug } = await params;
  return findCategoryBySlug(await getCategoryNames(), slug);
}

export async function generateMetadata({
  params,
  searchParams,
}: CategoriaPageProps): Promise<Metadata> {
  const category = await resolveCategory(params);
  if (!category) return { title: "Categoría no encontrada — FigurasAnime" };
  return catalogMetadata({ searchParams, fixedCategory: category });
}

export default async function CategoriaPage({ params, searchParams }: CategoriaPageProps) {
  const category = await resolveCategory(params);
  if (!category) notFound();
  return <CatalogPage searchParams={searchParams} fixedCategory={category} />;
}
