import { Badge } from "@/components/ui/badge";
import { TRUST_MIN_REVIEWS, TRUST_MIN_SALES } from "@/lib/trust";

export const TRUSTED_SELLER_EXPLANATION = `Tiene ${TRUST_MIN_SALES} o más ventas, al menos ${TRUST_MIN_REVIEWS} reseñas con buena calificación y más de un mes en FigurasAnime.`;

export default function TrustedSellerBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <Badge
      variant="outline"
      title={TRUSTED_SELLER_EXPLANATION}
      className={`border-amber-300 bg-amber-50 font-semibold text-amber-800 ${size === "md" ? "h-auto px-2.5 py-1 text-sm" : ""}`}
    >
      🏅 Vendedor confiable
    </Badge>
  );
}
