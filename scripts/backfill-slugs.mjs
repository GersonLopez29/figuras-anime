// Completa Listing.slug en las figuras que todavía no lo tienen (las publicadas
// antes de los enlaces por nombre). Corre en cada build después de
// `prisma migrate deploy`; si todas tienen slug, no hace nada.
//
// Usa la misma función que la app (src/lib/slugify.mjs) para que el enlace sea
// idéntico al que generaría al publicar. Las más antiguas se procesan primero y
// se quedan con el nombre sin sufijo; si se repite, va "-2", "-3"…
//
// Si falla, no detiene el build: las figuras sin slug siguen funcionando con su
// enlace por id, que redirige.

import pg from "pg";
import { baseListingSlug, firstFreeSlug } from "../src/lib/slugify.mjs";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.log("[slugs] Sin DATABASE_URL: se omite.");
  process.exit(0);
}

const client = new pg.Client({ connectionString: url });

try {
  await client.connect();
  const { rows } = await client.query(
    'SELECT id, title FROM "Listing" WHERE slug IS NULL ORDER BY "createdAt" ASC'
  );
  for (const row of rows) {
    const slug = await firstFreeSlug(baseListingSlug(row.title), async (candidate) => {
      const taken = await client.query(
        'SELECT 1 FROM "Listing" WHERE slug = $1 OR $1 = ANY("oldSlugs") LIMIT 1',
        [candidate]
      );
      return taken.rowCount > 0;
    });
    await client.query('UPDATE "Listing" SET slug = $1 WHERE id = $2 AND slug IS NULL', [
      slug,
      row.id,
    ]);
  }
  console.log(`[slugs] ${rows.length} figura(s) con enlace nuevo.`);
} catch (err) {
  console.error("[slugs] No se pudieron completar los enlaces:", err);
} finally {
  await client.end().catch(() => {});
}
