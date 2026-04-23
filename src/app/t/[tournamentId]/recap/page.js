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

    // Helper to calculate total points/gross for a player up to a certain round
    const calculateStats = (player, upToRound) => {
        const scores = player.scores.filter(s => (s.round || 1) <= upToRound);
        const totalPoints = scores.reduce((sum, s) => sum + (s.stablefordPoints || 0), 0);
        const totalGross = scores.reduce((sum, s) => sum + s.score, 0);
        const holesPlayed = scores.length;
        
        // Find which round courses were assigned to
        const roundCourses = settings?.roundCourses || [];
        
        // This is a bit simplified for net score calculation without full course data for all rounds
        // but we can use the strokesReceived from the score records which are already saved.
        const totalStrokesReceived = scores.reduce((sum, s) => sum + (s.strokesReceived || 0), 0);
        const totalNet = totalGross - totalStrokesReceived;

        return { totalPoints, totalGross, totalNet, holesPlayed };
    };

    // Determine which rounds are completed
    // A round is completed if it has scores, AND every player who started it has finished 18 holes
    const completedRounds = [];
    for (let r = 1; r <= numberOfRounds; r++) {
        const roundScores = players.flatMap(p => p.scores.filter(s => s.round === r));
        if (roundScores.length === 0) continue;

        const isCompleted = players.every(p => {
            const pScores = p.scores.filter(s => s.round === r);
            return pScores.length === 0 || pScores.length === 18;
        });

        if (isCompleted) {
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
                <Navigation settings={settings} tournamentId={tournamentId} />
                <div className="container" style={{ padding: '4rem 20px', textAlign: 'center' }}>
                    <h2>Recap data is not yet available.</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Complete at least one full round to see the recap!</p>
                </div>
            </div>
        );
    }

    // ── Overall ───────────────────────────────────────────────────────────────
    const finalLeaders = rankingsByRound[rankingsByRound.length - 1];

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <Navigation settings={settings} tournamentId={tournamentId} />
            <div className="container fade-in" style={{ padding: '2rem 20px', maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <Link href={`/t/${tournamentId}/leaderboard`} style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}>
                        <Trophy size={16} /> Back to Leaderboard
                    </Link>
                </div>
                <h1 className="section-title">Tournament Recap</h1>
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
