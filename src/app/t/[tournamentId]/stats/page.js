import prisma from '@/lib/prisma';
import Navigation from '@/components/Navigation';
import StatsDashboard from '@/components/stats/StatsDashboard';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const CATEGORIES = ['eagles', 'birdies', 'pars', 'bogies', 'doubles', 'triples', 'blowups'];

function emptyStats(name, id) {
    return { id, name, eagles: 0, birdies: 0, pars: 0, bogies: 0, doubles: 0, triples: 0, blowups: 0, totalHoles: 0, totalStrokes: 0 };
}

function classify(diff) {
    if (diff <= -2) return 'eagles';
    if (diff === -1) return 'birdies';
    if (diff === 0) return 'pars';
    if (diff === 1) return 'bogies';
    if (diff === 2) return 'doubles';
    if (diff === 3) return 'triples';
    return 'blowups';
}

function computeLeaders(playerStats) {
    const playersWithScores = Object.values(playerStats).filter(p => p.totalHoles > 0);
    const leaders = {};
    CATEGORIES.forEach(cat => {
        leaders[cat] = { name: '-', count: 0 };
        let maxVal = -1;
        let leadersList = [];
        playersWithScores.forEach(p => {
            if (p[cat] > maxVal) { maxVal = p[cat]; leadersList = [p.name]; }
            else if (p[cat] === maxVal && maxVal > 0) leadersList.push(p.name);
        });
        if (maxVal > 0) {
            leaders[cat].count = maxVal;
            leaders[cat].name = leadersList.length > 2 ? `${leadersList.length} Players Tied` : leadersList.join(' & ');
        }
    });
    return leaders;
}

function buildCounts(playerStats) {
    const counts = { eagles: 0, birdies: 0, pars: 0, bogies: 0, doubles: 0, triples: 0, blowups: 0 };
    Object.values(playerStats).forEach(p => {
        CATEGORIES.forEach(cat => { counts[cat] += p[cat]; });
    });
    return counts;
}

export default async function TournamentStatsPage({ params }) {
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

    if (tournament.settings?.showStats === false) {
        redirect(`/t/${tournamentId}`);
    }

    const numberOfRounds = tournament.settings?.numberOfRounds || 1;

    // ── Build stats for overall + each round ──────────────────────────────────
    const overallPlayerStats = {};
    const roundPlayerStats = {}; // { 1: { playerId: stats }, 2: { playerId: stats } ... }

    for (let r = 1; r <= numberOfRounds; r++) roundPlayerStats[r] = {};

    tournament.players.forEach(player => {
        overallPlayerStats[player.id] = emptyStats(player.name, player.id);
        for (let r = 1; r <= numberOfRounds; r++) {
            roundPlayerStats[r][player.id] = emptyStats(player.name, player.id);
        }

        player.scores.forEach(scoreRecord => {
            const holes = Array.isArray(scoreRecord.course?.holes) ? scoreRecord.course.holes : [];
            const holeData = holes.find(h => h.number === scoreRecord.hole);
            const par = holeData?.par || 4;
            const diff = scoreRecord.score - par;
            const cat = classify(diff);
            const round = scoreRecord.round || 1;

            // Overall
            overallPlayerStats[player.id][cat]++;
            overallPlayerStats[player.id].totalHoles++;
            overallPlayerStats[player.id].totalStrokes += scoreRecord.score;

            // Per-round
            if (roundPlayerStats[round]?.[player.id]) {
                roundPlayerStats[round][player.id][cat]++;
                roundPlayerStats[round][player.id].totalHoles++;
                roundPlayerStats[round][player.id].totalStrokes += scoreRecord.score;
            }
        });
    });

    // ── Overall ───────────────────────────────────────────────────────────────
    const overallCounts = buildCounts(overallPlayerStats);
    const overallLeaders = computeLeaders(overallPlayerStats);

    // ── Per-round breakdown ───────────────────────────────────────────────────
    const roundStats = {};
    for (let r = 1; r <= numberOfRounds; r++) {
        roundStats[r] = {
            counts: buildCounts(roundPlayerStats[r]),
            leaders: computeLeaders(roundPlayerStats[r]),
        };
    }

    // ── Round-by-round scoring trend (avg strokes per player per round) ───────
    const scoringTrend = [];
    for (let r = 1; r <= numberOfRounds; r++) {
        const players = Object.values(roundPlayerStats[r]).filter(p => p.totalHoles > 0);
        const avgScore = players.length > 0
            ? Math.round((players.reduce((s, p) => s + p.totalStrokes, 0) / players.length) * 10) / 10
            : null;
        scoringTrend.push({ round: `R${r}`, avgScore });
    }

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <Navigation settings={tournament.settings} tournamentId={tournamentId} />
            <div className="container fade-in" style={{ padding: '2rem 20px', maxWidth: '1000px', margin: '0 auto' }}>
                <h1 className="section-title">Tournament Statistics</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', textAlign: 'center' }}>
                    Deep dive into the numbers across all rounds of {tournament.name}.
                </p>

                <StatsDashboard
                    overallCounts={overallCounts}
                    overallLeaders={overallLeaders}
                    roundStats={roundStats}
                    numberOfRounds={numberOfRounds}
                    scoringTrend={scoringTrend}
                />
            </div>
        </div>
    );
}
