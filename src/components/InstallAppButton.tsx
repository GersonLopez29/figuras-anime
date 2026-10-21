"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Evento de Chrome/Edge/Samsung Internet para instalar la página como app.
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Se guarda a nivel de módulo: el evento llega una sola vez por carga, y el
// botón puede estar en el pie y en el menú a la vez.
let deferredPrompt: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
let registered = false;

function setup() {
  if (registered || typeof window === "undefined") return;
  registered = true;
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as InstallPromptEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    listeners.forEach((l) => l());
  });
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

// Botón "Instalar la app". En Android/computadora abre el instalador del
// navegador; en iPhone/iPad (Safari no tiene instalador) muestra los pasos.
// No se muestra si ya está instalada o si el navegador no lo permite.
type Mode = "none" | "prompt" | "ios" | "installed";

function subscribe(onChange: () => void) {
  setup();
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function getMode(): Mode {
  if (isStandalone()) return "installed";
  if (deferredPrompt) return "prompt";
  if (isIos()) return "ios";
  return "none";
}

export default function InstallAppButton({ className = "" }: { className?: string }) {
  // En el servidor no se muestra; en el navegador se actualiza solo cuando
  // llega (o se usa) el permiso de instalar.
  const mode = useSyncExternalStore(subscribe, getMode, () => "none" as Mode);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const ios = mode === "ios";

  if (mode === "none" || mode === "installed") return null;

  async function install() {
    if (ios) {
      setShowIosHelp(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      deferredPrompt = null;
      listeners.forEach((l) => l());
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={install}
        className={`rounded-full border-orange-300 font-semibold text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-950/40 ${className}`}
      >
        <span aria-hidden="true">📲</span> Instalar la app
      </Button>
      <Dialog open={showIosHelp} onOpenChange={setShowIosHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>📲 Instala GerStore en tu iPhone</DialogTitle>
            <DialogDescription>Son dos toques, desde Safari:</DialogDescription>
          </DialogHeader>
          <ol className="space-y-2 text-sm text-foreground">
            <li>
              1. Toca el botón <strong>Compartir</strong> (el cuadrado con la flecha ⬆️) en la barra
              de Safari.
            </li>
            <li>
              2. Elige <strong>&quot;Agregar a pantalla de inicio&quot;</strong> y luego{" "}
              <strong>Agregar</strong>.
            </li>
          </ol>
          <p className="text-xs text-muted-foreground">
            Si estás en otro navegador (Chrome, Instagram, TikTok), primero abre gerstore.club en Safari.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
