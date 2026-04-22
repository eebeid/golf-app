import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from '@/lib/prisma';
import { isSuperAdmin } from "@/lib/admin";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json([]);
        }

        const isAdmin = isSuperAdmin(session.user.email);
        
        const where = isAdmin ? {} : { ownerId: session.user.id };

        const tournaments = await prisma.tournament.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(tournaments);
    } catch (e) {
        console.error("Tournaments GET error:", e);
        return NextResponse.json({ error: "Failed to fetch tournaments" }, { status: 500 });
    }
}

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug } = body;

    if (!name) {
        return NextResponse.json({ error: 'Tournament name is required' }, { status: 400 });
    }

    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { tournaments: true }
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.isPro && user.tournaments.length >= 1) {
        return NextResponse.json({
            error: 'Free tier is limited to 1 tournament. Upgrade to Pro to create more.'
        }, { status: 403 });
    }

    try {
        // Check if the desired slug is taken; if so, append a short timestamp suffix
        const existing = await prisma.tournament.findUnique({ where: { slug: finalSlug } });
        const resolvedSlug = existing
            ? `${finalSlug}-${Date.now().toString(36)}`
            : finalSlug;

        // Generate a unique settings ID explicitly — avoids the legacy hardcoded default
        const settingsId = crypto.randomUUID();

        const tournament = await prisma.tournament.create({
            data: {
                name,
                slug: resolvedSlug,
                ownerId: session.user.id,
                settings: {
                    create: {
                        id: settingsId,
                        tournamentName: name,
                        numberOfRounds: 0,
                        // Core pages ON by default
                        showCourses:        true,
                        showPlayers:        true,
                        showSchedule:       true,
                        showPlay:           true,
                        showLeaderboard:    true,
                        // Everything else OFF
                        showAccommodations: false,
                        showFood:           false,
                        showPhotos:         false,
                        showPrizes:         false,
                        showChat:           false,
                        showStats:          false,
                        showScorecards:     false,
                        logoUrl: "/images/pinplaced_primary_logo_transparent.png"
                    }
                }
            }
        });

        return NextResponse.json(tournament);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 });
    }
}
