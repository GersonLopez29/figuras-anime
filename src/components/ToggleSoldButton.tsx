"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className={`rounded-full ${sold ? "text-muted-foreground" : "border-green-200 text-green-700 hover:bg-green-50"}`}
    >
      {loading ? "Guardando..." : sold ? "Marcar como disponible" : "Marcar como vendido"}
    </Button>
  );
}
