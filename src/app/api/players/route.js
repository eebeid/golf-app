import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    const players = await prisma.player.findMany({ orderBy: { registeredAt: 'desc' } });
    return NextResponse.json(players);
}

export async function POST(request) {
    const { name, handicapIndex, courseHandicap } = await request.json();

    if (!name) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const player = await prisma.player.create({
        data: {
            name,
            handicapIndex: handicapIndex || 0,
            courseHandicap: courseHandicap || 0
        }
    });

    return NextResponse.json(player);
}
