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

    // Require either a course or tournament filter to prevent leaking all scores
    if (!courseId && !tournamentId) {
        return NextResponse.json([]);
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
        let courseHandicap = Math.round(player.handicapIndex || 0);

        // Preference 1: Look in the modern courseData map
        const pCourseData = typeof player.courseData === 'string' ? JSON.parse(player.courseData || '{}') : (player.courseData || {});
        if (pCourseData[courseId] && pCourseData[courseId].hcp !== undefined) {
            courseHandicap = pCourseData[courseId].hcp;
        } else {
            // Preference 2: Legacy heuristic based on name match
            const cName = course.name.toLowerCase();
            if (cName.includes('plantation')) courseHandicap = player.hcpPlantation || courseHandicap;
            else if (cName.includes('river')) courseHandicap = player.hcpRiver || courseHandicap;
            else if (cName.includes('royal') || cName.includes('rnk')) courseHandicap = player.hcpRNK || courseHandicap;
        }

        // Fetch tournament settings to apply round-specific handicap percentage
        const settings = await prisma.settings.findUnique({
            where: { tournamentId: course.tournamentId }
        });

        if (settings && settings.roundHandicaps && Array.isArray(settings.roundHandicaps)) {
            // roundVal is 1-indexed, so roundVal - 1 is the array index
            const hcpPctStr = settings.roundHandicaps[roundVal - 1];
            if (hcpPctStr !== undefined && hcpPctStr !== null && hcpPctStr !== "") {
                const pct = parseFloat(hcpPctStr);
                if (!isNaN(pct)) {
                    // Apply percentage to course handicap and round appropriately
                    courseHandicap = Math.round(courseHandicap * (pct / 100));
                }
            }
        }

        // SCRAMBLE LOGIC: If this round is a scramble, identify the team and replicate the score
        const roundConfig = settings?.roundTimeConfig?.[roundVal] || {};
        const isScramble = roundConfig.format === 'Scramble';
        let targetPlayerIds = [playerId];

        if (isScramble) {
            const teeTime = await prisma.teeTime.findFirst({
                where: {
                    tournamentId: course.tournamentId,
                    round: roundVal,
                    players: { path: [], array_contains: playerId }
                }
            });

            if (teeTime && Array.isArray(teeTime.players)) {
                const isGlobalRyder = settings?.ryderCupConfig?.enabled;
                const isRoundMatch = roundConfig.format === 'RyderCup' || roundConfig.format === 'MatchPlay' || isScramble;

                if (isGlobalRyder || isRoundMatch) {
                    // Find which Ryder Cup team this player is on
                    const team1Ids = isGlobalRyder ? (settings.ryderCupConfig.team1 || []) : (roundConfig.team1 || []);
                    const team2Ids = isGlobalRyder ? (settings.ryderCupConfig.team2 || []) : (roundConfig.team2 || []);

                    const isOnTeam1 = team1Ids.includes(playerId);
                    const isOnTeam2 = team2Ids.includes(playerId);

                    if (isOnTeam1) {
                        targetPlayerIds = teeTime.players.filter(pid => team1Ids.includes(pid));
                    } else if (isOnTeam2) {
                        targetPlayerIds = teeTime.players.filter(pid => team2Ids.includes(pid));
                    } else {
                        targetPlayerIds = teeTime.players;
                    }
                } else {
                    // No teams defined, whole group is one scramble team
                    targetPlayerIds = teeTime.players;
                }
            }
        }

        // Loop through all target players (usually just 1, but multiple for Scramble)
        for (const tid of targetPlayerIds) {
            // Recalculate player-specific stats if needed (strokes received/stableford)
            // For scramble, we usually care about gross, but let's keep it complete.
            let pHandicap = 0;
            let currentTidPlayer = player;
            if (tid !== playerId) {
                currentTidPlayer = await prisma.player.findUnique({ where: { id: tid } });
            }

            if (currentTidPlayer) {
                pHandicap = Math.round(currentTidPlayer.handicapIndex || 0);
                const pcd = typeof currentTidPlayer.courseData === 'string' ? JSON.parse(currentTidPlayer.courseData || '{}') : (currentTidPlayer.courseData || {});
                if (pcd[courseId] && pcd[courseId].hcp !== undefined) {
                    pHandicap = pcd[courseId].hcp;
                } else {
                    const cn = course.name.toLowerCase();
                    if (cn.includes('plantation')) pHandicap = currentTidPlayer.hcpPlantation || pHandicap;
                    else if (cn.includes('river')) pHandicap = currentTidPlayer.hcpRiver || pHandicap;
                    else if (cn.includes('royal') || cn.includes('rnk')) pHandicap = currentTidPlayer.hcpRNK || pHandicap;
                }

                if (settings && settings.roundHandicaps && Array.isArray(settings.roundHandicaps)) {
                    const hcpPctStr = settings.roundHandicaps[roundVal - 1];
                    if (hcpPctStr) {
                        const pct = parseFloat(hcpPctStr);
                        if (!isNaN(pct)) pHandicap = Math.round(pHandicap * (pct / 100));
                    }
                }
            }

            let pStrokes = 0;
            if (pHandicap > 0) {
                pStrokes = Math.floor(pHandicap / 18) + (index <= (pHandicap % 18) ? 1 : 0);
            }
            const pNet = scoreVal - pStrokes;
            let pPoints = Math.max(0, par - pNet + 2);

            if (!scoreVal) {
                const deleteQuery = `DELETE FROM "Score" WHERE "playerId" = $1 AND "courseId" = $2 AND "hole" = $3 AND "round" = $4`;
                await prisma.$executeRawUnsafe(deleteQuery, tid, courseId, holeNum, roundVal);
            } else {
                const existing = await prisma.$queryRawUnsafe(
                    `SELECT id FROM "Score" WHERE "playerId" = $1 AND "courseId" = $2 AND "hole" = $3 AND "round" = $4 LIMIT 1`,
                    tid, courseId, holeNum, roundVal
                );

                if (existing && existing.length > 0) {
                    await prisma.$executeRawUnsafe(
                        `UPDATE "Score" SET "score" = $1, "stablefordPoints" = $2, "strokesReceived" = $3 WHERE "id" = $4`,
                        scoreVal, pPoints, pStrokes, existing[0].id
                    );
                } else {
                    const newId = crypto.randomUUID();
                    await prisma.$executeRawUnsafe(
                        `INSERT INTO "Score" ("id", "playerId", "courseId", "hole", "score", "stablefordPoints", "strokesReceived", "round", "createdAt") 
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
                        newId, tid, courseId, holeNum, scoreVal, pPoints, pStrokes, roundVal
                    );
                }
            }
        }

        return NextResponse.json({ success: true });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Server Error", details: e.message }, { status: 500 });
    }
}
