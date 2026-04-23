import { NextResponse } from 'next/server';
import { GhinClient } from '@spicygolf/ghin';
import prisma from '@/lib/prisma';

export async function POST(request) {
    try {
        const { tournamentId } = await request.json();

        if (!tournamentId) {
            return NextResponse.json({ error: "Tournament ID is required" }, { status: 400 });
        }

        // Find all players in the tournament that have a GHIN number
        const playersToSync = await prisma.player.findMany({
            where: {
                tournamentId: tournamentId,
                ghin: {
                    not: null,
                    not: ""
                }
            }
        });

        if (playersToSync.length === 0) {
            return NextResponse.json({ success: true, updatedCount: 0, message: "No players with GHIN numbers found." });
        }

        // Initialize the GHIN client
        const ghin = new GhinClient({
            username: process.env.GHIN_USERNAME,
            password: process.env.GHIN_PASSWORD,
        });

        let updatedCount = 0;
        let failedCount = 0;

        // Process sequentially to respect any GHIN rate limits
        for (const player of playersToSync) {
            const ghinInt = parseInt(player.ghin, 10);
            if (isNaN(ghinInt)) {
                failedCount++;
                continue;
            }

            let ghinData;
            try {
                ghinData = await ghin.handicaps.getOne(ghinInt);
            } catch (err) {
                try {
                    const searchResults = await ghin.golfers.globalSearch({ ghin: ghinInt });
                    if (searchResults && searchResults.length > 0) {
                        ghinData = searchResults[0];
                    }
                } catch (searchErr) {
                    console.error(`Failed to fetch GHIN data for player ${player.name} (${player.ghin})`);
                }
            }

            if (ghinData) {
                const newIndex = ghinData.handicap_index ?? ghinData.HandicapIndex;
                if (newIndex !== undefined) {
                    // Update the player in the database
                    await prisma.player.update({
                        where: { id: player.id },
                        data: { handicapIndex: parseFloat(newIndex) }
                    });
                    updatedCount++;
                } else {
                    failedCount++;
                }
            } else {
                failedCount++;
            }
        }

        return NextResponse.json({ 
            success: true, 
            updatedCount,
            failedCount,
            message: `Successfully synced ${updatedCount} GHIN handicaps. ${failedCount} failed.`
        });

    } catch (error) {
        console.error("GHIN Sync Error:", error);
        return NextResponse.json({ error: "Failed to sync GHIN data", details: error.message }, { status: 500 });
    }
}
