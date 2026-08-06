"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MessageButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo iniciar la conversación");
      return;
    }

    const { id } = await res.json();
    router.push(`/mensajes/${id}`);
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-orange-600 bg-white px-4 py-3 text-sm font-bold text-orange-700 hover:bg-orange-50 disabled:opacity-60"
      >
        <span aria-hidden="true">💬</span>
        {loading ? "Abriendo chat..." : "Enviar mensaje"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
