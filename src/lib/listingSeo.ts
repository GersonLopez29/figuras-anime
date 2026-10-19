// Cómo se presenta una figura ante Google (y en la página): nombres de marca
// bien escritos, marca detectada y una meta descripción útil aunque el vendedor
// haya escrito poco. Sin base de datos: se puede usar en cualquier componente.

import { getConditionLabel } from "@/lib/condition";
import { getDeliveryZoneLabel, isDeliveryZone } from "@/lib/delivery";

// Los vendedores escriben "Sh Figuarts", "sh figuarts", "S.H. Figuarts"…; la gente
// busca (y Google muestra) el nombre oficial. Solo se tocan nombres de líneas y
// marcas conocidas; el resto del título queda como lo escribió el vendedor.
const TITLE_FIXES: [RegExp, string][] = [
  [/\bs\.?\s*h\.?\s*figuarts\b/gi, "S.H.Figuarts"],
  [/\bichiban\s*kuji\b/gi, "Ichiban Kuji"],
  [/\bbanpresto\b/gi, "Banpresto"],
  [/\bbandai\b/gi, "Bandai"],
  [/\bmasterlise\b/gi, "Masterlise"],
  [/\bgrandista\b/gi, "Grandista"],
  [/\bnendoroid\b/gi, "Nendoroid"],
  [/\bpop\s*up\s*parade\b/gi, "POP UP PARADE"],
  [/\bfunko\s*pop\b/gi, "Funko Pop"],
  [/\bmarvel\s*legends\b/gi, "Marvel Legends"],
  // Super Saiyajin: "ssj4", "Ssj 4" -> "SSJ4".
  [/\bssj\s*(\d)\b/gi, "SSJ$1"],
  [/\bssj\b/gi, "SSJ"],
];

export function prettyListingTitle(title: string): string {
  let out = title.replace(/\s+/g, " ").trim();
  for (const [pattern, replacement] of TITLE_FIXES) out = out.replace(pattern, replacement);
  return out;
}

// Marca según palabras del título. Google prefiere no recibir marca a recibir
// una inventada, así que si no se reconoce se devuelve undefined.
const BRANDS: { brand: string; words: string[] }[] = [
  { brand: "Bandai Spirits", words: ["figuarts", "shf", "s.h.", "ichiban", "masterlise", "tamashii"] },
  { brand: "Banpresto", words: ["banpresto", "grandista", "luminasta", "dxf", "clearise"] },
  { brand: "Good Smile Company", words: ["nendoroid", "pop up parade", "good smile"] },
  { brand: "Max Factory", words: ["figma"] },
  { brand: "MegaHouse", words: ["megahouse", "portrait of pirates", "p.o.p", "g.e.m."] },
  { brand: "Kotobukiya", words: ["kotobukiya", "artfx"] },
  { brand: "SEGA", words: ["sega", "spm"] },
  { brand: "Taito", words: ["taito"] },
  { brand: "FuRyu", words: ["furyu", "noodle stopper"] },
  { brand: "Hasbro", words: ["hasbro", "marvel legends", "gi joe", "g.i. joe"] },
  { brand: "Funko", words: ["funko"] },
  { brand: "Bandai", words: ["bandai"] },
];

export function detectBrand(title: string): string | undefined {
  const text = ` ${title.toLowerCase()} `;
  return BRANDS.find((b) => b.words.some((w) => text.includes(w)))?.brand;
}

const MAX_DESCRIPTION = 158;

function cutAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:—-]+$/, "")}…`;
}

function zonesText(zones: string[]): string {
  const ships = zones.includes("envio-provincias");
  const labels = zones
    .filter((z) => z !== "envio-provincias" && isDeliveryZone(z))
    .map((z) => getDeliveryZoneLabel(z));
  const where =
    labels.length === 0
      ? ""
      : labels.length === 1
        ? labels[0]
        : labels.length === 2
          ? `${labels[0]} y ${labels[1]}`
          : `${labels[0]}, ${labels[1]} y más zonas`;
  if (ships) return where ? `Entrega en ${where} y envío a provincias` : "Envío a provincias";
  return `Entrega en ${where || "Lima"}`;
}

function soles(amount: number): string {
  return `S/ ${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;
}

// "S.H.Figuarts Goku SSJ4 (Dragon Ball Z) a S/ 230, open box. Entrega en Lima
// Norte. Escríbele directo al coleccionista por WhatsApp. Figura en buen estado…"
export function listingMetaDescription(listing: {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  deliveryZones: string[];
  sold: boolean;
  isPreorder: boolean;
}): string {
  const title = prettyListingTitle(listing.title);
  if (listing.sold) {
    return cutAtWord(
      `${title} ya se vendió. Mira otras figuras de ${listing.category} disponibles en Lima y escríbele directo al vendedor por WhatsApp.`,
      MAX_DESCRIPTION
    );
  }
  const condition = getConditionLabel(listing.condition).split(" — ")[0].toLowerCase();
  const state = listing.isPreorder ? "preventa" : condition;
  const base = `${title} (${listing.category}) a ${soles(listing.price)}, ${state}. ${zonesText(listing.deliveryZones)}. Compra directo al coleccionista por WhatsApp.`;
  const sellerText = listing.description.replace(/\s+/g, " ").trim();
  if (!sellerText || base.length > MAX_DESCRIPTION - 20) return cutAtWord(base, MAX_DESCRIPTION);
  return cutAtWord(`${base} ${sellerText}`, MAX_DESCRIPTION);
}
