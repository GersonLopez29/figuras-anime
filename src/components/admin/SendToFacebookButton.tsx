"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// "Enviar a Facebook (borrador)" para el video recién generado. El video se
// sube a una carpeta temporal y la página lo deja como Reel en BORRADOR en la
// página de Facebook, para ponerle música y publicarlo desde Meta Business Suite.

type State =
  | { step: "idle" }
  | { step: "editing" }
  | { step: "uploading"; percent: number }
  | { step: "sending" }
  | { step: "done" }
  | { step: "error"; message: string };

export default function SendToFacebookButton({
  blob,
  fileName,
  defaultDescription,
  enabled,
}: {
  blob: Blob;
  fileName: string;
  defaultDescription: string;
  enabled: boolean;
}) {
  const [state, setState] = useState<State>({ step: "idle" });
  const [description, setDescription] = useState(defaultDescription);

  if (!enabled) {
    return (
      <p className="mt-2 text-xs text-muted-foreground">
        📘 Enviar a Facebook: falta configurar la conexión (FACEBOOK_PAGE_ID y FACEBOOK_PAGE_TOKEN en
        Vercel).
      </p>
    );
  }

  async function send() {
    try {
      setState({ step: "uploading", percent: 0 });
      const type = blob.type.split(";")[0] || "video/mp4";
      const ext = type === "video/webm" ? "webm" : "mp4";
      const file = new File([blob], fileName.replace(/\.[a-z0-9]+$/i, `.${ext}`), { type });
      const uploaded = await upload(`facebook-tmp/${file.name}`, file, {
        access: "public",
        contentType: type,
        handleUploadUrl: "/api/admin/facebook/upload",
        onUploadProgress: (p) => setState({ step: "uploading", percent: Math.round(p.percentage) }),
      });
      setState({ step: "sending" });
      const res = await fetch("/api/admin/facebook/reel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: uploaded.url, description }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "No se pudo enviar a Facebook");
      setState({ step: "done" });
    } catch (err) {
      setState({ step: "error", message: err instanceof Error ? err.message : "No se pudo enviar a Facebook" });
    }
  }

  if (state.step === "done") {
    return (
      <div className="mt-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
        <p className="font-semibold">📘 Listo: quedó como borrador en tu página de Facebook.</p>
        <p className="mt-1 text-xs">
          Ábrelo en Meta Business Suite (o en la app de Facebook) en los borradores de Reels, agrégale
          música y publícalo cuando quieras. No se publicó nada todavía.
        </p>
        <a
          href="https://business.facebook.com/"
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block text-xs font-semibold underline"
        >
          Abrir Meta Business Suite
        </a>
      </div>
    );
  }

  const busy = state.step === "uploading" || state.step === "sending";

  if (state.step === "idle") {
    return (
      <div className="mt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setState({ step: "editing" })}
          className="rounded-full border-[#1877F2]/40 bg-white font-bold text-[#1877F2] hover:bg-blue-50 dark:bg-transparent dark:hover:bg-blue-950/40"
        >
          📘 Enviar a Facebook (borrador)
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-[#1877F2]/30 bg-white p-3 text-foreground dark:bg-transparent">
      <label htmlFor="fb-description" className="block text-xs font-semibold">
        Texto del Reel (lo puedes cambiar también en Facebook)
      </label>
      <Textarea
        id="fb-description"
        rows={5}
        maxLength={2200}
        value={description}
        disabled={busy}
        onChange={(e) => setDescription(e.target.value)}
        className="text-sm"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={send}
          disabled={busy}
          className="rounded-full bg-[#1877F2] font-bold text-white hover:bg-[#166fe0]"
        >
          {state.step === "uploading"
            ? `Subiendo video… ${state.percent}%`
            : state.step === "sending"
              ? "Creando el borrador en Facebook…"
              : "📘 Guardar como borrador"}
        </Button>
        {!busy && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setState({ step: "idle" })}>
            Cancelar
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Queda en borrador (no se publica). Así le pones una canción en tendencia antes de publicarlo.
      </p>
      {state.step === "error" && <p className="text-sm text-destructive">{state.message}</p>}
    </div>
  );
}
