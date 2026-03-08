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

export async function DELETE(request) {
    const { searchParams } = new URL(request.url);
    const tournamentSlug = searchParams.get('tournamentId');
    const round = searchParams.get('round');

    try {
        if (tournamentSlug && round) {
            const roundNum = parseInt(round);
            if (isNaN(roundNum)) {
                return NextResponse.json({ error: "Invalid round number provided" }, { status: 400 });
            }

            const tournament = await prisma.tournament.findUnique({
                where: { slug: tournamentSlug }
            });

            if (!tournament) {
                return NextResponse.json({ error: `Tournament '${tournamentSlug}' not found` }, { status: 404 });
            }

            // Raw SQL bypass to avoid "Unknown argument round"
            const query = `
                DELETE FROM "Score" 
                WHERE "round" = $1 
                AND "playerId" IN (
                    SELECT id FROM "Player" WHERE "tournamentId" = $2
                )
            `;
            await prisma.$executeRawUnsafe(query, roundNum, tournament.id);

            return NextResponse.json({
                success: true,
                message: `Cleared scores for Round ${roundNum}`
            });
        }

        const globalDelete = await prisma.score.deleteMany({});
        return NextResponse.json({ success: true, count: globalDelete.count });
    } catch (error) {
        console.error('Error clearing scores:', error);
        return NextResponse.json({
            error: "Failed to clear scores",
            details: error.message
        }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { playerId, hole, score, courseId, round } = body;

        const holeNum = parseInt(hole);
        const scoreVal = parseInt(score);
        const roundVal = parseInt(round) || 1;

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
            // Raw SQL bypass to avoid "Unknown argument round"
            const deleteQuery = `
                DELETE FROM "Score" 
                WHERE "playerId" = $1 AND "courseId" = $2 AND "hole" = $3 AND "round" = $4
            `;
            await prisma.$executeRawUnsafe(deleteQuery, playerId, courseId, holeNum, roundVal);
            return NextResponse.json({ success: true, deleted: true });
        }

        // Raw SQL check for existing record (upsert workaround)
        const existing = await prisma.$queryRawUnsafe(
            `SELECT id FROM "Score" WHERE "playerId" = $1 AND "courseId" = $2 AND "hole" = $3 AND "round" = $4 LIMIT 1`,
            playerId, courseId, holeNum, roundVal
        );

        if (existing && existing.length > 0) {
            await prisma.$executeRawUnsafe(
                `UPDATE "Score" SET "score" = $1, "stablefordPoints" = $2, "strokesReceived" = $3 WHERE "id" = $4`,
                scoreVal, points, strokesReceived, existing[0].id
            );
        } else {
            const newId = crypto.randomUUID();
            await prisma.$executeRawUnsafe(
                `INSERT INTO "Score" ("id", "playerId", "courseId", "hole", "score", "stablefordPoints", "strokesReceived", "round", "createdAt") 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
                newId, playerId, courseId, holeNum, scoreVal, points, strokesReceived, roundVal
            );
        }

        return NextResponse.json({ success: true });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Server Error", details: e.message }, { status: 500 });
    }
}
