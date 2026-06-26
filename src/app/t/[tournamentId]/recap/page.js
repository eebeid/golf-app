import prisma from '@/lib/prisma';
import Navigation from '@/components/Navigation';
import RecapDashboard from '@/components/recap/RecapDashboard';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Trophy } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function RecapPage({ params }) {
    const { tournamentId } = await params;


    const tournament = await prisma.tournament.findUnique({
        where: { slug: tournamentId },
        include: {
            settings: true,
            courses: true,
            players: {
                include: {
                    scores: { include: { course: true } }
                }
            }
        }
    });

    if (!tournament) {
        return (
            <div className="container" style={{ padding: '4rem 20px', textAlign: 'center' }}>
                <h2>Tournament Not Found</h2>
            </div>
        );
    }

    const { players, settings, courses } = tournament;
    const numberOfRounds = settings?.numberOfRounds || 1;

    // Build a map of courseId → whole-course handicap for a player.
    // Mirrors the leaderboard's courseHandicaps calculation (USGA formula).
    const getCourseHandicaps = (player) => {
        const pcd = typeof player.courseData === 'string'
            ? JSON.parse(player.courseData || '{}')
            : (player.courseData || {});
        const result = {};
        courses.forEach(c => {
            const playerTeeName = pcd[c.id]?.tee;
            let tee = null;
            if (playerTeeName && Array.isArray(c.tees) && c.tees.length > 0) {
                tee = c.tees.find(t => t.name === playerTeeName);
            }
            if (!tee && Array.isArray(c.tees) && c.tees.length > 0) {
                const midIndex = Math.floor((c.tees.length - 1) / 2);
                tee = c.tees[midIndex] || c.tees[0];
            }
            if (tee && player.handicapIndex !== undefined) {
                result[c.id] = Math.round((player.handicapIndex * tee.slope / 113) + (tee.rating - c.par));
            } else {
                result[c.id] = Math.round(player.handicapIndex || 0);
            }
        });
        return result;
    };

    // Accumulate stats for a player up to (and including) upToRound.
    // Mirrors the leaderboard's buildLeaderboard exactly:
    //   - Filters by courseId + roundNum pair (from settings.roundCourses)
    //   - Skips Scramble rounds (they don't count toward individual Stableford totals)
    //   - Reads stablefordPoints from the DB (same source as the leaderboard)
    //   - Net score = gross - whole-course handicap (same as leaderboard)
    const calculateStats = (player, upToRound) => {
        const roundCourses = Array.isArray(settings?.roundCourses) ? settings.roundCourses : [];
        const roundTimeConfig = (typeof settings?.roundTimeConfig === 'object' && settings.roundTimeConfig !== null)
            ? settings.roundTimeConfig : {};
        const courseHandicaps = getCourseHandicaps(player);

        let totalPoints = 0;
        let totalGross = 0;
        let totalNet = 0;
        let holesPlayed = 0;

        for (let r = 1; r <= upToRound; r++) {
            const courseIdForRound = roundCourses[r - 1] || null;
            const format = roundTimeConfig[r]?.format || 'Stableford';

            // Skip Scramble rounds — they don't count toward individual Stableford totals
            if (format === 'Scramble') continue;

            // Filter scores by the specific course+round assigned in settings
            const roundScores = player.scores.filter(s => {
                if ((s.round || 1) !== r) return false;
                return courseIdForRound ? s.courseId === courseIdForRound : true;
            });

            if (roundScores.length === 0) continue;

            const roundPoints = roundScores.reduce((sum, s) => sum + (s.stablefordPoints || 0), 0);
            const roundGross  = roundScores.reduce((sum, s) => sum + s.score, 0);
            const ch          = courseIdForRound ? (courseHandicaps[courseIdForRound] || 0) : 0;

            totalPoints  += roundPoints;
            totalGross   += roundGross;
            totalNet     += roundGross - ch;
            holesPlayed  += roundScores.length;
        }

        return { totalPoints, totalGross, totalNet, holesPlayed };
    };

    // Determine which rounds have scores (active or completed)
    const completedRounds = [];
    for (let r = 1; r <= numberOfRounds; r++) {
        const roundScores = players.flatMap(p => p.scores.filter(s => s.round === r));
        if (roundScores.length > 0) {
            completedRounds.push(r);
        }
    }

    // Build historical rankings for each completed round to find "Movers"
    const rankingsByRound = [];
    for (let i = 0; i < completedRounds.length; i++) {
        const r = completedRounds[i];
        const roundStandings = players.map(p => ({
            id: p.id,
            name: p.name,
            stats: calculateStats(p, r)
        })).sort((a, b) => {
            // Priority: Points (Stableford) > Net (if points tie or not used)
            if (a.stats.totalPoints !== b.stats.totalPoints) {
                return b.stats.totalPoints - a.stats.totalPoints;
            }
            return a.stats.totalNet - b.stats.totalNet;
        });
        rankingsByRound.push(roundStandings); // Index 0 is the first completed round, etc.
    }

    // Find "Biggest Movers" for each completed round (except the first one)
    const moversByRound = {};
    for (let i = 1; i < completedRounds.length; i++) {
        const prevRankings = rankingsByRound[i - 1];
        const currentRankings = rankingsByRound[i];
        const roundNumber = completedRounds[i];
        
        const movers = currentRankings.map((p, index) => {
            const prevIndex = prevRankings.findIndex(pr => pr.id === p.id);
            const movement = prevIndex - index; // positive means jumped up
            return { ...p, movement };
        }).sort((a, b) => b.movement - a.movement);
        
        moversByRound[roundNumber] = movers.slice(0, 3).filter(m => m.movement > 0);
    }

    // Hole Difficulty Analysis
    const holeStats = {}; // { courseId_holeNum: { totalDiff: 0, count: 0 } }
    players.forEach(p => {
        p.scores.forEach(s => {
            const courseHoles = Array.isArray(s.course?.holes) ? s.course.holes : [];
            const holeData = courseHoles.find(h => h.number === s.hole);
            if (holeData) {
                const key = `${s.courseId}_${s.hole}`;
                if (!holeStats[key]) holeStats[key] = { totalDiff: 0, count: 0, par: holeData.par, holeColor: holeData.color, courseName: s.course.name };
                holeStats[key].totalDiff += (s.score - holeData.par);
                holeStats[key].count++;
            }
        });
    });

    const difficultHoles = Object.entries(holeStats).map(([key, stats]) => {
        const [courseId, holeNum] = key.split('_');
        return {
            courseId,
            holeNum: parseInt(holeNum),
            avgDiff: stats.totalDiff / stats.count,
            ...stats
        };
    }).sort((a, b) => b.avgDiff - a.avgDiff);

    const easiestHoles = [...difficultHoles].sort((a, b) => a.avgDiff - b.avgDiff);

    // Notable Birdies/Eagles (Highlights)
    const highlights = [];
    players.forEach(p => {
        p.scores.forEach(s => {
            const courseHoles = Array.isArray(s.course?.holes) ? s.course.holes : [];
            const holeData = courseHoles.find(h => h.number === s.hole);
            if (holeData && s.score < holeData.par) {
                highlights.push({
                    playerName: p.name,
                    playerId: p.id,
                    score: s.score,
                    par: holeData.par,
                    diff: s.score - holeData.par,
                    holeNum: s.hole,
                    round: s.round,
                    courseName: s.course.name
                });
            }
        });
    });

    // ── Safety Checks for data existence ──────────────────────────────────────
    if (completedRounds.length === 0) {
        return (
            <div style={{ paddingBottom: '4rem' }}>
                <div className="container" style={{ padding: '4rem 20px', textAlign: 'center' }}>
                    <h2>Recap data is not yet available.</h2>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {numberOfRounds === 1 
                            ? 'Enter some scores to see the recap!' 
                            : 'Complete at least one round or enter scores to see the recap!'}
                    </p>
                </div>
            </div>
        );
    }

    // ── Overall ───────────────────────────────────────────────────────────────
    const finalLeaders = rankingsByRound[rankingsByRound.length - 1];

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <div className="container fade-in" style={{ padding: '2rem 20px', maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <Link href={`/t/${tournamentId}/leaderboard`} style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}>
                        <Trophy size={16} /> Back to Leaderboard
                    </Link>
                </div>
                <RecapDashboard 
                    tournament={tournament}
                    rankingsByRound={rankingsByRound}
                    moversByRound={moversByRound}
                    difficultHoles={difficultHoles.slice(0, 5)}
                    easiestHoles={easiestHoles.slice(0, 5)}
                    highlights={highlights.filter(h => completedRounds.includes(h.round)).sort((a, b) => a.diff - b.diff).slice(0, 10)}
                    finalLeaders={finalLeaders}
                    numberOfRounds={numberOfRounds}
                    completedRounds={completedRounds}
                />
            </div>
        </div>
    );
}
