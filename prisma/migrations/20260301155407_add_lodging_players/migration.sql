-- AlterTable
ALTER TABLE "Lodging" ADD COLUMN     "unitNumber" TEXT;

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "courseData" JSONB DEFAULT '{}',
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "date" TEXT,
ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION,
ADD COLUMN     "payerId" TEXT,
ADD COLUMN     "paymentLink" TEXT;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "paypal" TEXT,
ADD COLUMN     "prizes" JSONB DEFAULT '[]',
ADD COLUMN     "prizesTitle" TEXT DEFAULT 'Tournament Prizes',
ADD COLUMN     "venmo" TEXT,
ADD COLUMN     "zelle" TEXT,
ALTER COLUMN "numberOfRounds" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "LodgingPlayer" (
    "id" TEXT NOT NULL,
    "lodgingId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,

    CONSTRAINT "LodgingPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scorecard" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "playerIds" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tournamentId" TEXT NOT NULL,

    CONSTRAINT "Scorecard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LodgingPlayer_lodgingId_playerId_key" ON "LodgingPlayer"("lodgingId", "playerId");

-- AddForeignKey
ALTER TABLE "LodgingPlayer" ADD CONSTRAINT "LodgingPlayer_lodgingId_fkey" FOREIGN KEY ("lodgingId") REFERENCES "Lodging"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LodgingPlayer" ADD CONSTRAINT "LodgingPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scorecard" ADD CONSTRAINT "Scorecard_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
