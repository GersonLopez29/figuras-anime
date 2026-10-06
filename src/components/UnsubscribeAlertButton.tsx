"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function UnsubscribeAlertButton({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleClick() {
    setStatus("loading");
    const res = await fetch("/api/alerts/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    setStatus(res.ok ? "done" : "error");
  }

  if (status === "done") {
    return <p className="mt-6 text-sm font-medium text-green-700">✓ Listo, ya no te escribiremos por este aviso.</p>;
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={status === "loading"}
        className="mt-6 rounded-full"
      >
        {status === "loading" ? "Dando de baja..." : "Dejar de recibir este aviso"}
      </Button>
      {status === "error" && (
        <p className="mt-2 text-sm text-destructive">No se pudo, intenta de nuevo.</p>
      )}
    </>
  );
}
