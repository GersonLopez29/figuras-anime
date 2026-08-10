import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type ListingFiltersProps = {
  estado?: "nuevo" | "usado";
  oferta?: boolean;
  category?: string;
  q?: string;
};

function Pill({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <Badge
      variant={active ? "default" : "outline"}
      className="h-auto shrink-0 rounded-full px-4 py-2 text-sm font-medium hover:border-primary/50"
      render={<Link href={href} />}
    >
      {children}
    </Badge>
  );
}

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

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <Pill active={!estado && !oferta} href={hrefFor(undefined, false)}>
        Todas
      </Pill>
      <Pill active={estado === "nuevo"} href={hrefFor(estado === "nuevo" ? undefined : "nuevo", !!oferta)}>
        🆕 Nuevas
      </Pill>
      <Pill active={estado === "usado"} href={hrefFor(estado === "usado" ? undefined : "usado", !!oferta)}>
        ♻️ Usadas
      </Pill>
      <Pill active={!!oferta} href={hrefFor(estado, !oferta)}>
        🔥 En oferta
      </Pill>
    </div>
  );
}
