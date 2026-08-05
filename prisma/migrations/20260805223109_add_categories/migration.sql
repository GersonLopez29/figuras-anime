-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '📦',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "requesterId" TEXT NOT NULL,

    CONSTRAINT "CategoryRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- AddForeignKey
ALTER TABLE "CategoryRequest" ADD CONSTRAINT "CategoryRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SeedCategories
INSERT INTO "Category" ("id", "name", "icon") VALUES
    (gen_random_uuid()::text, 'Naruto', '🍥'),
    (gen_random_uuid()::text, 'Dragon Ball Z', '🐉'),
    (gen_random_uuid()::text, 'One Piece', '🏴‍☠️'),
    (gen_random_uuid()::text, 'Attack on Titan', '⚔️'),
    (gen_random_uuid()::text, 'Demon Slayer', '🗡️'),
    (gen_random_uuid()::text, 'My Hero Academia', '🦸'),
    (gen_random_uuid()::text, 'Pokemon', '⚡'),
    (gen_random_uuid()::text, 'Otras', '📦')
ON CONFLICT ("name") DO NOTHING;
