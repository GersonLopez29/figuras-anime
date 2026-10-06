-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "deliveryNotes" TEXT,
ADD COLUMN     "deliveryZones" TEXT[] DEFAULT ARRAY[]::TEXT[];
