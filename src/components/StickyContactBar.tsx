"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWhatsAppContact, WHATSAPP_BUTTON_CLASS } from "@/components/WhatsAppContactButton";

type StickyContactBarProps = {
  listingId: string;
  priceLabel: string;
  originalPriceLabel?: string | null;
  // id del bloque con el botón principal: la barra se oculta cuando se ve.
  targetId: string;
};

// Solo en celular: barra fija abajo con el precio y el botón de WhatsApp,
// visible mientras el botón principal de la ficha no está en pantalla.
export default function StickyContactBar({
  listingId,
  priceLabel,
  originalPriceLabel,
  targetId,
}: StickyContactBarProps) {
  const { open, loading, error } = useWhatsAppContact(listingId);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting));
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);

  // Avisa al resto de la página (ej. sube el botón flotante de sugerencias).
  useEffect(() => {
    const root = document.documentElement;
    if (visible) root.dataset.stickyBar = "1";
    else delete root.dataset.stickyBar;
    return () => {
      delete root.dataset.stickyBar;
    };
  }, [visible]);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur transition-transform duration-300 sm:hidden ${
        visible ? "translate-y-0" : "pointer-events-none translate-y-full"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 leading-tight">
          {originalPriceLabel && (
            <p className="text-xs text-muted-foreground line-through">{originalPriceLabel}</p>
          )}
          <p className="text-lg font-bold text-primary">{priceLabel}</p>
        </div>
        <Button
          type="button"
          onClick={open}
          disabled={loading}
          tabIndex={visible ? 0 : -1}
          className={`h-11 flex-1 ${WHATSAPP_BUTTON_CLASS}`}
        >
          <span aria-hidden="true">💬</span>
          {loading ? "Abriendo..." : "Contactar por WhatsApp"}
        </Button>
      </div>
      {error && <p className="mt-1.5 text-center text-xs text-destructive">{error}</p>}
    </div>
  );
}
