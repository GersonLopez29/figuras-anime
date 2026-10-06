"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type StoryShareButtonProps = {
  // URL de la imagen (ej. /figura/abc/historia).
  imageUrl: string;
  fileName: string;
  shareText: string;
  label?: string;
  size?: "sm" | "default";
  className?: string;
};

// En el celular abre el menú de compartir con la imagen (Instagram, Facebook,
// WhatsApp, TikTok…). Si el navegador no puede compartir archivos (la mayoría
// de computadoras), la descarga.
export default function StoryShareButton({
  imageUrl,
  fileName,
  shareText,
  label = "📲 Imagen para historia",
  size = "default",
  className = "",
}: StoryShareButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "downloaded" | "error">("idle");

  async function handleClick() {
    setStatus("loading");
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text: shareText });
        } catch {
          // El usuario cerró el menú de compartir.
        }
        setStatus("idle");
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
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size === "sm" ? "sm" : "default"}
      onClick={handleClick}
      disabled={status === "loading"}
      className={`rounded-full ${className}`}
    >
      {status === "loading"
        ? "Preparando imagen..."
        : status === "downloaded"
          ? "✓ Imagen descargada"
          : status === "error"
            ? "No se pudo, intenta de nuevo"
            : label}
    </Button>
  );
}
