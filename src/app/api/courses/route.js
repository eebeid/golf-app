
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
        const body = await request.json();
        // Support both array (legacy, needs query param) or object wrapper
        let { courses, tournamentId } = body;

        // If body is just array, check searchParams or fail
        if (Array.isArray(body)) {
            courses = body;
            // We need tournamentId query param if not in body
            const { searchParams } = new URL(request.url);
            tournamentId = searchParams.get('tournamentId');
        }

        if (!tournamentId) {
            return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
        }

        let tId = tournamentId;
        const t = await prisma.tournament.findUnique({ where: { slug: tournamentId } });
        if (t) tId = t.id;
        else return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });

        if (!Array.isArray(courses)) {
            return NextResponse.json({ error: 'Courses must be an array' }, { status: 400 });
        }

        const results = [];
        for (const c of courses) {
            // If ID is numeric (legacy) or missing, create new.
            // If ID is UUID, update.
            const isUuid = c.id && typeof c.id === 'string' && c.id.length > 30; // Rough check

            if (isUuid) {
                const updated = await prisma.course.update({
                    where: { id: c.id },
                    data: {
                        name: c.name,
                        par: c.par || 72,
                        address: c.address,
                        tees: c.tees || [],
                        holes: c.holes || []
                    }
                });
                results.push(updated);
            } else {
                const created = await prisma.course.create({
                    data: {
                        name: c.name,
                        par: c.par || 72,
                        address: c.address,
                        tees: c.tees || [],
                        holes: c.holes && c.holes.length > 0 ? c.holes : Array.from({ length: 18 }, (_, i) => ({
                            number: i + 1,
                            par: 4,
                            handicapIndex: i + 1
                        })),
                        tournamentId: tId
                    }
                });
                results.push(created);
            }
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error('Error saving courses:', error);
        return NextResponse.json({ error: 'Failed to update courses' }, { status: 500 });
    }
}

