-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'tournament-settings',
    "numberOfRounds" INTEGER NOT NULL DEFAULT 3,
    "roundDates" JSONB NOT NULL DEFAULT '[]',
    "roundCourses" JSONB NOT NULL DEFAULT '[]',
    "totalPlayers" INTEGER NOT NULL DEFAULT 0,
    "showAccommodations" BOOLEAN NOT NULL DEFAULT true,
    "showFood" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
