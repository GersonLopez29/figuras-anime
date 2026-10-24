"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

// Script de Google AdSense (anuncios automáticos). No se carga en las páginas
// privadas o de formularios: ahí los anuncios no aportan, distraen y pueden
// causar clics accidentales (que AdSense penaliza). Si la persona entra
// primero a una página pública el script ya queda cargado; para cubrir ese
// caso, en AdSense → Anuncios → Exclusiones de páginas se excluyen también
// estas mismas rutas.
const AD_CLIENT = "ca-pub-3110338196429688";

const NO_ADS_PREFIXES = [
  "/admin",
  "/login",
  "/registro",
  "/olvide-password",
  "/restablecer-password",
  "/verificar-email",
  "/mensajes",
  "/mis-figuras",
  "/publicar",
  "/favoritos",
  "/invitar",
  "/r",
];

export function adsAllowed(pathname: string): boolean {
  return !NO_ADS_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function AdSenseScript() {
  const pathname = usePathname() ?? "/";
  if (!adsAllowed(pathname)) return null;
  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
