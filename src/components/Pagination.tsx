import Link from "next/link";
import { Button } from "@/components/ui/button";

type PaginationProps = {
  page: number;
  totalPages: number;
  categoria?: string;
  q?: string;
  estado?: "nuevo" | "usado";
  oferta?: boolean;
};

export default function Pagination({
  page,
  totalPages,
  categoria,
  q,
  estado,
  oferta,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  function hrefFor(p: number) {
    const params = new URLSearchParams();
    if (categoria) params.set("categoria", categoria);
    if (q) params.set("q", q);
    if (estado) params.set("estado", estado);
    if (oferta) params.set("oferta", "1");
    if (p > 1) params.set("pagina", String(p));
    const qs = params.toString();
    return `${qs ? `/?${qs}` : "/"}#catalogo`;
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
