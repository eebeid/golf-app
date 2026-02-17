
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) return NextResponse.json([]);

    let tId = tournamentId;
    // Resolve slug to ID if necessary
    const t = await prisma.tournament.findUnique({ where: { slug: tournamentId } });
    if (t) tId = t.id;

    try {
        const data = await prisma.lodging.findMany({
            where: { tournamentId: tId },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch lodging" }, { status: 500 });
    }
}

export async function POST(request) {
    const body = await request.json();
    const { name, address, url, notes, checkIn, checkOut, image, tournamentId } = body;

    if (!name || !tournamentId) {
        return NextResponse.json({ error: "Name and Tournament ID required" }, { status: 400 });
    }

    let tId = tournamentId;
    const t = await prisma.tournament.findUnique({ where: { slug: tournamentId } });
    if (t) tId = t.id;
    else return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

    try {
        const newItem = await prisma.lodging.create({
            data: { name, address, url, notes, checkIn, checkOut, image, tournamentId: tId }
        });
        return NextResponse.json(newItem);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to create lodging" }, { status: 500 });
    }
}
