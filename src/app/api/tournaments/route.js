
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const tournaments = await prisma.tournament.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(tournaments);
    } catch (e) {
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
        // Check slug availability
        const existing = await prisma.tournament.findUnique({ where: { slug: finalSlug } });
        if (existing) {
            return NextResponse.json({ error: 'Slug already taken. Please choose another.' }, { status: 400 });
        }

        // Generate a unique settings ID explicitly — avoids the legacy hardcoded default
        const settingsId = crypto.randomUUID();

        const tournament = await prisma.tournament.create({
            data: {
                name,
                slug: finalSlug,
                ownerId: session.user.id,
                settings: {
                    create: {
                        id: settingsId,
                        tournamentName: name,
                        numberOfRounds: 0,
                        showAccommodations: true,
                        showFood: true,
                        showPhotos: false,
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
