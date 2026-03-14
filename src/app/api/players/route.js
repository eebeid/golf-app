import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('tournamentId');

    if (!slug) {
        return NextResponse.json([]);
    }

    let t = await prisma.tournament.findUnique({ where: { slug } });
    if (!t) {
        // Fallback in case they linked using internal ID
        t = await prisma.tournament.findUnique({ where: { id: slug } });
    }

    if (!t) {
        return NextResponse.json([]); // Prevent returning ALL players if not found
    }

    const where = { tournamentId: t.id };
    const players = await prisma.player.findMany({ where, orderBy: { registeredAt: 'desc' } });
    return NextResponse.json(players);
}

export async function POST(request) {
    const body = await request.json();
    const {
        name,
        email,
        phone,
        ghin,
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
        const t = await prisma.tournament.findUnique({
            where: { slug: tournamentId },
            include: { owner: true, players: true }
        });

        if (t) {
            tId = t.id;

            // Pro Enforcement: Free limit is 4 players
            if (!t.owner?.isPro && t.players.length >= 4) {
                return NextResponse.json({
                    error: "Free tier is limited to 4 players. Please upgrade to Pro."
                }, { status: 403 });
            }
        }
    }

    try {
        const player = await prisma.player.create({
            data: {
                name,
                email: email || null,
                phone: phone || null,
                ghin: ghin || null,
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
