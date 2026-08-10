"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import StarPicker from "@/components/StarPicker";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ReviewForm({ sellerId }: { sellerId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerId, rating, comment }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo publicar la reseña");
      return;
    }

    setComment("");
    setRating(5);
    router.refresh();
  }

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit}>
        <p className="text-sm font-medium text-foreground/80">Tu calificación</p>
        <div className="mt-1">
          <StarPicker value={rating} onChange={setRating} />
        </div>

        <Textarea
          required
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Cuéntale a otros cómo fue tu experiencia comprando o vendiendo con esta persona"
          className="mt-3"
        />

        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={loading} className="mt-3 rounded-full">
          {loading ? "Publicando..." : "Publicar reseña"}
        </Button>
      </form>
    </Card>
  );
}
