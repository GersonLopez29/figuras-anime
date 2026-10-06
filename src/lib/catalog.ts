import { isDeliveryZone, type DeliveryZone } from "@/lib/delivery";

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
  zona?: DeliveryZone;
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
  zona?: string;
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
    zona: isDeliveryZone(raw.zona) ? raw.zona : undefined,
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
  if (state.zona) params.set("zona", state.zona);
  if (state.min !== undefined) params.set("min", String(state.min));
  if (state.max !== undefined) params.set("max", String(state.max));
  if (state.orden && state.orden !== "recientes") params.set("orden", state.orden);
  if (page && page > 1) params.set("pagina", String(page));
  const qs = params.toString();
  return `${qs ? `/?${qs}` : "/"}#catalogo`;
}

// ---------------------------------------------------------------------------
// Rangos de precio automáticos
//
// El comprador no escribe montos: a partir de los precios de las figuras
// disponibles se detecta la más barata y la más cara, y se arman hasta 4 rangos
// con cortes "redondos" (múltiplos de 10) en los cuartiles, para que cada rango
// tenga figuras. Los cortes son exclusivos por arriba (max = corte - 0.01) para
// que una figura de justo S/ 150 no aparezca en dos rangos a la vez.
// ---------------------------------------------------------------------------

export type PriceBucket = { min?: number; max?: number; label: string };

export type PriceSummary = {
  lowest: number;
  highest: number;
  buckets: PriceBucket[];
};

const EXCLUSIVE_STEP = 0.01;

function roundToTen(value: number): number {
  return Math.round(value / 10) * 10;
}

function formatSoles(value: number): string {
  return `S/ ${Number.isInteger(value) ? value : value.toFixed(2)}`;
}

// Un tope exclusivo como 149.99 se muestra como "150".
function displayMax(max: number): number {
  const rounded = Math.round((max + EXCLUSIVE_STEP) * 100) / 100;
  return Number.isInteger(rounded) ? rounded : max;
}

export function priceRangeLabel(min?: number, max?: number): string | null {
  if (min !== undefined && max !== undefined) {
    return `${formatSoles(min)} – ${formatSoles(displayMax(max))}`;
  }
  if (max !== undefined) return `Hasta ${formatSoles(displayMax(max))}`;
  if (min !== undefined) return `${formatSoles(min)} o más`;
  return null;
}

export function computePriceSummary(sortedPrices: number[]): PriceSummary | null {
  if (sortedPrices.length === 0) return null;
  const lowest = sortedPrices[0];
  const highest = sortedPrices[sortedPrices.length - 1];

  const quantile = (q: number) => sortedPrices[Math.floor(q * (sortedPrices.length - 1))];
  const cuts = [...new Set([0.25, 0.5, 0.75].map((q) => roundToTen(quantile(q))))].filter(
    (cut) => cut > lowest && cut <= highest
  );

  if (sortedPrices.length < 4 || cuts.length === 0) {
    return { lowest, highest, buckets: [] };
  }

  const buckets: PriceBucket[] = [];
  cuts.forEach((cut, i) => {
    const min = i === 0 ? undefined : cuts[i - 1];
    const max = cut - EXCLUSIVE_STEP;
    buckets.push({ min, max, label: priceRangeLabel(min, max)! });
  });
  const lastMin = cuts[cuts.length - 1];
  buckets.push({ min: lastMin, label: priceRangeLabel(lastMin)! });

  return { lowest, highest, buckets };
}
