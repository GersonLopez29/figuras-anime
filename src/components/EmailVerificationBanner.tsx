"use client";

import { useState } from "react";

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
            <button
              type="button"
              onClick={handleResend}
              disabled={status === "loading"}
              className="font-semibold underline hover:text-amber-900 disabled:opacity-60"
            >
              {status === "loading" ? "Enviando..." : "Reenviar correo"}
            </button>
            {status === "error" && (
              <span className="text-red-700">No se pudo reenviar, intenta de nuevo.</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
