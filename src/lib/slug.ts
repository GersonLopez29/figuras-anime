// Enlaces legibles:
//   figura:    /figura/kenshin-himura-rurouni-kenshin-sh-figuarts-cmu8cel3h000t04l2m8gop4gh
//   categoría: /categoria/samurai-x-rurouni-kenshin
//
// La figura lleva su código al final (el id): así el enlace nunca choca con
// otra figura del mismo nombre y sigue funcionando aunque el vendedor cambie
// el título (el texto se corrige solo con una redirección). Los enlaces viejos
// (/figura/<id> y /?categoria=Nombre) redirigen a los nuevos.

const MAX_SLUG_WORDS = 8;

export function slugify(text: string, maxWords = MAX_SLUG_WORDS): string {
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

// --- Figuras ---------------------------------------------------------------

export function listingSlug(listing: { id: string; title: string }): string {
  const words = slugify(listing.title);
  return words ? `${words}-${listing.id}` : listing.id;
}

export function listingPath(listing: { id: string; title: string }): string {
  return `/figura/${listingSlug(listing)}`;
}

// "kenshin-himura-...-cmu8cel3h000t04l2m8gop4gh" o "cmu8cel3h000t04l2m8gop4gh"
// → "cmu8cel3h000t04l2m8gop4gh". Los ids (cuid) no tienen guiones.
export function listingIdFromParam(param: string): string {
  const decoded = decodeURIComponent(param);
  return decoded.slice(decoded.lastIndexOf("-") + 1);
}

// --- Categorías ------------------------------------------------------------

export function categorySlug(name: string): string {
  return slugify(name, 12);
}

export function categoryPath(name: string): string {
  return `/categoria/${categorySlug(name)}`;
}

export function findCategoryBySlug(names: string[], slug: string): string | undefined {
  const wanted = decodeURIComponent(slug).toLowerCase();
  return names.find((name) => categorySlug(name) === wanted);
}
