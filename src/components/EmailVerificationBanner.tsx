"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function EmailVerificationBanner() {
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  async function handleResend() {
    setStatus("loading");
    const res = await fetch("/api/auth/resend-verification", { method: "POST" });
    setStatus(res.ok ? "sent" : "error");
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 px-4 py-2 text-center text-sm text-amber-800">
        {status === "sent" ? (
          <span>✓ Te reenviamos el correo de verificación, revisa tu bandeja.</span>
        ) : (
          <>
            <span aria-hidden="true">📧</span>
            <span>Confirma tu correo para verificar tu cuenta.</span>
            <Button
              type="button"
              variant="link"
              onClick={handleResend}
              disabled={status === "loading"}
              className="h-auto p-0 font-semibold text-amber-800 underline hover:text-amber-900"
            >
              {status === "loading" ? "Enviando..." : "Reenviar correo"}
            </Button>
            {status === "error" && (
              <span className="text-red-700">No se pudo reenviar, intenta de nuevo.</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
