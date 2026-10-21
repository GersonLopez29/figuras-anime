import type { MetadataRoute } from "next";

// Hace que la página se pueda instalar como app en el celular (ícono en la
// pantalla de inicio, abre a pantalla completa). Next lo sirve en
// /manifest.webmanifest y agrega el <link> solo.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GerStore — Compra y venta de figuras de anime",
    short_name: "GerStore",
    description:
      "Compra y vende figuras de anime en Perú: Naruto, Dragon Ball Z y más, directo por WhatsApp.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafafa",
    theme_color: "#ea580c",
    lang: "es-PE",
    categories: ["shopping", "entertainment"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Accesos directos al mantener presionado el ícono (Android).
    shortcuts: [
      { name: "Publicar una figura", short_name: "Publicar", url: "/publicar" },
      { name: "Mis figuras", url: "/mis-figuras" },
      { name: "Favoritos", url: "/favoritos" },
    ],
  };
}
