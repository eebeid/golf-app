import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
    try {
        const { tournamentId, players: newPlayers } = await request.json();

        if (!Array.isArray(newPlayers)) {
            return NextResponse.json({ error: "Invalid data format. Expected array of players." }, { status: 400 });
        }

        if (!tournamentId) {
            return NextResponse.json({ error: "Tournament ID is required." }, { status: 400 });
        }

        // We can use createMany for bulk insert
        const validPlayers = newPlayers.filter(p => p.name).map(p => {
            const courseData = {};
            if (p.tees) {
                // p.tees is an object: { "courseId1": "Gold", "courseId2": "Blue" }
                for (const [courseId, teeValue] of Object.entries(p.tees)) {
                    courseData[courseId] = { tee: teeValue, hcp: 0 };
                }
            }

            return {
                name: p.name.trim(),
                email: p.email || null,
                handicapIndex: parseFloat(p.handicapIndex) || 0,
                // Provide string defaults for backwards compatibility properties just in case
                teeRiver: 'Gold',
                teePlantation: 'Gold',
                teeRNK: 'Gold',
                courseData: courseData,
                tournamentId: tournamentId
            };
        });

        if (validPlayers.length === 0) return NextResponse.json({ success: true, count: 0 });

        const result = await prisma.player.createMany({
            data: validPlayers
        });

        return NextResponse.json({ success: true, count: result.count });
    } catch (error) {
        console.error("Import error:", error);
        return NextResponse.json({ error: "Failed to process import." }, { status: 500 });
    }
}
