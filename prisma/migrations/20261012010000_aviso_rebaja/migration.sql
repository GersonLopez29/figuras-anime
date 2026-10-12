-- Aviso de rebaja: último precio avisado a cada favorito (lib/priceAlerts.ts).
ALTER TABLE "Favorite" ADD COLUMN "notifiedPrice" DOUBLE PRECISION;
