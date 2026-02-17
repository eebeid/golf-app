
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) return NextResponse.json([]);

    let tId = tournamentId;
    const t = await prisma.tournament.findUnique({ where: { slug: tournamentId } });
    if (t) tId = t.id;

    try {
        const data = await prisma.restaurant.findMany({
            where: { tournamentId: tId },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch restaurants" }, { status: 500 });
    }
}

export async function POST(request) {
    const body = await request.json();
    const { name, address, cuisine, url, phone, rating, notes, tournamentId } = body;

    if (!name || !tournamentId) {
        return NextResponse.json({ error: "Name and Tournament ID required" }, { status: 400 });
    }

    let tId = tournamentId;
    const t = await prisma.tournament.findUnique({ where: { slug: tournamentId } });
    if (t) tId = t.id;
    else return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

    try {
        const newItem = await prisma.restaurant.create({
            data: {
                name, address, cuisine, url, phone, notes,
                rating: rating ? parseInt(rating) : undefined,
                tournamentId: tId
            }
        });
        return NextResponse.json(newItem);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to create restaurant" }, { status: 500 });
    }
}
