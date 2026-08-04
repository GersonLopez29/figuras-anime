"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ToggleSoldButtonProps = {
  listingId: string;
  sold: boolean;
};

export default function ToggleSoldButton({ listingId, sold }: ToggleSoldButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch(`/api/listings/${listingId}/sold`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sold: !sold }),
    });
    setLoading(false);

    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`text-sm font-medium disabled:opacity-60 ${
        sold ? "text-zinc-600 hover:text-zinc-900" : "text-green-700 hover:text-green-900"
      }`}
    >
      {loading ? "Guardando..." : sold ? "Marcar como disponible" : "Marcar como vendido"}
    </button>
  );
}
