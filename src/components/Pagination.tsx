import Link from "next/link";
import { Button } from "@/components/ui/button";
import { catalogHref, type CatalogState } from "@/lib/catalog";

type PaginationProps = {
  page: number;
  totalPages: number;
  state: CatalogState;
};

export default function Pagination({ page, totalPages, state }: PaginationProps) {
  if (totalPages <= 1) return null;

  function hrefFor(p: number) {
    return catalogHref(state, p);
  }

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="mt-8 flex items-center justify-center gap-4">
      {hasPrev ? (
        <Button render={<Link href={hrefFor(page - 1)} />} nativeButton={false} variant="outline" className="rounded-full">
          Anterior
        </Button>
      ) : (
        <Button disabled variant="outline" className="rounded-full">
          Anterior
        </Button>
      )}

      <span className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </span>

      {hasNext ? (
        <Button render={<Link href={hrefFor(page + 1)} />} nativeButton={false} variant="outline" className="rounded-full">
          Siguiente
        </Button>
      ) : (
        <Button disabled variant="outline" className="rounded-full">
          Siguiente
        </Button>
      )}
    </div>
  );
}
