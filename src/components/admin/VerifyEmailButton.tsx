"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function VerifyEmailButton({
  userId,
  emailVerified,
}: {
  userId: string;
  emailVerified: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailVerified: !emailVerified }),
    });
    setLoading(false);

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "No se pudo actualizar el usuario");
    }
  }

  if (emailVerified) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      disabled={loading}
      className="rounded-full border-orange-200 text-orange-700 hover:bg-orange-50"
    >
      {loading ? "Guardando..." : "Verificar correo"}
    </Button>
  );
}
