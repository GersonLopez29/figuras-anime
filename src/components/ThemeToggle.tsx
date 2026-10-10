"use client";

import { Moon, Sun } from "lucide-react";

// Botón ☀️/🌙: cambia entre modo claro y oscuro y lo recuerda en este
// dispositivo. El ícono depende solo de la clase "dark" (sin esperar a React).
export default function ThemeToggle({ className = "" }: { className?: string }) {
  function toggle() {
    const root = document.documentElement;
    const dark = !root.classList.contains("dark");
    root.classList.toggle("dark", dark);
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      // Sin almacenamiento (modo incógnito estricto): solo dura esta visita.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Cambiar entre modo claro y oscuro"
      title="Modo claro / oscuro"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground ring-1 ring-border transition hover:bg-muted hover:text-foreground ${className}`}
    >
      <Moon className="h-4 w-4 dark:hidden" aria-hidden="true" />
      <Sun className="hidden h-4 w-4 dark:block" aria-hidden="true" />
    </button>
  );
}
