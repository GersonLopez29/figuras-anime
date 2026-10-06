import { prisma } from "@/lib/db";
import { baseListingSlug, firstFreeSlug } from "./slugify.mjs";
import { legacyIdFromParam } from "@/lib/slug";

// Elige un nombre de enlace libre para una figura a partir de su título.
// excludeId: al editar, la propia figura no cuenta como "ocupado".
export async function uniqueListingSlug(title: string, excludeId?: string): Promise<string> {
  return firstFreeSlug(baseListingSlug(title), async (candidate) => {
    const taken = await prisma.listing.findFirst({
      where: {
        OR: [{ slug: candidate }, { oldSlugs: { has: candidate } }],
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return !!taken;
  });
}

// Nuevo slug al cambiar el título: el anterior se guarda en oldSlugs para que
// los enlaces ya compartidos sigan funcionando.
export async function slugUpdateForTitle(
  listing: { id: string; slug: string | null; oldSlugs: string[] },
  newTitle: string
): Promise<{ slug: string; oldSlugs: string[] } | null> {
  const base = baseListingSlug(newTitle);
  // Si el título cambió pero el enlace seguiría igual (ej. solo mayúsculas), no se toca.
  if (listing.slug && (listing.slug === base || new RegExp(`^${base}-\\d+$`).test(listing.slug))) {
    return null;
  }
  const slug = await uniqueListingSlug(newTitle, listing.id);
  if (slug === listing.slug) return null;
  const oldSlugs = listing.slug
    ? [...new Set([...listing.oldSlugs, listing.slug])].filter((s) => s !== slug)
    : listing.oldSlugs;
  return { slug, oldSlugs };
}

export type ResolvedListingParam = { id: string; slug: string | null; isCanonical: boolean };

// Encuentra la figura de un enlace /figura/<param>, en este orden:
//   1. slug actual (enlace correcto)
//   2. slug anterior (título cambiado)          → redirigir
//   3. formato con id: <id> o <nombre>-<id>     → redirigir
export async function resolveListingParam(rawParam: string): Promise<ResolvedListingParam | null> {
  const param = decodeURIComponent(rawParam).toLowerCase();

  const current = await prisma.listing.findUnique({
    where: { slug: param },
    select: { id: true, slug: true },
  });
  if (current) return { ...current, isCanonical: true };

  const renamed = await prisma.listing.findFirst({
    where: { oldSlugs: { has: param } },
    select: { id: true, slug: true },
  });
  if (renamed) return { ...renamed, isCanonical: false };

  const legacyId = legacyIdFromParam(param);
  if (legacyId) {
    const byId = await prisma.listing.findUnique({
      where: { id: legacyId },
      select: { id: true, slug: true },
    });
    // Sin slug todavía (el build no lo completó): se muestra con su enlace por id.
    if (byId) return { ...byId, isCanonical: byId.slug === null };
  }

  return null;
}
