"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function InviteShare({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  const message = `Te invito a FigurasAnime, la página para comprar y vender figuras de anime en Perú. Publicar es gratis: ${link}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el enlace sigue visible para copiarlo a mano.
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input readOnly value={link} aria-label="Tu enlace de invitación" onFocus={(e) => e.target.select()} />
        <Button type="button" variant="outline" onClick={copy} className="shrink-0 rounded-full">
          {copied ? "✓ Copiado" : "Copiar"}
        </Button>
      </div>
      <Button
        render={
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
          />
        }
        nativeButton={false}
        className="rounded-full bg-green-600 text-white hover:bg-green-700"
      >
        💬 Enviar por WhatsApp
      </Button>
    </div>
  );
}
