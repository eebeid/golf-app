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
        const data = await prisma.activity.findMany({
            where: { tournamentId: tId },
            include: {
                signups: {
                    include: {
                        player: true
                    }
                }
            },
            orderBy: { date: 'asc' }
        });
        return NextResponse.json(data);
    } catch (e) {
        console.error("Fetch Activities Error:", e);
        return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            title,
            description,
            date,
            endTime,
            location,
            cost,
            maxPeople,
            minPeople,
            reservationsRequired,
            venmoLink,
            category,
            icon,
            tournamentId
        } = body;

        if (!title || !date || !tournamentId) {
            return NextResponse.json({ error: "Title, Date and Tournament ID are required" }, { status: 400 });
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

        const parsedCost = (cost !== undefined && cost !== null && cost !== "") ? parseFloat(cost) : null;
        const parsedMaxPeople = (maxPeople !== undefined && maxPeople !== null && maxPeople !== "") ? parseInt(maxPeople) : null;
        const parsedMinPeople = (minPeople !== undefined && minPeople !== null && minPeople !== "") ? parseInt(minPeople) : 0;

        const newItem = await prisma.activity.create({
            data: {
                title,
                description: description || null,
                date: new Date(date),
                endTime: endTime ? new Date(endTime) : null,
                location: location || null,
                cost: isNaN(parsedCost) ? null : parsedCost,
                maxPeople: isNaN(parsedMaxPeople) ? null : parsedMaxPeople,
                minPeople: isNaN(parsedMinPeople) ? 0 : parsedMinPeople,
                reservationsRequired: !!reservationsRequired,
                venmoLink: venmoLink || null,
                category: category || null,
                icon: icon || null,
                tournamentId: tournament.id
            },
            include: {
                signups: {
                    include: {
                        player: true
                    }
                }
            }
        });
        return NextResponse.json(newItem);
    } catch (e) {
        console.error("Activity Create Error:", e);
        return NextResponse.json({ error: "Failed to create activity", details: e.message }, { status: 500 });
    }
}
