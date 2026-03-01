import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('tournamentId');

    let where = {};
    if (slug) {
        const t = await prisma.tournament.findUnique({ where: { slug } });
        if (t) where.tournamentId = t.id;
    }

    const players = await prisma.player.findMany({ where, orderBy: { registeredAt: 'desc' } });
    return NextResponse.json(players);
}

export async function POST(request) {
    const body = await request.json();
    const {
        name,
        email,
        handicapIndex,
        teeRiver,
        teePlantation,
        teeRNK,
        hcpRiver,
        hcpPlantation,
        hcpRNK,
        courseData, // Dynamic courses
        tournamentId // slug
    } = body;

    if (!name) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    let tId = null;
    if (tournamentId) {
        const t = await prisma.tournament.findUnique({ where: { slug: tournamentId } });
        if (t) tId = t.id;
    }

    try {
        const player = await prisma.player.create({
            data: {
                name,
                email: email || null,
                handicapIndex: handicapIndex || 0,
                teeRiver: teeRiver || 'Gold',
                teePlantation: teePlantation || 'Gold',
                teeRNK: teeRNK || 'Gold',
                hcpRiver: hcpRiver || 0,
                hcpPlantation: hcpPlantation || 0,
                hcpRNK: hcpRNK || 0,
                courseData: courseData || {},
                tournamentId: tId
            }
        });

        return NextResponse.json(player);
    } catch (error) {
        console.error('Error registering player:', error);
        return NextResponse.json({ error: 'Failed to register player' }, { status: 500 });
    }
}
