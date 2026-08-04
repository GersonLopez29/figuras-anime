"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteListingButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("¿Seguro que quieres eliminar esta publicación?")) return;

    setLoading(true);
    const res = await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
    setLoading(false);

    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-60"
    >
      {loading ? "Eliminando..." : "Eliminar"}
    </button>
  );
}
