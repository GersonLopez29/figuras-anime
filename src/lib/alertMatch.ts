// Coincidencias para "Avísame cuando llegue" y "Se busca": una búsqueda
// coincide con una figura si cada palabra buscada aparece en el título o en la
// categoría ("zoro" → "Roronoa Zoro", "figuarts" → "S.H.Figuarts"). Sin tildes
// ni mayúsculas.

import { slugify } from "./slugify.mjs";

const MAX_WORDS = 40;

export function searchWords(text: string): string[] {
  const slug = slugify(text, MAX_WORDS);
  return slug ? slug.split("-") : [];
}

// Palabras que no ayudan a encontrar una figura ("busco figura de Goku" = "goku").
const STOPWORDS = new Set([
  "busco", "buscando", "quiero", "vendo", "figura", "figuras", "fig", "de", "del", "la",
  "las", "el", "los", "un", "una", "y", "o", "en", "con", "para", "por", "original",
  "originales", "anime",
]);

// Texto que se guarda para una alerta: palabras normalizadas, sin repetir.
export function normalizeAlertQuery(text: string): string {
  const words = searchWords(text);
  const useful = words.filter((w) => !STOPWORDS.has(w));
  return [...new Set(useful.length > 0 ? useful : words)].slice(0, 8).join(" ");
}

export function matchesQuery(query: string, listing: { title: string; category: string }): boolean {
  const wanted = query.split(" ").filter(Boolean);
  if (wanted.length === 0) return false;
  const words = [...searchWords(listing.title), ...searchWords(listing.category)];
  // "sh figuarts" y "shfiguarts" son la misma línea: también se compara todo junto.
  const joined = words.join("");
  // Palabras cortas deben coincidir completas ("nami" no es "namikaze"); las
  // largas aceptan el inicio de una palabra ("figuart" → "figuarts").
  return wanted.every(
    (w) =>
      words.some((word) => word === w || (w.length >= 5 && word.startsWith(w))) ||
      (w.length >= 6 && joined.includes(w))
  );
}
