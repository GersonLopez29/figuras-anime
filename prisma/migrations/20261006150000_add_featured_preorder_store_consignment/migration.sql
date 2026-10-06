-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "featuredUntil" TIMESTAMP(3),
ADD COLUMN     "isPreorder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preorderArrival" TIMESTAMP(3),
ADD COLUMN     "preorderDeposit" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isOfficialStore" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "FeatureRequest" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "amount" DOUBLE PRECISION NOT NULL,
    "days" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "listingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "FeatureRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsignmentRequest" (
    "id" TEXT NOT NULL,
    "figure" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "expectedPrice" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'nuevo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ConsignmentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeatureRequest_status_idx" ON "FeatureRequest"("status");

-- CreateIndex
CREATE INDEX "ConsignmentRequest_status_idx" ON "ConsignmentRequest"("status");

-- CreateIndex
CREATE INDEX "Listing_featuredUntil_idx" ON "Listing"("featuredUntil");

-- AddForeignKey
ALTER TABLE "FeatureRequest" ADD CONSTRAINT "FeatureRequest_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureRequest" ADD CONSTRAINT "FeatureRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsignmentRequest" ADD CONSTRAINT "ConsignmentRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
