import { Badge } from "@/components/ui/badge";
import { salesBadge } from "@/lib/sellerRewards";

// Insignia de logro por ventas (🥉 1 · 🥈 5 · 🥇 10). No muestra nada si el
// vendedor aún no vendió.
export default function SalesBadge({ sales, size = "sm" }: { sales: number; size?: "sm" | "md" }) {
  const badge = salesBadge(sales);
  if (!badge) return null;
  return (
    <Badge
      variant="outline"
      title={`${sales} ${sales === 1 ? "figura vendida" : "figuras vendidas"} en GerStore`}
      className={`border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40 font-semibold text-orange-800 dark:text-orange-300 ${size === "md" ? "h-auto px-2.5 py-1 text-sm" : ""}`}
    >
      {badge.icon} {badge.label}
    </Badge>
  );
}
