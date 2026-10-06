// Enlaces legibles:
//   figura:    /figura/kenshin-himura-rurouni-kenshin-samurai-x-sh-figuarts
//   categoría: /categoria/samurai-x-rurouni-kenshin
//
// Cada figura guarda su nombre de enlace (Listing.slug, único). Si dos figuras
// se llaman igual, la segunda lleva "-2". Cuando el vendedor cambia el título,
// el enlace se actualiza y el anterior queda en Listing.oldSlugs para seguir
// redirigiendo. También redirigen los formatos anteriores: /figura/<id> y
// /figura/<nombre>-<id>.

import { slugify } from "./slugify.mjs";

export { slugify };

// --- Figuras ---------------------------------------------------------------

// Si una figura todavía no tiene slug (no debería pasar: el build lo completa),
// se usa su id, que redirige al enlace bueno.
export function listingPath(listing: { id: string; slug: string | null }): string {
  return `/figura/${listing.slug ?? listing.id}`;
}

// Los ids (cuid) son 25 caracteres en minúscula que empiezan con "c".
const CUID = /^c[a-z0-9]{24}$/;

// Devuelve el id si el parámetro es un formato antiguo con id:
// "cmu8cel3h000t04l2m8gop4gh" o "kenshin-himura-...-cmu8cel3h000t04l2m8gop4gh".
export function legacyIdFromParam(param: string): string | null {
  const last = param.slice(param.lastIndexOf("-") + 1);
  return CUID.test(last) ? last : null;
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
