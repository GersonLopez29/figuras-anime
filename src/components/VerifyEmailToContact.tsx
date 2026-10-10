"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function VerifyEmailToContact() {
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  async function handleResend() {
    setStatus("loading");
    const res = await fetch("/api/auth/resend-verification", { method: "POST" });
    setStatus(res.ok ? "sent" : "error");
  }

  return (
    <Alert className="mt-6 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-center">
      <AlertDescription className="justify-center text-center text-amber-800 dark:text-amber-300">
        {status === "sent"
          ? "✓ Te reenviamos el correo de verificación, revisa tu bandeja."
          : "Debes verificar tu correo para contactar al vendedor."}
      </AlertDescription>
      {status !== "sent" && (
        <div className="mt-3 flex justify-center">
          <Button
            type="button"
            onClick={handleResend}
            disabled={status === "loading"}
            className="rounded-full"
          >
            {status === "loading" ? "Enviando..." : "Reenviar correo de verificación"}
          </Button>
        </div>
      )}
      {status === "error" && (
        <p className="mt-1 text-xs text-destructive">No se pudo reenviar, intenta de nuevo.</p>
      )}
    </Alert>
  );
}
