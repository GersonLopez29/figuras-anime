import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { catalogHref, type CatalogState } from "@/lib/catalog";

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

export default function ListingFilters({ state }: { state: CatalogState }) {
  const { estado, oferta, preventa } = state;

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      <Pill
        active={!estado && !oferta && !preventa}
        href={catalogHref({ ...state, estado: undefined, oferta: false, preventa: false })}
      >
        Todas
      </Pill>
      <Pill
        active={estado === "nuevo"}
        href={catalogHref({ ...state, estado: estado === "nuevo" ? undefined : "nuevo" })}
      >
        🆕 Nuevas
      </Pill>
      <Pill
        active={estado === "usado"}
        href={catalogHref({ ...state, estado: estado === "usado" ? undefined : "usado" })}
      >
        ♻️ Usadas
      </Pill>
      <Pill active={!!oferta} href={catalogHref({ ...state, oferta: !oferta })}>
        🔥 En oferta
      </Pill>
      <Pill active={!!preventa} href={catalogHref({ ...state, preventa: !preventa })}>
        🕒 Preventas
      </Pill>
    </div>
  );
}
