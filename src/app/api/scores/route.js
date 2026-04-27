import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isSuperAdmin } from "@/lib/admin";


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
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tournamentSlug = searchParams.get('tournamentId');
    const round = searchParams.get('round');

    try {
        const isAdmin = isSuperAdmin(session.user.email);

        if (tournamentSlug && round) {
            const tournament = await prisma.tournament.findUnique({
                where: { slug: tournamentSlug }
            });

            if (!tournament) {
                return NextResponse.json({ error: `Tournament '${tournamentSlug}' not found` }, { status: 404 });
            }

            // Check if user is owner or manager
            let isAuthorized = isAdmin || tournament.ownerId === session.user.id;
            if (!isAuthorized) {
                const manager = await prisma.player.findFirst({
                    where: { tournamentId: tournament.id, email: session.user.email, isManager: true }
                });
                if (manager) isAuthorized = true;
            }

            if (!isAuthorized) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }

            const roundNum = parseInt(round);
            if (isNaN(roundNum)) {
                return NextResponse.json({ error: "Invalid round number" }, { status: 400 });
            }

            const players = await prisma.player.findMany({
                where: { tournamentId: tournament.id },
                select: { id: true }
            });
            const playerIds = players.map(p => p.id);

            await prisma.score.deleteMany({
                where: {
                    round: roundNum,
                    playerId: { in: playerIds }
                }
            });

            return NextResponse.json({ success: true, message: `Cleared scores for Round ${roundNum}` });
        }

        // Global delete — only for Super Admins
        if (!isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const globalDelete = await prisma.score.deleteMany({});
        return NextResponse.json({ success: true, count: globalDelete.count });
    } catch (error) {
        console.error('Error clearing scores:', error);
        return NextResponse.json({ error: "Failed to clear scores" }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        const body = await request.json();
        const { playerId, hole, score, courseId, round } = body;

        const holeNum = parseInt(hole);
        const scoreVal = parseInt(score);
        const roundVal = parseInt(round) || 1;

        if (!courseId || !playerId || !holeNum) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Fetch Course & Player & Tournament Settings
        const [course, player] = await Promise.all([
            prisma.course.findUnique({ where: { id: courseId } }),
            prisma.player.findUnique({ where: { id: playerId } })
        ]);

        if (!course || !player) {
            return NextResponse.json({ error: "Course or Player not found" }, { status: 404 });
        }

        const tournament = await prisma.tournament.findUnique({
            where: { id: course.tournamentId },
            include: { settings: true }
        });

        // AUTHORIZATION CHECK
        let isAuthorized = false;
        if (session?.user) {
            // Admin/Manager check
            if (isSuperAdmin(session.user.email)) isAuthorized = true;
            if (tournament.ownerId === session.user.id) isAuthorized = true;
            
            if (!isAuthorized) {
                const manager = await prisma.player.findFirst({
                    where: { tournamentId: tournament.id, email: session.user.email, isManager: true }
                });
                if (manager) isAuthorized = true;
            }

            // Player self-edit or group-edit check
            if (!isAuthorized && tournament.settings?.allowPlayerEdits) {
                if (session.user.email?.toLowerCase() === player.email?.toLowerCase()) {
                    isAuthorized = true;
                } else {
                    // Check if the session user is in the same tee time as the target player
                    const sessionPlayer = await prisma.player.findFirst({
                        where: { tournamentId: tournament.id, email: session.user.email }
                    });
                    if (sessionPlayer) {
                        const allTeeTimes = await prisma.teeTime.findMany({
                            where: { tournamentId: tournament.id, round: roundVal }
                        });
                        
                        for (const tt of allTeeTimes) {
                            if (!Array.isArray(tt.players)) continue;
                            const ids = tt.players.map(p => typeof p === 'object' ? p.id : p);
                            if (ids.includes(player.id) && ids.includes(sessionPlayer.id)) {
                                isAuthorized = true;
                                break;
                            }
                        }
                    }
                }
            }
        }

        if (!isAuthorized) {
            return NextResponse.json({ error: "Unauthorized to post scores" }, { status: 403 });
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
        // Apply max handicap cap (after percentage)
        const dbMaxHandicap = settings?.roundTimeConfig && typeof settings.roundTimeConfig === 'object' ? settings.roundTimeConfig.maxHandicap : null;
        if (dbMaxHandicap != null && courseHandicap > dbMaxHandicap) {
            courseHandicap = dbMaxHandicap;
        }

        // SCRAMBLE LOGIC: If this round is a scramble, identify the team and replicate the score
        const roundConfig = settings?.roundTimeConfig?.[roundVal] || {};
        const isScramble = roundConfig.format === 'Scramble';
        let targetPlayerIds = [playerId];

        if (isScramble) {
            const allTeeTimes = await prisma.teeTime.findMany({
                where: {
                    tournamentId: course.tournamentId,
                    round: roundVal
                }
            });
            const teeTime = allTeeTimes.find(tt => {
                if (!Array.isArray(tt.players)) return false;
                const ids = tt.players.map(p => typeof p === 'object' ? p.id : p);
                return ids.includes(playerId);
            });

            if (teeTime && Array.isArray(teeTime.players)) {
                const parsedGroupIds = teeTime.players.map(p => typeof p === 'object' ? p.id : p);
                const isGlobalRyder = settings?.ryderCupConfig?.enabled;
                const isRoundMatch = roundConfig.format === 'RyderCup' || roundConfig.format === 'MatchPlay' || isScramble;

                if (isGlobalRyder || isRoundMatch) {
                    // Find which Ryder Cup team this player is on
                    const team1Ids = isGlobalRyder ? (settings.ryderCupConfig.team1 || []) : (roundConfig.team1 || []);
                    const team2Ids = isGlobalRyder ? (settings.ryderCupConfig.team2 || []) : (roundConfig.team2 || []);

                    const isOnTeam1 = team1Ids.includes(playerId);
                    const isOnTeam2 = team2Ids.includes(playerId);

                    if (isOnTeam1) {
                        targetPlayerIds = parsedGroupIds.filter(pid => team1Ids.includes(pid));
                    } else if (isOnTeam2) {
                        targetPlayerIds = parsedGroupIds.filter(pid => team2Ids.includes(pid));
                    } else {
                        targetPlayerIds = parsedGroupIds;
                    }
                } else {
                    // No teams defined, whole group is one scramble team
                    targetPlayerIds = parsedGroupIds;
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

            let holeHandicap = holeData?.handicapIndex || 18;

            if (currentTidPlayer) {
                pHandicap = Math.round(currentTidPlayer.handicapIndex || 0);
                const pcd = typeof currentTidPlayer.courseData === 'string' ? JSON.parse(currentTidPlayer.courseData || '{}') : (currentTidPlayer.courseData || {});
                
                // --- NEW: Tee-Specific Hole Handicap ---
                if (pcd[courseId] && pcd[courseId].tee) {
                    const playerTeeName = pcd[courseId].tee;
                    const courseTees = Array.isArray(course.tees) ? course.tees : [];
                    const selectedTee = courseTees.find(t => t.name === playerTeeName);
                    
                    if (selectedTee && Array.isArray(selectedTee.handicaps)) {
                        const teeHoleHcp = selectedTee.handicaps.find(h => h.hole === holeNum);
                        if (teeHoleHcp && teeHoleHcp.index) {
                            holeHandicap = parseInt(teeHoleHcp.index);
                        }
                    }
                }
                // ----------------------------------------

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
                // Apply max handicap cap (after percentage)
                const dbMaxHcp = settings?.roundTimeConfig && typeof settings.roundTimeConfig === 'object' ? settings.roundTimeConfig.maxHandicap : null;
                if (dbMaxHcp != null && pHandicap > dbMaxHcp) {
                    pHandicap = dbMaxHcp;
                }
            }

            let pStrokes = 0;
            if (pHandicap > 0) {
                pStrokes = Math.floor(pHandicap / 18) + (holeHandicap <= (pHandicap % 18) ? 1 : 0);
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

        // PUSHER TRIGGER: Highlight notable scores (Birdie or better)
        if (scoreVal > 0 && scoreVal < par) {
            const scoreDiff = par - scoreVal;
            let scoreTitle = 'Birdie';
            if (scoreDiff === 2) scoreTitle = 'Eagle';
            else if (scoreDiff >= 3) scoreTitle = 'Albatross';

            try {
                await pusherServer.trigger(`tournament-${course.tournamentId}`, 'highlight', {
                    playerName: player.name,
                    achievement: `Scored a ${scoreVal} on Par ${par}`,
                    hole: holeNum,
                    scoreTitle: scoreTitle,
                    tournamentId: course.tournamentId
                });
            } catch (pusherError) {
                console.error("Pusher Notification Error:", pusherError);
                // Don't fail the score update if Pusher fails
            }
        }

        return NextResponse.json({ success: true });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Server Error", details: e.message }, { status: 500 });
    }
}
