-- AlterTable
ALTER TABLE "WhatsAppClick" ADD COLUMN     "ip" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "WhatsAppClick_ip_createdAt_idx" ON "WhatsAppClick"("ip", "createdAt");
