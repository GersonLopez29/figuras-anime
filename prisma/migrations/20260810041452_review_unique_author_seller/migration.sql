-- CreateIndex
CREATE UNIQUE INDEX "Review_authorId_sellerId_key" ON "Review"("authorId", "sellerId");

