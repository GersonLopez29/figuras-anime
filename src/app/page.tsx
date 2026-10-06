import type { Metadata } from "next";
import CatalogPage, {
  catalogMetadata,
  type CatalogSearchParams,
} from "@/components/catalog/CatalogPage";

type HomeProps = { searchParams: CatalogSearchParams };

export async function generateMetadata({ searchParams }: HomeProps): Promise<Metadata> {
  return catalogMetadata({ searchParams });
}

export default async function Home({ searchParams }: HomeProps) {
  return <CatalogPage searchParams={searchParams} />;
}
