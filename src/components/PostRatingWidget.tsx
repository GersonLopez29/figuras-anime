"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import StarRating from "@/components/StarRating";
import StarPicker from "@/components/StarPicker";

type PostRatingWidgetProps = {
  postId: string;
  averageRating: number;
  ratingCount: number;
  canRate: boolean;
  initialUserValue: number | null;
};

export default function PostRatingWidget({
  postId,
  averageRating,
  ratingCount,
  canRate,
  initialUserValue,
}: PostRatingWidgetProps) {
  const router = useRouter();
  const [userValue, setUserValue] = useState(initialUserValue ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitRating(value: number) {
    setUserValue(value);
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/community/${postId}/rating`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo guardar tu calificación");
      return;
    }

    router.refresh();
  }

  return (
    <div className="rounded-lg bg-muted/50 p-4">
      <StarRating rating={averageRating} reviewCount={ratingCount} size="md" label="calificación" />

      {canRate && (
        <div className="mt-3">
          <p className="text-xs font-medium text-muted-foreground">
            {userValue > 0 ? "Tu calificación" : "Califica esta colección"}
          </p>
          <div className="mt-1">
            <StarPicker value={userValue} onChange={submitRating} />
          </div>
          {loading && <p className="mt-1 text-xs text-muted-foreground">Guardando...</p>}
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}
