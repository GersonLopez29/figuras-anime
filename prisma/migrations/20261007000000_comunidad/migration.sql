-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "photoType" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "freeFeatureCredits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "referralCode" TEXT,
ADD COLUMN "referralRewardedAt" TIMESTAMP(3),
ADD COLUMN "referredById" TEXT;

-- CreateTable
CREATE TABLE "StockAlert" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "confirmSentAt" TIMESTAMP(3),
    "lastNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertAttempt" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WantedPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT NOT NULL DEFAULT '',
    "maxPrice" DOUBLE PRECISION,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "lastNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "WantedPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WantedContact" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wantedPostId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "WantedContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockAlert_token_key" ON "StockAlert"("token");

-- CreateIndex
CREATE INDEX "StockAlert_confirmedAt_idx" ON "StockAlert"("confirmedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StockAlert_email_query_key" ON "StockAlert"("email", "query");

-- CreateIndex
CREATE INDEX "AlertAttempt_ip_createdAt_idx" ON "AlertAttempt"("ip", "createdAt");

-- CreateIndex
CREATE INDEX "WantedPost_status_createdAt_idx" ON "WantedPost"("status", "createdAt");

-- CreateIndex
CREATE INDEX "WantedContact_userId_createdAt_idx" ON "WantedContact"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_referredById_idx" ON "User"("referredById");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WantedPost" ADD CONSTRAINT "WantedPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WantedContact" ADD CONSTRAINT "WantedContact_wantedPostId_fkey" FOREIGN KEY ("wantedPostId") REFERENCES "WantedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WantedContact" ADD CONSTRAINT "WantedContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
