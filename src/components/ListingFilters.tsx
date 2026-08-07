import Link from "next/link";

type ListingFiltersProps = {
  estado?: "nuevo" | "usado";
  oferta?: boolean;
  category?: string;
  q?: string;
};

export default function ListingFilters({ estado, oferta, category, q }: ListingFiltersProps) {
  function hrefFor(nextEstado: "nuevo" | "usado" | undefined, nextOferta: boolean) {
    const params = new URLSearchParams();
    if (category) params.set("categoria", category);
    if (q) params.set("q", q);
    if (nextEstado) params.set("estado", nextEstado);
    if (nextOferta) params.set("oferta", "1");
    const qs = params.toString();
    return `${qs ? `/?${qs}` : "/"}#catalogo`;
  }

  function pillClass(active: boolean) {
    return `shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
      active
        ? "bg-orange-600 text-white"
        : "border border-zinc-300 text-zinc-600 hover:border-orange-300"
    }`;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <Link href={hrefFor(undefined, false)} className={pillClass(!estado && !oferta)}>
        Todas
      </Link>
      <Link
        href={hrefFor(estado === "nuevo" ? undefined : "nuevo", !!oferta)}
        className={pillClass(estado === "nuevo")}
      >
        🆕 Nuevas
      </Link>
      <Link
        href={hrefFor(estado === "usado" ? undefined : "usado", !!oferta)}
        className={pillClass(estado === "usado")}
      >
        ♻️ Usadas
      </Link>
      <Link href={hrefFor(estado, !oferta)} className={pillClass(!!oferta)}>
        🔥 En oferta
      </Link>
    </div>
  );
}
