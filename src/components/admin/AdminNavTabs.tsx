"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminNavTabsProps = {
  pendingCategoryRequests: number;
};

const TABS = [
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/publicaciones", label: "Publicaciones" },
  { href: "/admin/comunidad", label: "Comunidad" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/estadisticas", label: "Estadísticas" },
] as const;

export default function AdminNavTabs({ pendingCategoryRequests }: AdminNavTabsProps) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-orange-600 text-white shadow-sm"
                : "border border-zinc-200 text-zinc-600 hover:border-orange-300 hover:text-zinc-900"
            }`}
          >
            {tab.label}
            {tab.href === "/admin/categorias" && pendingCategoryRequests > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  active ? "bg-white/20 text-white" : "bg-orange-100 text-orange-700"
                }`}
              >
                {pendingCategoryRequests}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
