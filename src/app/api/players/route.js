import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    const players = await prisma.player.findMany({ orderBy: { registeredAt: 'desc' } });
    return NextResponse.json(players);
}

export async function POST(request) {
    const body = await request.json();

    if (!body.name) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const newPlayer = await prisma.player.create({
        data: {
            name: body.name,
            handicap: parseInt(body.handicap) || 0,
        }
    });

    return NextResponse.json(newPlayer);
}
