import Link from "next/link";
import { SOLD_FILTERS, type SoldCounts, type SoldFilter } from "@/lib/soldFilter";
import { Badge } from "@/components/ui/badge";

type SoldFilterTabsProps = {
  // Página donde viven las pestañas (ej. /mis-figuras).
  basePath: string;
  active: SoldFilter;
  counts: SoldCounts;
};

// Pestañas "Todas / Disponibles / Vendidas" con la cantidad de cada una.
export default function SoldFilterTabs({ basePath, active, counts }: SoldFilterTabsProps) {
  return (
    <nav aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
      {SOLD_FILTERS.map((f) => {
        const isActive = f.value === active;
        const href = f.value === "todas" ? basePath : `${basePath}?estado=${f.value}`;
        return (
          <Badge
            key={f.value}
            render={<Link href={href} aria-current={isActive ? "page" : undefined} />}
            variant={isActive ? "default" : "outline"}
            className="h-auto gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium"
          >
            {f.label}
            <span className={isActive ? "opacity-80" : "text-muted-foreground"}>
              {counts[f.value]}
            </span>
          </Badge>
        );
      })}
    </nav>
  );
}
