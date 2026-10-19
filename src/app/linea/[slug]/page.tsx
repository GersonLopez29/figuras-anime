import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRODUCT_LINES, type ProductLineSlug } from "@/lib/catalog";
import CatalogPage, {
  catalogMetadata,
  type CatalogSearchParams,
} from "@/components/catalog/CatalogPage";

// /linea/shfiguarts, /linea/ichibankuji… Una página por línea para que Google
// la muestre cuando buscan "S.H.Figuarts Lima" o "Ichiban Kuji Perú". Antes era
// /?linea=shfiguarts (la portada redirige aquí). Zona, precio y orden siguen
// como parámetros.
type LineaPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: CatalogSearchParams;
};

async function resolveLine(params: LineaPageProps["params"]): Promise<ProductLineSlug | undefined> {
  const { slug } = await params;
  return PRODUCT_LINES.find((l) => l.slug === slug)?.slug;
}

export async function generateMetadata({ params, searchParams }: LineaPageProps): Promise<Metadata> {
  const line = await resolveLine(params);
  if (!line) return { title: "Línea no encontrada — FigurasAnime" };
  return catalogMetadata({ searchParams, fixedLine: line });
}

export default async function LineaPage({ params, searchParams }: LineaPageProps) {
  const line = await resolveLine(params);
  if (!line) notFound();
  return <CatalogPage searchParams={searchParams} fixedLine={line} />;
}
