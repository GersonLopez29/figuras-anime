-- "Hacer una oferta" (lib/offers.ts).
ALTER TABLE "Listing" ADD COLUMN "acceptsOffers" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "WhatsAppClick" ADD COLUMN "offerAmount" DOUBLE PRECISION;

-- Las publicaciones que ya dicen en la descripción que el precio es fijo no
-- reciben ofertas (el vendedor puede cambiarlo al editar).
UPDATE "Listing" SET "acceptsOffers" = false
WHERE "description" ~* '(precio\s+fijo|no\s+negociable|no\s+(se\s+)?aceptan?\s+ofertas|no\s+acepto\s+ofertas)';
