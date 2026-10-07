-- CreateTable
CREATE TABLE "SearchStat" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "query" TEXT NOT NULL,
    "searches" INTEGER NOT NULL DEFAULT 0,
    "noResults" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SearchStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SearchStat_date_idx" ON "SearchStat"("date");

-- CreateIndex
CREATE UNIQUE INDEX "SearchStat_date_query_key" ON "SearchStat"("date", "query");
