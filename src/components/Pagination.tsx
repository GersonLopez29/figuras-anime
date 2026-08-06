import Link from "next/link";

type PaginationProps = {
  page: number;
  totalPages: number;
  categoria?: string;
  q?: string;
};

export default function Pagination({ page, totalPages, categoria, q }: PaginationProps) {
  if (totalPages <= 1) return null;

  function hrefFor(p: number) {
    const params = new URLSearchParams();
    if (categoria) params.set("categoria", categoria);
    if (q) params.set("q", q);
    if (p > 1) params.set("pagina", String(p));
    const qs = params.toString();
    return `${qs ? `/?${qs}` : "/"}#catalogo`;
  }

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="mt-8 flex items-center justify-center gap-4">
      {hasPrev ? (
        <Link
          href={hrefFor(page - 1)}
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-orange-400 hover:text-orange-600"
        >
          Anterior
        </Link>
      ) : (
        <span className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-300">
          Anterior
        </span>
      )}

      <span className="text-sm text-zinc-500">
        Página {page} de {totalPages}
      </span>

      {hasNext ? (
        <Link
          href={hrefFor(page + 1)}
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-orange-400 hover:text-orange-600"
        >
          Siguiente
        </Link>
      ) : (
        <span className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-300">
          Siguiente
        </span>
      )}
    </div>
  );
}
