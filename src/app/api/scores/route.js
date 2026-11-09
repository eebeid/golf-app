import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';
import { checkTournamentAdmin } from '@/lib/apiAuth';
import { isSuperAdmin } from '@/lib/admin';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Resolve an effective course handicap for a player on a specific course and round.
 * Handles the courseData map, legacy name-based lookup, round percentage, and max cap.
 */
function resolvePlayerHandicap(player, courseId, courseName, settings, roundVal) {
    const cName = courseName.toLowerCase();
    const pcd = typeof player.courseData === 'string'
        ? JSON.parse(player.courseData || '{}')
        : (player.courseData || {});

    let hcp = Math.round(player.handicapIndex || 0);

    // Prefer courseData map, then fall back to legacy named fields
    if (pcd[courseId]?.hcp !== undefined) {
        hcp = pcd[courseId].hcp;
    } else if (cName.includes('plantation')) {
        hcp = player.hcpPlantation ?? hcp;
    } else if (cName.includes('river')) {
        hcp = player.hcpRiver ?? hcp;
    } else if (cName.includes('royal') || cName.includes('rnk')) {
        hcp = player.hcpRNK ?? hcp;
    }

    // Apply round handicap percentage
    if (settings?.roundHandicaps && Array.isArray(settings.roundHandicaps)) {
        const pctStr = settings.roundHandicaps[roundVal - 1];
        if (pctStr !== undefined && pctStr !== null && pctStr !== '') {
            const pct = parseFloat(pctStr);
            if (!isNaN(pct)) hcp = Math.round(hcp * (pct / 100));
        }
    }

    // Apply max handicap cap
    const maxHcp = settings?.roundTimeConfig && typeof settings.roundTimeConfig === 'object'
        ? settings.roundTimeConfig.maxHandicap
        : null;
    if (maxHcp != null && hcp > maxHcp) hcp = maxHcp;

    return hcp;
}

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

        // Validate score is within a reasonable golf range (0 = delete, 1-20 = valid stroke count)
        if (scoreVal !== 0 && (scoreVal < 1 || scoreVal > 20)) {
            return NextResponse.json({ error: "Score must be between 1 and 20" }, { status: 400 });
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
        if (tournament.settings?.publicScoring) {
            isAuthorized = true;
        }

        // PPID Cookie / Access verification (allows scoring without OAuth login)
        if (!isAuthorized) {
            const cookieHeader = request.headers.get('cookie') || '';
            const accessSlugCookie = request.cookies?.get(`pinplaced_access_${tournament.slug}`)?.value;
            const accessIdCookie = request.cookies?.get(`pinplaced_access_${tournament.id}`)?.value;
            const recentPpidCookie = request.cookies?.get('pinplaced_recent_ppid')?.value;
            const bodyPpid = body.ppid ? String(body.ppid).trim().toUpperCase() : null;

            if (
                accessSlugCookie === '1' ||
                accessIdCookie === '1' ||
                cookieHeader.includes(`pinplaced_access_${tournament.slug}=1`) ||
                cookieHeader.includes(`pinplaced_access_${tournament.id}=1`) ||
                (tournament.ppid && (
                    recentPpidCookie === tournament.ppid ||
                    cookieHeader.includes(`pinplaced_recent_ppid=${tournament.ppid}`) ||
                    bodyPpid === tournament.ppid
                ))
            ) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized && session?.user) {
            if (isSuperAdmin(session.user.email)) isAuthorized = true;
            if (tournament.ownerId === session.user.id) isAuthorized = true;

            if (!isAuthorized) {
                const { isAuthorized: adminOk } = await checkTournamentAdmin(session, tournament);
                if (adminOk) isAuthorized = true;
            }

            // Player self-edit or group-edit check
            if (!isAuthorized && tournament.settings?.allowPlayerEdits) {
                const sessionPlayer = await prisma.player.findFirst({
                    where: { tournamentId: tournament.id, email: session.user.email }
                });
                if (sessionPlayer || session.user.email?.toLowerCase() === player.email?.toLowerCase()) {
                    isAuthorized = true;
                }
            }
        }

        if (!isAuthorized) {
            return NextResponse.json({ error: "Unauthorized to post scores" }, { status: 403 });
        }

        const settings = await prisma.settings.findUnique({
            where: { tournamentId: course.tournamentId }
        });

        // Hole data (par, handicap index) for this specific hole
        const holes = Array.isArray(course.holes) ? course.holes : [];
        const holeData = holes.find(h => h.number === holeNum);
        const par = holeData?.par || 4;

        // Use shared handicap resolver (replaces duplicated logic)
        const courseHandicap = resolvePlayerHandicap(player, courseId, course.name, settings, roundVal);

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
            let currentTidPlayer = player;
            if (tid !== playerId) {
                currentTidPlayer = await prisma.player.findUnique({ where: { id: tid } });
            }

            let holeHandicap = holeData?.handicapIndex || 18;

            // Resolve tee-specific hole handicap
            if (currentTidPlayer) {
                const pcd = typeof currentTidPlayer.courseData === 'string'
                    ? JSON.parse(currentTidPlayer.courseData || '{}')
                    : (currentTidPlayer.courseData || {});

                if (pcd[courseId]?.tee) {
                    const courseTees = Array.isArray(course.tees) ? course.tees : [];
                    const selectedTee = courseTees.find(t => t.name === pcd[courseId].tee);
                    if (selectedTee && Array.isArray(selectedTee.handicaps)) {
                        const teeHoleHcp = selectedTee.handicaps.find(h => h.hole === holeNum);
                        if (teeHoleHcp?.index) holeHandicap = parseInt(teeHoleHcp.index);
                    }
                }
            }

            // Use shared handicap resolver for each player in a scramble group
            const pHandicap = currentTidPlayer
                ? resolvePlayerHandicap(currentTidPlayer, courseId, course.name, settings, roundVal)
                : 0;

            let pStrokes = 0;
            if (pHandicap > 0) {
                pStrokes = Math.floor(pHandicap / 18) + (holeHandicap <= (pHandicap % 18) ? 1 : 0);
            }
            const pNet = scoreVal - pStrokes;
            const pPoints = Math.max(0, par - pNet + 2);

            if (!scoreVal) {
                // Delete score for this hole
                await prisma.score.deleteMany({
                    where: { playerId: tid, courseId, hole: holeNum, round: roundVal }
                });
            } else {
                // Upsert using Prisma ORM — no raw SQL
                await prisma.score.upsert({
                    where: {
                        playerId_courseId_hole_round: {
                            playerId: tid,
                            courseId,
                            hole: holeNum,
                            round: roundVal,
                        }
                    },
                    update: {
                        score: scoreVal,
                        stablefordPoints: pPoints,
                        strokesReceived: pStrokes,
                    },
                    create: {
                        playerId: tid,
                        courseId,
                        hole: holeNum,
                        score: scoreVal,
                        stablefordPoints: pPoints,
                        strokesReceived: pStrokes,
                        round: roundVal,
                    }
                });
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
