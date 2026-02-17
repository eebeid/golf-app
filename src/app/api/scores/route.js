import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const tournamentId = searchParams.get('tournamentId');

    let where = {};
    if (courseId) where.courseId = courseId; // UUID String
    if (tournamentId) {
        where.player = {
            tournament: {
                slug: tournamentId
            }
        };
    }

    try {
        const scores = await prisma.score.findMany({ where });
        return NextResponse.json(scores);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to fetch scores" }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        await prisma.score.deleteMany({});
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to clear scores" }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { playerId, hole, score, courseId } = body;

        const holeNum = parseInt(hole);
        const scoreVal = parseInt(score);

        if (!courseId || !playerId || !holeNum) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Fetch Course & Player from DB
        const [course, player] = await Promise.all([
            prisma.course.findUnique({ where: { id: courseId } }),
            prisma.player.findUnique({ where: { id: playerId } })
        ]);

        if (!course || !player) {
            return NextResponse.json({ error: "Course or Player not found" }, { status: 404 });
        }

        // Find configured hole data
        // hole data is stored in Json buffer in course.holes
        // Adjust for potential array structure
        const holes = Array.isArray(course.holes) ? course.holes : [];
        const holeData = holes.find(h => h.number === holeNum);

        // If hole data missing, fallback to defaults or error?
        // Let's assume par 4, index 18 if missing to prevent crash, but log it.
        const par = holeData?.par || 4;
        const index = holeData?.handicapIndex || 18;

        // Calculate Course Handicap for this specific course
        // Simple heuristic for now based on name match, similar to frontend
        // TODO: Store this linkage explicitly in DB?
        let courseHandicap = Math.round(player.handicapIndex || 0); // Default to Index

        const cName = course.name.toLowerCase();
        if (cName.includes('plantation')) courseHandicap = player.hcpPlantation || courseHandicap;
        else if (cName.includes('river')) courseHandicap = player.hcpRiver || courseHandicap;
        else if (cName.includes('royal') || cName.includes('rnk')) courseHandicap = player.hcpRNK || courseHandicap;

        // NOTE: If we want strict USGA calculation on the fly:
        // if (course.tees && course.tees.length) { ... calc from slope/rating ... }

        // Calculate Strokes Received for this hole
        // 1 stroke if SI <= Handicap. 
        // 2 strokes if SI <= (Handicap - 18)
        let strokesReceived = 0;
        if (courseHandicap > 0) {
            const base = Math.floor(courseHandicap / 18);
            const remainder = courseHandicap % 18;
            strokesReceived = base + (index <= remainder ? 1 : 0);
        } else if (courseHandicap < 0) {
            // Plus handicap logic (not implemented, rare)
        }

        // Calculate Stableford
        // Net Score = Gross - Strokes
        // Points = Par - Net Score + 2
        // e.g. Par 4, Stroke 1, Gross 5. Net 4. Points = 4 - 4 + 2 = 2.
        // e.g. Par 4, Stroke 1, Gross 4. Net 3. Points = 4 - 3 + 2 = 3.
        const netScore = scoreVal - strokesReceived;
        let points = par - netScore + 2;
        if (points < 0) points = 0;

        // If score is 0 or null, delete? Or store 0?
        // Usually 0 means 'did not play' or 'picked up' (Net Double Bogey max?). 
        // Let's assume deletion if score is cleared (null/empty string sent as 0?)
        // If user explicitly types 0, we might want to delete.

        if (!scoreVal) {
            await prisma.score.deleteMany({
                where: {
                    playerId: playerId,
                    courseId: courseId,
                    hole: holeNum
                }
            });
            return NextResponse.json({ success: true, deleted: true });
        }

        const savedScore = await prisma.score.upsert({
            where: {
                playerId_courseId_hole: {
                    playerId,
                    courseId,
                    hole: holeNum
                }
            },
            update: {
                score: scoreVal,
                stablefordPoints: points,
                strokesReceived: strokesReceived
            },
            create: {
                playerId,
                courseId,
                hole: holeNum,
                score: scoreVal,
                stablefordPoints: points,
                strokesReceived: strokesReceived
            }
        });

        return NextResponse.json(savedScore);

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
