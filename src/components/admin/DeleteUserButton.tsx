"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`¿Eliminar la cuenta de "${userName}"? Esto borra también sus publicaciones y reseñas.`)) {
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    setLoading(false);

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "No se pudo eliminar el usuario");
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
