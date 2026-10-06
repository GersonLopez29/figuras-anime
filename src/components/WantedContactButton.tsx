"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// Igual que el contacto de las figuras: el número del comprador no va escrito
// en la página, se pide al servidor al tocar el botón.
export default function WantedContactButton({ postId }: { postId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setLoading(true);
    const tab = window.open("", "_blank");
    try {
      const res = await fetch(`/api/wanted/${postId}/contact`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        tab?.close();
        setError(data.error ?? "No se pudo abrir WhatsApp");
        return;
      }
      if (tab) {
        tab.opener = null;
        tab.location.href = data.url;
      } else {
        window.location.href = data.url;
      }
    } catch {
      tab?.close();
      setError("No se pudo abrir WhatsApp, revisa tu conexión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        size="sm"
        onClick={handleClick}
        disabled={loading}
        className="rounded-full bg-green-600 text-white hover:bg-green-700"
      >
        {loading ? "Abriendo..." : "💬 Tengo esta figura"}
      </Button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
