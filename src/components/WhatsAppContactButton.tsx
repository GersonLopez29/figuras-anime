"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// El enlace de WhatsApp se pide al servidor recién al tocar el botón (así el
// número del vendedor no queda escrito en la página).
export function useWhatsAppContact(listingId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setError(null);
    setLoading(true);
    // La pestaña se abre en el mismo clic: si se abriera después de la
    // respuesta, el navegador la bloquearía como ventana emergente.
    const tab = window.open("", "_blank");

    try {
      const res = await fetch(`/api/listings/${listingId}/whatsapp-click`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.link) {
        tab?.close();
        setError(data.error ?? "No se pudo abrir WhatsApp, intenta de nuevo.");
        return;
      }
      if (tab) {
        tab.opener = null;
        tab.location.href = data.link;
      } else {
        window.location.href = data.link;
      }
    } catch {
      tab?.close();
      setError("No se pudo abrir WhatsApp, revisa tu conexión.");
    } finally {
      setLoading(false);
    }
  }

  return { open, loading, error };
}

export const WHATSAPP_BUTTON_CLASS =
  "rounded-full bg-green-600 text-sm font-bold text-white shadow-md shadow-green-600/20 transition hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-lg";

export default function WhatsAppContactButton({ listingId }: { listingId: string }) {
  const { open, loading, error } = useWhatsAppContact(listingId);

  return (
    <div>
      <Button
        type="button"
        onClick={open}
        disabled={loading}
        size="lg"
        className={`w-full ${WHATSAPP_BUTTON_CLASS}`}
      >
        <span aria-hidden="true">💬</span>
        {loading ? "Abriendo WhatsApp..." : "Contactar por WhatsApp"}
      </Button>
      {error ? (
        <p className="mt-2 text-center text-sm text-destructive">{error}</p>
      ) : (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          No necesitas cuenta: se abre WhatsApp con un mensaje listo para el vendedor.
        </p>
      )}
    </div>
  );
}
