import { NextResponse } from 'next/server';
import { deletePlayer, getData, saveData } from '@/lib/data';

export async function DELETE(request, { params }) {
    const id = params.id;
    await deletePlayer(id);
    return NextResponse.json({ success: true });
}

export async function PUT(request, { params }) {
    const id = params.id;
    const body = await request.json();

    const players = await getData('players');
    const index = players.findIndex(p => p.id == id);

    if (index === -1) {
        return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    players[index] = { ...players[index], ...body };
    await saveData('players', players);

    return NextResponse.json(players[index]);
}
