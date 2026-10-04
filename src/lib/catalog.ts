// Estado del catálogo (filtros, orden y página) leído desde la URL, y helpers
// para construir enlaces que conservan los filtros activos.

export type CatalogOrder = "recientes" | "precio_asc" | "precio_desc" | "vistas";

export const ORDER_OPTIONS: { value: CatalogOrder; label: string }[] = [
  { value: "recientes", label: "Más recientes" },
  { value: "precio_asc", label: "Menor precio" },
  { value: "precio_desc", label: "Mayor precio" },
  { value: "vistas", label: "Más vistas" },
];

// Líneas de producto que buscan los coleccionistas. No hay un campo "línea" en
// la base de datos, así que se detectan por palabras clave en el título.
export const PRODUCT_LINES = [
  {
    slug: "shfiguarts",
    label: "S.H.Figuarts",
    contains: ["figuarts", "shf", "s.h."],
    startsWith: ["sh "],
  },
  {
    slug: "ichibankuji",
    label: "Ichiban Kuji",
    contains: ["ichiban", "masterlise"],
    startsWith: [],
  },
  {
    slug: "banpresto",
    label: "Banpresto",
    contains: ["banpresto", "grandista", "luminasta", "dxf", "clearise"],
    startsWith: [],
  },
  {
    slug: "marvellegends",
    label: "Marvel Legends / Hasbro",
    contains: ["marvel legends", "hasbro", "gi joe", "g.i. joe", "gamerverse"],
    startsWith: [],
  },
  {
    slug: "funko",
    label: "Funko",
    contains: ["funko"],
    startsWith: [],
  },
] as const;

export type ProductLineSlug = (typeof PRODUCT_LINES)[number]["slug"];

export type CatalogState = {
  categoria?: string;
  q?: string;
  estado?: "nuevo" | "usado";
  oferta?: boolean;
  orden?: CatalogOrder;
  min?: number;
  max?: number;
  linea?: ProductLineSlug;
};

const MAX_PRICE_FILTER = 1_000_000;

function parsePrice(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > MAX_PRICE_FILTER) return undefined;
  return value;
}

export function parseCatalogFilters(raw: {
  estado?: string;
  oferta?: string;
  orden?: string;
  min?: string;
  max?: string;
  linea?: string;
}): Omit<CatalogState, "categoria" | "q"> {
  const estado = raw.estado === "nuevo" || raw.estado === "usado" ? raw.estado : undefined;
  const orden = ORDER_OPTIONS.some((o) => o.value === raw.orden)
    ? (raw.orden as CatalogOrder)
    : undefined;
  const linea = PRODUCT_LINES.some((l) => l.slug === raw.linea)
    ? (raw.linea as ProductLineSlug)
    : undefined;
  let min = parsePrice(raw.min);
  let max = parsePrice(raw.max);
  if (min !== undefined && max !== undefined && min > max) {
    [min, max] = [max, min];
  }
  return {
    estado,
    oferta: raw.oferta === "1",
    orden: orden === "recientes" ? undefined : orden,
    min,
    max,
    linea,
  };
}

export function getProductLine(slug: ProductLineSlug | undefined) {
  return PRODUCT_LINES.find((l) => l.slug === slug);
}

export function catalogHref(state: CatalogState, page?: number): string {
  const params = new URLSearchParams();
  if (state.categoria) params.set("categoria", state.categoria);
  if (state.q) params.set("q", state.q);
  if (state.estado) params.set("estado", state.estado);
  if (state.oferta) params.set("oferta", "1");
  if (state.linea) params.set("linea", state.linea);
  if (state.min !== undefined) params.set("min", String(state.min));
  if (state.max !== undefined) params.set("max", String(state.max));
  if (state.orden && state.orden !== "recientes") params.set("orden", state.orden);
  if (page && page > 1) params.set("pagina", String(page));
  const qs = params.toString();
  return `${qs ? `/?${qs}` : "/"}#catalogo`;
}
