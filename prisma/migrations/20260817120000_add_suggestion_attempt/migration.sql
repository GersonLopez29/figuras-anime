-- CreateTable
CREATE TABLE "SuggestionAttempt" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuggestionAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SuggestionAttempt_ip_createdAt_idx" ON "SuggestionAttempt"("ip", "createdAt");
