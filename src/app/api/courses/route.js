
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isSuperAdmin } from "@/lib/admin";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const scope = searchParams.get('scope');

    if (scope === 'global') {
        try {
            // Fetch unique courses by name to serve as a library
            const courses = await prisma.course.findMany({
                orderBy: { name: 'asc' },
                distinct: ['name'], // Only return unique names
            });
            return NextResponse.json(courses);
        } catch (error) {
            console.error('Error fetching global courses:', error);
            return NextResponse.json({ error: 'Failed to fetch global courses' }, { status: 500 });
        }
    }

    if (!tournamentId) return NextResponse.json([]); // Return empty for new tournaments (clean slate)

    let tId = tournamentId;
    const t = await prisma.tournament.findUnique({ where: { slug: tournamentId } });
    if (t) tId = t.id;

    try {
        const courses = await prisma.course.findMany({
            where: { tournamentId: tId },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(courses);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        let { courses, tournamentId } = body;

        if (Array.isArray(body)) {
            courses = body;
            const { searchParams } = new URL(request.url);
            tournamentId = searchParams.get('tournamentId');
        }

        if (!tournamentId) {
            return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
        }

        const tournament = await prisma.tournament.findUnique({ 
            where: { slug: tournamentId },
            include: { owner: true }
        });

        if (!tournament) {
            return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
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
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!Array.isArray(courses)) {
            return NextResponse.json({ error: 'Courses must be an array' }, { status: 400 });
        }

        const results = [];
        for (const c of courses) {
            // Safety parsing for numeric fields
            const par = parseInt(c.par) || 72;
            const lat = c.lat && c.lat !== "" ? parseFloat(c.lat) : null;
            const lng = c.lng && c.lng !== "" ? parseFloat(c.lng) : null;

            const isUuid = c.id && typeof c.id === 'string' && c.id.length > 30;

            if (isUuid) {
                const updated = await prisma.course.update({
                    where: { id: c.id },
                    data: {
                        name: c.name,
                        par: par,
                        address: c.address || null,
                        lat: isNaN(lat) ? null : lat,
                        lng: isNaN(lng) ? null : lng,
                        tees: c.tees || [],
                        holes: c.holes || []
                    }
                });
                results.push(updated);
            } else {
                const created = await prisma.course.create({
                    data: {
                        name: c.name,
                        par: par,
                        address: c.address || null,
                        lat: isNaN(lat) ? null : lat,
                        lng: isNaN(lng) ? null : lng,
                        tees: c.tees || [],
                        holes: c.holes && c.holes.length > 0 ? c.holes : Array.from({ length: 18 }, (_, i) => ({
                            number: i + 1,
                            par: 4,
                            handicapIndex: i + 1
                        })),
                        tournamentId: tournament.id
                    }
                });
                results.push(created);
            }
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error('Error saving courses:', error);
        return NextResponse.json({ error: 'Failed to update courses', details: error.message }, { status: 500 });
    }
}

