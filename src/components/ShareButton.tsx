"use client";

import { useState, MouseEvent } from "react";
import { Share2, Check } from "lucide-react";

type ShareButtonProps = {
  title: string;
  text: string;
  url: string;
};

export default function ShareButton({ title, text, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // El usuario cerró el diálogo de compartir, no pasa nada.
      }
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Compartir esta figura"
      className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card transition hover:border-primary/40"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Share2 className="h-4 w-4 text-foreground/70" />
      )}
    </button>
  );
}
