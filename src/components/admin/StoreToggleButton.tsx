"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function StoreToggleButton({
  userId,
  isOfficialStore,
}: {
  userId: string;
  isOfficialStore: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}/store`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOfficialStore: !isOfficialStore }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className={`rounded-full whitespace-nowrap ${
        isOfficialStore ? "border-orange-300 text-orange-700" : "text-muted-foreground"
      }`}
    >
      {loading ? "Guardando..." : isOfficialStore ? "Quitar de la tienda" : "Marcar como tienda"}
    </Button>
  );
}
