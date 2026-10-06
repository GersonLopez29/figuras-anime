"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type StoryShareButtonProps = {
  // URL de la imagen (ej. /figura/abc/historia).
  imageUrl: string;
  fileName: string;
  // Texto con el enlace: se copia al portapapeles para pegarlo en la descripción.
  shareText: string;
  label?: string;
  size?: "sm" | "default";
  className?: string;
  // Muestra debajo del botón una línea explicando cómo publicar.
  showHint?: boolean;
};

// En el celular abre el menú de compartir con la imagen (Instagram, TikTok,
// Facebook, WhatsApp…). Si el navegador no puede compartir archivos (la mayoría
// de computadoras), la descarga.
//
// Solo se comparte la imagen, sin texto: TikTok no recibe enlaces ni texto, y
// en iPhone desaparece del menú si se le pasa texto junto con la foto. Por eso
// el texto con el enlace se copia al portapapeles para pegarlo al publicar.
export default function StoryShareButton({
  imageUrl,
  fileName,
  shareText,
  label = "📲 Imagen para historia",
  size = "default",
  className = "",
  showHint = false,
}: StoryShareButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "copied" | "downloaded" | "error">(
    "idle"
  );

  function resetLater(ms: number) {
    setTimeout(() => setStatus("idle"), ms);
  }

  async function handleClick() {
    setStatus("loading");

    // Se copia antes de cualquier espera: Safari solo permite copiar
    // inmediatamente después del toque.
    const copied = navigator.clipboard
      ?.writeText(shareText)
      .then(() => true)
      .catch(() => false) ?? Promise.resolve(false);

    try {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
        } catch {
          // El usuario cerró el menú de compartir.
        }
        setStatus((await copied) ? "copied" : "idle");
        resetLater(4000);
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setStatus("downloaded");
      resetLater(4000);
    } catch {
      setStatus("error");
      resetLater(3000);
    }
  }

  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        size={size === "sm" ? "sm" : "default"}
        onClick={handleClick}
        disabled={status === "loading"}
        className="w-full rounded-full"
      >
        {status === "loading"
          ? "Preparando imagen..."
          : status === "copied"
            ? "✓ Enlace copiado, pégalo al publicar"
            : status === "downloaded"
              ? "✓ Imagen descargada y enlace copiado"
              : status === "error"
                ? "No se pudo, intenta de nuevo"
                : label}
      </Button>
      {showHint && (
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          Sirve para Instagram, TikTok, Facebook y WhatsApp. El enlace se copia solo: pégalo en
          la descripción.
        </p>
      )}
    </div>
  );
}
