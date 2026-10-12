-- AlterTable
ALTER TABLE "User" ADD COLUMN "welcomeBonusAt" TIMESTAMP(3),
ADD COLUMN "salesMilestoneReached" INTEGER NOT NULL DEFAULT 0;

-- El bono de bienvenida es para vendedores nuevos: quienes ya publicaron
-- alguna figura antes de este cambio no lo reciben.
UPDATE "User" u SET "welcomeBonusAt" = NOW()
WHERE EXISTS (SELECT 1 FROM "Listing" l WHERE l."userId" = u."id");

-- Los logros premian las ventas desde ahora: se parte del nivel que cada
-- vendedor ya tenía (la insignia sí se muestra según todas sus ventas).
UPDATE "User" u SET "salesMilestoneReached" = CASE
  WHEN s.sold >= 10 THEN 10
  WHEN s.sold >= 5 THEN 5
  WHEN s.sold >= 1 THEN 1
  ELSE 0
END
FROM (SELECT "userId", COUNT(*) AS sold FROM "Listing" WHERE "sold" = true GROUP BY "userId") s
WHERE s."userId" = u."id";
