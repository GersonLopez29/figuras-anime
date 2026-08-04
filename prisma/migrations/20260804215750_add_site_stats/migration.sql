-- CreateTable
CREATE TABLE "SiteStats" (
    "id" TEXT NOT NULL,
    "totalVisits" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SiteStats_pkey" PRIMARY KEY ("id")
);
