import { NextResponse } from 'next/server';
import { getData, addPlayer } from '@/lib/data';

export async function GET() {
    const players = await getData('players');
    return NextResponse.json(players);
}

export async function POST(request) {
    const body = await request.json();
    const player = {
        id: Date.now(),
        name: body.name,
        handicap: body.handicap,
        registeredAt: new Date().toISOString()
    };

    await addPlayer(player);
    return NextResponse.json(player);
}
