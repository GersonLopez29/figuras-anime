"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DRIVE_CLIENT_ID, DRIVE_FOLDER_NAME, loadGoogleScript, uploadToDrive } from "@/lib/googleDrive";

// "Guardar en Google Drive" para el video recién generado (panel admin).
export default function SaveToDriveButton({ blob, fileName }: { blob: Blob; fileName: string }) {
  const [state, setState] = useState<
    | { step: "idle" }
    | { step: "connecting" }
    | { step: "uploading"; percent: number }
    | { step: "done"; link: string }
    | { step: "error"; message: string }
  >({ step: "idle" });

  // Precarga el script de Google para que la ventana de permiso abra al toque.
  useEffect(() => {
    if (DRIVE_CLIENT_ID) loadGoogleScript().catch(() => {});
  }, []);

  if (!DRIVE_CLIENT_ID) {
    return (
      <p className="mt-2 text-xs text-muted-foreground">
        ☁️ Guardar en Google Drive: falta configurar la conexión con Google
        (NEXT_PUBLIC_GOOGLE_CLIENT_ID en Vercel).
      </p>
    );
  }

  async function save() {
    setState({ step: "connecting" });
    try {
      const file = await uploadToDrive(blob, fileName, (f) =>
        setState({ step: "uploading", percent: Math.round(f * 100) })
      );
      setState({ step: "done", link: file.webViewLink });
    } catch (err) {
      setState({
        step: "error",
        message: err instanceof Error ? err.message : "No se pudo guardar en Google Drive",
      });
    }
  }

  if (state.step === "done") {
    return (
      <p className="mt-2 text-sm">
        ☁️ Guardado en tu Drive, carpeta <strong>{DRIVE_FOLDER_NAME}</strong>.{" "}
        <a href={state.link} target="_blank" rel="noreferrer" className="font-semibold underline">
          Abrir en Drive
        </a>
      </p>
    );
  }

  const busy = state.step === "connecting" || state.step === "uploading";
  return (
    <div className="mt-2">
      <Button
        type="button"
        onClick={save}
        disabled={busy}
        variant="outline"
        className="rounded-full border-blue-300 bg-white font-bold text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:bg-transparent dark:text-blue-300 dark:hover:bg-blue-950/40"
      >
        {state.step === "connecting"
          ? "Conectando con Google…"
          : state.step === "uploading"
            ? `Subiendo a Drive… ${state.percent}%`
            : "☁️ Guardar en Google Drive"}
      </Button>
      {state.step === "error" && <p className="mt-1 text-sm text-destructive">{state.message}</p>}
    </div>
  );
}
