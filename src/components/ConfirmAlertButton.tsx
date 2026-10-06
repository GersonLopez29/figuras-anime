"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ConfirmAlertButton({ token, query }: { token: string; query: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleClick() {
    setStatus("loading");
    const res = await fetch("/api/alerts/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    setStatus(res.ok ? "done" : "error");
  }

  if (status === "done") {
    return (
      <>
        <p className="mt-6 text-sm font-medium text-green-700">
          ✓ ¡Aviso activado! Te escribiremos cuando publiquen <strong>{query}</strong>.
        </p>
        <Button
          render={<Link href={`/?q=${encodeURIComponent(query)}#catalogo`} />}
          nativeButton={false}
          variant="outline"
          className="mt-4 rounded-full"
        >
          Ver lo que hay ahora
        </Button>
      </>
    );
  }

  return (
    <>
      <Button
        type="button"
        onClick={handleClick}
        disabled={status === "loading"}
        className="mt-6 rounded-full"
      >
        {status === "loading" ? "Activando..." : "🔔 Activar aviso"}
      </Button>
      {status === "error" && (
        <p className="mt-2 text-sm text-destructive">Este aviso ya no existe. Puedes crear uno nuevo.</p>
      )}
    </>
  );
}
