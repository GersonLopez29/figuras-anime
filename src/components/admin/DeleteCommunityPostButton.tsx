"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteCommunityPostButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("¿Eliminar esta publicación? También se borrarán sus comentarios y calificaciones.")) {
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/community/${postId}`, { method: "DELETE" });
    setLoading(false);

    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="shrink-0 rounded-full border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-60"
    >
      {loading ? "Eliminando..." : "Eliminar"}
    </button>
  );
}
