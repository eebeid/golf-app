import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
    try {
        const { players: newPlayers } = await request.json();

        if (!Array.isArray(newPlayers)) {
            return NextResponse.json({ error: "Invalid data format. Expected array of players." }, { status: 400 });
        }

        // Process and validate
        // We can use createMany for bulk insert (SQLite supports it in recent versions, Postgres does too)
        // Or just Promise.all with create. createMany is cleaner but strictly validation might be harder.
        // Let's use transaction with create to be safe.

        const validPlayers = newPlayers.filter(p => p.name).map(p => ({
            name: p.name.trim(),
            handicapIndex: parseFloat(p.handicap) || 0, // Note: Schema uses 'handicapIndex', UI sends 'handicap'
            teeRiver: p.teeRiver || 'Gold',
            teePlantation: p.teePlantation || 'Gold',
            teeRNK: p.teeRNK || 'Gold'
        }));

        if (validPlayers.length === 0) return NextResponse.json({ success: true, count: 0 });

        // Prisma createMany is supported in SQLite
        const result = await prisma.player.createMany({
            data: validPlayers
        });

        return NextResponse.json({ success: true, count: result.count });
    } catch (error) {
        console.error("Import error:", error);
        return NextResponse.json({ error: "Failed to process import." }, { status: 500 });
    }
}
