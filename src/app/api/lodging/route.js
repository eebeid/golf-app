
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isSuperAdmin } from "@/lib/admin";

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
            orderBy: { name: 'asc' },
            include: {
                players: {
                    include: { player: { select: { id: true, name: true } } }
                }
            }
        });
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch lodging" }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, address, unitNumber, url, notes, checkIn, checkOut, image, tournamentId } = body;

        if (!name || !tournamentId) {
            return NextResponse.json({ error: "Name and Tournament ID required" }, { status: 400 });
        }

        const tournament = await prisma.tournament.findUnique({ 
            where: { slug: tournamentId },
            include: { owner: true }
        });

        if (!tournament) {
            return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
        }

        // AUTHORIZATION CHECK
        let isAuthorized = isSuperAdmin(session.user.email) || tournament.ownerId === session.user.id;
        if (!isAuthorized) {
            const manager = await prisma.player.findFirst({
                where: { tournamentId: tournament.id, email: session.user.email, isManager: true }
            });
            if (manager) isAuthorized = true;
        }

        if (!isAuthorized) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const newItem = await prisma.lodging.create({
            data: { 
                name, 
                address: address || null, 
                unitNumber: unitNumber || null, 
                url: url || null, 
                notes: notes || null, 
                checkIn: checkIn || null, 
                checkOut: checkOut || null, 
                image: image || null, 
                tournamentId: tournament.id 
            },
            include: {
                players: {
                    include: { player: { select: { id: true, name: true } } }
                }
            }
        });
        return NextResponse.json(newItem);
    } catch (e) {
        console.error("Lodging Create Error:", e);
        return NextResponse.json({ error: "Failed to create lodging", details: e.message }, { status: 500 });
    }
}
