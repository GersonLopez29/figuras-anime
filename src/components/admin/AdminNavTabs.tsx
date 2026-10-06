"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";

type AdminNavTabsProps = {
  // Pendientes por pestaña (ej. { "/admin/categorias": 2 }) para mostrar un contador.
  pendingCounts: Record<string, number>;
};

const TABS = [
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/publicaciones", label: "Publicaciones" },
  { href: "/admin/destacados", label: "⭐ Destacados" },
  { href: "/admin/consignaciones", label: "📦 Consignaciones" },
  { href: "/admin/redes", label: "📲 Redes" },
  { href: "/admin/contactos", label: "Contactos" },
  { href: "/admin/comunidad", label: "Comunidad" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/estadisticas", label: "Estadísticas" },
] as const;

export default function AdminNavTabs({ pendingCounts }: AdminNavTabsProps) {
  const pathname = usePathname();

  return (
    <nav className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        const count = pendingCounts[tab.href] ?? 0;
        return (
          <Badge
            key={tab.href}
            render={<Link href={tab.href} />}
            variant={active ? "default" : "outline"}
            className="h-auto shrink-0 gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
          >
            {tab.label}
            {count > 0 && (
              <Badge
                variant={active ? "outline" : "secondary"}
                className={`h-auto px-1.5 py-0.5 text-xs ${active ? "border-white/30 bg-white/20 text-white" : ""}`}
              >
                {count}
              </Badge>
            )}
          </Badge>
        );
      })}
    </nav>
  );
}
