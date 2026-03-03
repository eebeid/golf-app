import prisma from '@/lib/prisma';
import Navigation from '@/components/Navigation';
import StatsDashboard from '@/components/stats/StatsDashboard';

export const dynamic = 'force-dynamic';

export default async function TournamentStatsPage({ params }) {
    const { tournamentId } = params;

    // Fetch tournament and all players with their scores and courses
    const tournament = await prisma.tournament.findUnique({
        where: { slug: tournamentId },
        include: {
            players: {
                include: {
                    scores: {
                        include: {
                            course: true
                        }
                    }
                }
            }
        }
    });

    if (!tournament) {
        return (
            <div>
                <div className="container" style={{ padding: '4rem 20px', textAlign: 'center' }}>
                    <h2>Tournament Not Found</h2>
                </div>
            </div>
        );
    }

    // Process stats
    // We want to count: Eagles (-2 or better), Birdies (-1), Pars (0), Bogies (+1), Double Bogies (+2), Triple Bogies (+3), +4 or worse

    // Player Stats Map
    const playerStatsMap = {};
    const overallCounts = {
        eagles: 0,
        birdies: 0,
        pars: 0,
        bogies: 0,
        doubles: 0,
        triples: 0,
        blowups: 0
    };

    tournament.players.forEach(player => {
        let pStats = {
            id: player.id,
            name: player.name,
            eagles: 0,
            birdies: 0,
            pars: 0,
            bogies: 0,
            doubles: 0,
            triples: 0,
            blowups: 0,
            totalHoles: 0
        };

        player.scores.forEach(scoreRecord => {
            const course = scoreRecord.course;
            // Parse holes json to find par
            const holes = Array.isArray(course.holes) ? course.holes : [];
            const holeData = holes.find(h => h.number === scoreRecord.hole);
            const par = holeData?.par || 4; // Default to 4 if not configured

            const diff = scoreRecord.score - par;

            pStats.totalHoles += 1;

            if (diff <= -2) {
                pStats.eagles += 1;
                overallCounts.eagles += 1;
            } else if (diff === -1) {
                pStats.birdies += 1;
                overallCounts.birdies += 1;
            } else if (diff === 0) {
                pStats.pars += 1;
                overallCounts.pars += 1;
            } else if (diff === 1) {
                pStats.bogies += 1;
                overallCounts.bogies += 1;
            } else if (diff === 2) {
                pStats.doubles += 1;
                overallCounts.doubles += 1;
            } else if (diff === 3) {
                pStats.triples += 1;
                overallCounts.triples += 1;
            } else if (diff >= 4) {
                pStats.blowups += 1;
                overallCounts.blowups += 1;
            }
        });

        playerStatsMap[player.id] = pStats;
    });

    // Find leaders in each category
    const leaders = {
        eagles: { name: '-', count: 0 },
        birdies: { name: '-', count: 0 },
        pars: { name: '-', count: 0 },
        bogies: { name: '-', count: 0 },
        doubles: { name: '-', count: 0 },
        triples: { name: '-', count: 0 },
        blowups: { name: '-', count: 0 },
    };

    const playersWithScores = Object.values(playerStatsMap).filter(p => p.totalHoles > 0);

    const categories = ['eagles', 'birdies', 'pars', 'bogies', 'doubles', 'triples', 'blowups'];

    categories.forEach(cat => {
        if (playersWithScores.length === 0) return;

        let maxVal = -1;
        let leadersList = [];

        playersWithScores.forEach(p => {
            if (p[cat] > maxVal) {
                maxVal = p[cat];
                leadersList = [p.name];
            } else if (p[cat] === maxVal && maxVal > 0) {
                leadersList.push(p.name);
            }
        });

        if (maxVal > 0) {
            leaders[cat].count = maxVal;
            // Join names if tied
            if (leadersList.length > 2) {
                leaders[cat].name = `${leadersList.length} Players Tied`;
            } else {
                leaders[cat].name = leadersList.join(' & ');
            }
        }
    });

    // We pass the processed data to the client component to render the beautiful pie chart
    return (
        <div style={{ paddingBottom: '4rem' }}>
            <div className="container fade-in" style={{ padding: '2rem 20px', maxWidth: '1000px', margin: '0 auto' }}>
                <h1 className="section-title">Tournament Statistics</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', textAlign: 'center' }}>
                    Deep dive into the numbers across all rounds of {tournament.name}.
                </p>

                <StatsDashboard
                    overallCounts={overallCounts}
                    leaders={leaders}
                />
            </div>
        </div>
    );
}
