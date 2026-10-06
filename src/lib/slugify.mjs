// Convierte un texto en la parte legible de un enlace:
//   "Kenshin Himura - Rurouni Kenshin S.H.Figuarts" → "kenshin-himura-rurouni-kenshin-sh-figuarts"
//
// Está en JavaScript plano (no TypeScript) porque también la usa
// scripts/backfill-slugs.mjs, que corre con Node durante el build.

/**
 * @param {string} text
 * @param {number} [maxWords]
 * @returns {string}
 */
export function slugify(text, maxWords = 8) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/s\.h\./g, "sh ")
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, maxWords)
    .join("-");
}

/**
 * Nombre de enlace base para una figura (sin sufijo de duplicado).
 * @param {string} title
 * @returns {string}
 */
export function baseListingSlug(title) {
  return slugify(title) || "figura";
}

/**
 * Primer nombre libre: "goku", "goku-2", "goku-3"…
 * @param {string} base
 * @param {(slug: string) => Promise<boolean>} isTaken
 * @returns {Promise<string>}
 */
export async function firstFreeSlug(base, isTaken) {
  for (let n = 1; n < 1000; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  throw new Error(`No hay un enlace libre para "${base}"`);
}
