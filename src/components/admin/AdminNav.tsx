"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ADMIN_NAV, ADMIN_NAV_ITEMS, isActiveAdminHref } from "@/components/admin/adminNavItems";

type AdminNavProps = {
  // Pendientes por sección (ej. { "/admin/destacados": 2 }) para el contador.
  pendingCounts: Record<string, number>;
};

function PendingBadge({ count, active }: { count: number; active?: boolean }) {
  if (count <= 0) return null;
  return (
    <span
      className={`ml-auto inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold tabular-nums ${
        active ? "bg-white/25 text-white" : "bg-primary text-primary-foreground"
      }`}
    >
      {count}
    </span>
  );
}

function NavList({
  pathname,
  pendingCounts,
  onNavigate,
  withDescriptions = false,
}: AdminNavProps & { pathname: string; onNavigate?: () => void; withDescriptions?: boolean }) {
  return (
    <nav aria-label="Secciones del panel" className="space-y-5">
      {ADMIN_NAV.map((group) => (
        <div key={group.title}>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {group.title}
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {group.items.map((item) => {
              const active = isActiveAdminHref(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                      active
                        ? "bg-primary font-semibold text-primary-foreground"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block">{item.label}</span>
                      {withDescriptions && (
                        <span
                          className={`block text-xs font-normal ${
                            active ? "text-primary-foreground/80" : "text-muted-foreground"
                          }`}
                        >
                          {item.description}
                        </span>
                      )}
                    </span>
                    <PendingBadge count={pendingCounts[item.href] ?? 0} active={active} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

// Barra lateral fija (computadora).
export function AdminSidebar({ pendingCounts }: AdminNavProps) {
  const pathname = usePathname();
  return <NavList pathname={pathname} pendingCounts={pendingCounts} />;
}

// Celular/tablet: botón con la sección actual que abre el menú completo.
export function AdminMobileNav({ pendingCounts }: AdminNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = ADMIN_NAV_ITEMS.find((item) => isActiveAdminHref(pathname, item.href));
  const totalPending = Object.values(pendingCounts).reduce((a, b) => a + b, 0);
  const CurrentIcon = current?.icon ?? Menu;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left shadow-sm transition hover:bg-muted"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CurrentIcon className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Panel admin
          </span>
          <span className="block truncate font-semibold text-foreground">
            {current?.label ?? "Secciones"}
          </span>
        </span>
        {totalPending > 0 && (
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
            {totalPending} por atender
          </span>
        )}
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Panel de administrador</SheetTitle>
          </SheetHeader>
          <div className="px-2 pb-6">
            <NavList
              pathname={pathname}
              pendingCounts={pendingCounts}
              onNavigate={() => setOpen(false)}
              withDescriptions
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
