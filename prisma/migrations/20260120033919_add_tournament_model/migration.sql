/*
  Warnings:

  - A unique constraint covering the columns `[email,tournamentId]` on the table `Player` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tournamentId]` on the table `Settings` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Player_email_key";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "tournamentId" TEXT;

-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "tournamentId" TEXT;

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "tournamentId" TEXT;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "tournamentId" TEXT;

-- AlterTable
ALTER TABLE "TeeTime" ADD COLUMN     "tournamentId" TEXT;

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_slug_key" ON "Tournament"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Player_email_tournamentId_key" ON "Player"("email", "tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_tournamentId_key" ON "Settings"("tournamentId");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeeTime" ADD CONSTRAINT "TeeTime_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;
