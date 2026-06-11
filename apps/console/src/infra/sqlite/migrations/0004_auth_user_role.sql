ALTER TABLE "user" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'member';

UPDATE "user"
SET "role" = 'owner'
WHERE "id" = (
  SELECT "id"
  FROM "user"
  ORDER BY "createdAt" ASC
  LIMIT 1
);
