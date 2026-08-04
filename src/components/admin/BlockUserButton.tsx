"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function BlockUserButton({
  userId,
  isBlocked,
}: {
  userId: string;
  isBlocked: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBlocked: !isBlocked }),
    });
    setLoading(false);

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "No se pudo actualizar el usuario");
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-sm font-medium disabled:opacity-60 ${
        isBlocked ? "text-green-700 hover:text-green-900" : "text-amber-700 hover:text-amber-900"
      }`}
    >
      {loading ? "Guardando..." : isBlocked ? "Desbloquear" : "Bloquear"}
    </button>
  );
}
