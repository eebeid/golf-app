-- AlterTable: Change Settings.id default from hardcoded string to gen_random_uuid()
ALTER TABLE "Settings" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
