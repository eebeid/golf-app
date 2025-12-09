import { NextResponse } from 'next/server';
import { getData, saveData } from '@/lib/data';

export async function POST(request) {
    try {
        const { players: newPlayers } = await request.json();

        if (!Array.isArray(newPlayers)) {
            return NextResponse.json({ error: "Invalid data format. Expected array of players." }, { status: 400 });
        }

        const currentPlayers = await getData('players');

        // Process and validate
        const validNewPlayers = newPlayers.filter(p => p.name).map(p => ({
            id: Date.now() + Math.random(), // Simple unique ID generation
            name: p.name.trim(),
            handicap: parseInt(p.handicap) || 0,
            registeredAt: new Date().toISOString()
        }));

        // Append to existing
        const updatedPlayers = [...currentPlayers, ...validNewPlayers];
        await saveData('players', updatedPlayers);

        return NextResponse.json({ success: true, count: validNewPlayers.length });
    } catch (error) {
        console.error("Import error:", error);
        return NextResponse.json({ error: "Failed to process import." }, { status: 500 });
    }
}
