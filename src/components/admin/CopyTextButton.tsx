"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function CopyTextButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el texto sigue visible para copiarlo a mano.
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick} className="rounded-full">
      {copied ? "✓ Copiado" : "Copiar texto"}
    </Button>
  );
}
