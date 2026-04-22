
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
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, address, cuisine, url, phone, rating, notes, date, lat, lng, tournamentId, payerId, paymentLink } = body;

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

        const parsedLat = (lat !== undefined && lat !== null && lat !== "") ? parseFloat(lat) : null;
        const parsedLng = (lng !== undefined && lng !== null && lng !== "") ? parseFloat(lng) : null;

        const newItem = await prisma.restaurant.create({
            data: {
                name, 
                address: address || null, 
                cuisine: cuisine || null, 
                url: url || null, 
                phone: phone || null, 
                notes: notes || null, 
                date: date || null,
                lat: isNaN(parsedLat) ? null : parsedLat,
                lng: isNaN(parsedLng) ? null : parsedLng,
                rating: rating ? parseInt(rating) : null,
                payerId: payerId || null,
                paymentLink: paymentLink || null,
                tournamentId: tournament.id
            }
        });
        return NextResponse.json(newItem);
    } catch (e) {
        console.error("Restaurant Create Error:", e);
        return NextResponse.json({ error: "Failed to create restaurant", details: e.message }, { status: 500 });
    }
}
