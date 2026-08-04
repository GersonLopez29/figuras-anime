"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeletePostButton({ postId }: { postId: string }) {
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
      router.push("/comunidad");
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-60"
    >
      {loading ? "Eliminando..." : "Eliminar publicación"}
    </button>
  );
}
