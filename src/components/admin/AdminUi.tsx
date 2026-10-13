import Link from "next/link";
import Form from "next/form";
import type { LucideIcon } from "lucide-react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Piezas comunes de las páginas del panel admin, para que todas se vean y se
// usen igual: encabezado, buscador y filtros.

export function AdminPageHeader({
  icon: Icon,
  title,
  description,
  actions,
}: {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 hidden size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex">
            <Icon className="size-5" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

// Título de un bloque dentro de una página (ej. "Solicitudes por confirmar").
export function AdminSectionTitle({
  children,
  description,
}: {
  children: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-foreground">
        {children}
      </h2>
      {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

// Arma un enlace a la misma página cambiando algunos parámetros (y quitando
// los vacíos), para que buscador y filtros se combinen.
export function adminHref(
  basePath: string,
  current: Record<string, string | undefined>,
  changes: Record<string, string | undefined>
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...changes })) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export type AdminFilter = { value: string; label: string; count?: number };

// Chips de filtro (ej. Todos / Bloqueados / Sin verificar). El primero es el
// valor por defecto y no se pone en la URL.
export function AdminFilterChips({
  basePath,
  param,
  filters,
  active,
  current,
  label,
}: {
  basePath: string;
  param: string;
  filters: AdminFilter[];
  active: string;
  current: Record<string, string | undefined>;
  label: string;
}) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {filters.map((f, i) => {
        const isActive = f.value === active;
        return (
          <Badge
            key={f.value}
            render={
              <Link
                href={adminHref(basePath, current, { [param]: i === 0 ? undefined : f.value })}
                aria-current={isActive ? "page" : undefined}
              />
            }
            variant={isActive ? "default" : "outline"}
            className="h-auto gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium"
          >
            {f.label}
            {f.count !== undefined && (
              <span className={isActive ? "opacity-80" : "text-muted-foreground"}>{f.count}</span>
            )}
          </Badge>
        );
      })}
    </nav>
  );
}

// Buscador que pone ?q= en la URL (funciona también sin JavaScript). Conserva
// los demás filtros con campos ocultos.
export function AdminSearch({
  basePath,
  query,
  placeholder,
  keep = {},
}: {
  basePath: string;
  query: string;
  placeholder: string;
  keep?: Record<string, string | undefined>;
}) {
  return (
    <Form action={basePath} className="flex w-full gap-2 sm:max-w-md" role="search">
      {Object.entries(keep).map(([key, value]) =>
        value ? <input key={key} type="hidden" name={key} value={value} /> : null
      )}
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-9 w-full rounded-full border border-input bg-background pl-9 pr-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      <Button type="submit" size="sm" className="h-9 rounded-full px-4">
        Buscar
      </Button>
      {query && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 rounded-full"
          nativeButton={false}
          render={<Link href={adminHref(basePath, keep, {})} />}
        >
          Limpiar
        </Button>
      )}
    </Form>
  );
}

// Estado vacío uniforme.
export function AdminEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
