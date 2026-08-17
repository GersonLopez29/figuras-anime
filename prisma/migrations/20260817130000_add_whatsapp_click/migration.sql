-- CreateTable
CREATE TABLE "WhatsAppClick" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,

    CONSTRAINT "WhatsAppClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WhatsAppClick_listingId_idx" ON "WhatsAppClick"("listingId");

-- CreateIndex
CREATE INDEX "WhatsAppClick_userId_idx" ON "WhatsAppClick"("userId");

-- AddForeignKey
ALTER TABLE "WhatsAppClick" ADD CONSTRAINT "WhatsAppClick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppClick" ADD CONSTRAINT "WhatsAppClick_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
