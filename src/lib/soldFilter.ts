// Filtro "Disponibles / Vendidas / Todas" de Mis figuras y del panel de
// publicaciones del admin (?estado=...).

export const SOLD_FILTERS = [
  { value: "todas", label: "Todas" },
  { value: "disponibles", label: "Disponibles" },
  { value: "vendidas", label: "Vendidas" },
] as const;

export type SoldFilter = (typeof SOLD_FILTERS)[number]["value"];

export function parseSoldFilter(value: string | string[] | undefined): SoldFilter {
  return SOLD_FILTERS.find((f) => f.value === value)?.value ?? "todas";
}

// Condición para Prisma: sin condición en "todas".
export function soldWhere(filter: SoldFilter): { sold?: boolean } {
  if (filter === "disponibles") return { sold: false };
  if (filter === "vendidas") return { sold: true };
  return {};
}

export function matchesSoldFilter(filter: SoldFilter, sold: boolean): boolean {
  return filter === "todas" || (filter === "vendidas") === sold;
}

export type SoldCounts = { todas: number; disponibles: number; vendidas: number };

export function soldCounts(available: number, sold: number): SoldCounts {
  return { todas: available + sold, disponibles: available, vendidas: sold };
}
