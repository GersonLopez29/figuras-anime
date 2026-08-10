"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      disabled={loading}
      className={`rounded-full ${
        isBlocked
          ? "border-green-200 text-green-700 hover:bg-green-50"
          : "border-amber-200 text-amber-700 hover:bg-amber-50"
      }`}
    >
      {loading ? "Guardando..." : isBlocked ? "Desbloquear" : "Bloquear"}
    </Button>
  );
}
