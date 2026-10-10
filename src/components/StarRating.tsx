type StarRatingProps = {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md";
  label?: "reseña" | "calificación";
};

export default function StarRating({ rating, reviewCount, size = "sm", label = "reseña" }: StarRatingProps) {
  const rounded = Math.round(rating);
  const starClass = size === "md" ? "text-lg" : "text-sm";
  const plural = label === "calificación" ? "calificaciones" : "reseñas";

  return (
    <div className="flex items-center gap-1.5">
      <div className={`flex ${starClass} text-amber-400`} aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i}>{i < rounded ? "★" : "☆"}</span>
        ))}
      </div>
      {reviewCount !== undefined && (
        <span className="text-xs text-muted-foreground">
          {reviewCount > 0
            ? `${rating.toFixed(1)} (${reviewCount} ${reviewCount === 1 ? label : plural})`
            : `Sin ${plural} todavía`}
        </span>
      )}
    </div>
  );
}
