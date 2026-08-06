"use client";

import { useRouter } from "next/navigation";
import { useState, MouseEvent } from "react";

type FavoriteButtonProps = {
  listingId: string;
  initialFavorited: boolean;
  variant?: "overlay" | "inline";
};

export default function FavoriteButton({
  listingId,
  initialFavorited,
  variant = "overlay",
}: FavoriteButtonProps) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  async function handleClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    const next = !favorited;
    setFavorited(next);
    setLoading(true);

    const res = await fetch(`/api/listings/${listingId}/favorite`, {
      method: next ? "POST" : "DELETE",
    });

    setLoading(false);

    if (!res.ok) {
      setFavorited(!next);
      return;
    }
    router.refresh();
  }

  const baseClass =
    variant === "overlay"
      ? "absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-110"
      : "flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white transition hover:border-red-300";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={favorited ? "Quitar de favoritos" : "Guardar en favoritos"}
      className={`${baseClass} disabled:opacity-60`}
    >
      <span aria-hidden="true">{favorited ? "❤️" : "🤍"}</span>
    </button>
  );
}
