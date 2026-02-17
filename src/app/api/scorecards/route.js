import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) return NextResponse.json({ error: "Tournament ID required" }, { status: 400 });

    try {
        // Fetch all photos for the tournament
        const photos = await prisma.photo.findMany({
            where: {
                tournament: {
                    slug: tournamentId
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Filter for scorecards (caption starts with SCORECARD:)
        const scorecards = photos
            .filter(p => p.caption && p.caption.startsWith('SCORECARD:'))
            .map(p => {
                try {
                    const metadata = JSON.parse(p.caption.substring(10));
                    return {
                        id: p.id,
                        imageUrl: p.url,
                        ...metadata, // round, playerIds
                        createdAt: p.createdAt
                    };
                } catch (e) {
                    return null;
                }
            })
            .filter(Boolean); // Remove nulls

        return NextResponse.json(scorecards);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to fetch scorecards" }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { tournamentId, round, playerIds, imageUrl } = body;

        const tournament = await prisma.tournament.findUnique({
            where: { slug: tournamentId }
        });

        if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

        // Store metadata in caption
        const metadata = {
            type: 'scorecard',
            round: parseInt(round),
            playerIds: playerIds || []
        };
        const caption = `SCORECARD:${JSON.stringify(metadata)}`;

        const newPhoto = await prisma.photo.create({
            data: {
                url: imageUrl,
                caption: caption,
                tournamentId: tournament.id
            }
        });

        return NextResponse.json(newPhoto);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to create scorecard" }, { status: 500 });
    }
}

export async function DELETE(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    try {
        await prisma.photo.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
