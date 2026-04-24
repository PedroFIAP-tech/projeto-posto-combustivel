-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'frentista';

-- Normalize legacy users created before the attendant role was defined.
UPDATE "User" SET "role" = 'frentista' WHERE "role" = 'customer';
