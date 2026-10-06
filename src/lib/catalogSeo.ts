import { getDeliveryZoneLabel, type DeliveryZone } from "@/lib/delivery";
import { getProductLine, type ProductLineSlug } from "@/lib/catalog";

// Páginas del catálogo que vale la pena que Google indexe por separado: una
// categoría, una zona de entrega o una línea (y sus combinaciones). El resto de
// filtros (orden, precio, estado, oferta) son variantes de la misma página y
// apuntan a ella con la URL canónica; las búsquedas por texto no se indexan.

export type LandingInput = {
  categoria?: string;
  zona?: DeliveryZone;
  linea?: ProductLineSlug;
};

export type LandingStats = { count: number; lowest: number | null; highest: number | null };

const GENERIC_CATEGORIES = ["Otras", "Otros"];

export function isLandingPage({ categoria, zona, linea }: LandingInput): boolean {
  return !!(categoria || zona || linea);
}

// "Figuras de Naruto", "Figuras S.H.Figuarts de Dragon Ball Z", "Otras figuras"…
export function landingHeading({ categoria, linea }: LandingInput): string {
  const line = getProductLine(linea)?.label;
  if (categoria && GENERIC_CATEGORIES.includes(categoria)) {
    return line ? `Otras figuras ${line}` : "Otras figuras y coleccionables";
  }
  if (categoria) return line ? `Figuras ${line} de ${categoria}` : `Figuras de ${categoria}`;
  if (line) return `Figuras ${line}`;
  return "Figuras de anime";
}

function whereLabel(zona?: DeliveryZone): string {
  return zona ? `con entrega en ${getDeliveryZoneLabel(zona)}` : "en Lima";
}

// Título visible (h1) de la página: "Figuras de Naruto en Lima".
export function landingH1(input: LandingInput): string {
  return `${landingHeading(input)} ${whereLabel(input.zona)}`;
}

export function landingTitle(input: LandingInput): string {
  return `${landingH1(input)} | FigurasAnime`;
}

function priceText(stats: LandingStats): string {
  if (stats.lowest === null || stats.highest === null) return "";
  if (stats.lowest === stats.highest) return ` a S/ ${stats.lowest}`;
  return ` desde S/ ${stats.lowest} hasta S/ ${stats.highest}`;
}

// Texto visible bajo el título y, recortado, la meta descripción para Google.
export function landingIntro(input: LandingInput, stats: LandingStats): string {
  const heading = landingHeading(input);
  const lowerHeading = heading.charAt(0).toLowerCase() + heading.slice(1);
  const where = whereLabel(input.zona);
  if (stats.count === 0) {
    return `Por ahora no hay ${lowerHeading} disponibles ${where}. Publica la tuya o vuelve pronto: los coleccionistas suben figuras nuevas cada semana.`;
  }
  const what = stats.count === 1 ? "figura disponible" : "figuras disponibles";
  return `${stats.count} ${what} ${where}${priceText(stats)}, publicadas por coleccionistas. Compra directo al vendedor y coordina la entrega por WhatsApp.`;
}

export function landingCanonical({ categoria, zona, linea }: LandingInput, page: number): string {
  const params = new URLSearchParams();
  if (categoria) params.set("categoria", categoria);
  if (zona) params.set("zona", zona);
  if (linea) params.set("linea", linea);
  if (page > 1) params.set("pagina", String(page));
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

// Meta descripción para Google: "Figuras de Naruto en Lima: 12 figuras
// disponibles desde S/ 110 hasta S/ 240. Compra directo al vendedor…".
export function landingDescription(input: LandingInput, stats: LandingStats): string {
  if (stats.count === 0) return landingIntro(input, stats);
  const what = stats.count === 1 ? "figura disponible" : "figuras disponibles";
  return `${landingH1(input)}: ${stats.count} ${what}${priceText(stats)}. Compra directo al coleccionista y coordina la entrega por WhatsApp.`;
}
