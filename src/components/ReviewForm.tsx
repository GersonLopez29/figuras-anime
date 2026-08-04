"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import StarPicker from "@/components/StarPicker";

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
    <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="text-sm font-medium text-zinc-700">Tu calificación</p>
      <div className="mt-1">
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <textarea
        required
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Cuéntale a otros cómo fue tu experiencia comprando o vendiendo con esta persona"
        className="mt-3 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
      />

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-3 rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
      >
        {loading ? "Publicando..." : "Publicar reseña"}
      </button>
    </form>
  );
}
