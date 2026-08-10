"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={loading}
        size="lg"
        className="mt-3 w-full rounded-full border-primary text-primary hover:bg-primary/5"
      >
        <span aria-hidden="true">💬</span>
        {loading ? "Abriendo chat..." : "Enviar mensaje"}
      </Button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
