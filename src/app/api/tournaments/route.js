
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

    try {
        // Check generic slug availability
        const existing = await prisma.tournament.findUnique({ where: { slug: finalSlug } });
        if (existing) {
            return NextResponse.json({ error: 'Slug already taken. Please choose another.' }, { status: 400 });
        }

        const tournament = await prisma.tournament.create({
            data: {
                name,
                slug: finalSlug,
                ownerId: session.user.id, // Assign ownership
                settings: {
                    create: {
                        id: `settings-${finalSlug}`, // Unique ID for this tournament's settings
                        tournamentName: name,
                        numberOfRounds: 0,
                        showAccommodations: true,
                        showFood: true,
                        showPhotos: false,
                        // Default generic logo?
                        logoUrl: "/images/logo.png" // Using new main logo
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
