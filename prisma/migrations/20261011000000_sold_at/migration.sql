-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "soldAt" TIMESTAMP(3);

-- Figuras ya vendidas: no se guardó cuándo se vendieron; updatedAt es la mejor
-- aproximación disponible. Las ventas nuevas guardan la fecha exacta.
UPDATE "Listing" SET "soldAt" = "updatedAt" WHERE "sold" = true;

-- CreateIndex
CREATE INDEX "Listing_sold_soldAt_idx" ON "Listing"("sold", "soldAt");
