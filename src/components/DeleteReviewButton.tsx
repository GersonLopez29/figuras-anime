"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteReviewButton({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("¿Eliminar tu reseña?")) return;

    setLoading(true);
    const res = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
    setLoading(false);

    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-60"
    >
      {loading ? "Eliminando..." : "Eliminar"}
    </button>
  );
}
