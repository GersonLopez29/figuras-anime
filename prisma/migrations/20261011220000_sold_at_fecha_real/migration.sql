-- La migración anterior (20261011000000_sold_at) usó updatedAt como fecha de
-- venta de las figuras que ya estaban vendidas. Pero updatedAt cambiaba con
-- cada visita a la ficha, así que las vendidas más visitadas (ej. Freezer)
-- quedaron como "recién vendidas".
--
-- Mejor aproximación: el último clic en "Contactar por WhatsApp". El botón se
-- bloquea al marcar la figura como vendida, así que ese clic siempre es
-- anterior a la venta. Si nunca tuvo clics, se usa la fecha de publicación.
--
-- Solo se corrigen las fechas puestas por esa migración (hasta que terminó de
-- aplicarse); las ventas marcadas después ya tienen su fecha exacta.
UPDATE "Listing" AS l
SET "soldAt" = COALESCE(
  (SELECT MAX(w."createdAt") FROM "WhatsAppClick" w WHERE w."listingId" = l."id"),
  l."createdAt"
)
WHERE l."sold" = true
  AND l."soldAt" IS NOT NULL
  AND l."soldAt" <= COALESCE(
    (SELECT "finished_at" FROM "_prisma_migrations"
      WHERE "migration_name" = '20261011000000_sold_at' AND "finished_at" IS NOT NULL
      ORDER BY "finished_at" DESC LIMIT 1),
    NOW()
  );
