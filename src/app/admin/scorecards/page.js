import prisma from '@/lib/prisma';
import { getData } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function AdminScorecardsPage() {
    const scores = await prisma.score.findMany({
        include: {
            player: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const courses = await getData('courses');
    const courseMap = courses.reduce((acc, course) => {
        acc[course.id] = course;
        return acc;
    }, {});

    // Group scores by Player + Course
    const scorecards = {};

    scores.forEach(score => {
        const key = `${score.playerId}-${score.courseId}`;
        if (!scorecards[key]) {
            scorecards[key] = {
                key,
                playerId: score.playerId,
                playerName: score.player?.name || 'Unknown Player',
                courseId: score.courseId,
                courseName: courseMap[score.courseId]?.name || `Course ${score.courseId}`,
                scores: {},
                totalScore: 0,
                holesPlayed: 0,
                createdAt: score.createdAt
            };
        }

        if (!scorecards[key].scores[score.hole]) {
            scorecards[key].scores[score.hole] = score.score;
            scorecards[key].totalScore += score.score;
            scorecards[key].holesPlayed += 1;
        }
    });

    const cardsArray = Object.values(scorecards);

    return (
        <div className="container fade-in" style={{ padding: '4rem 0' }}>
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 className="section-title">Scorecard Administration</h1>
                <p style={{ color: 'var(--text-muted)' }}>Overview of all player scorecards across all courses.</p>
            </header>

            <div className="glass-panel" style={{ padding: '2rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem', color: 'var(--accent)' }}>Player</th>
                            <th style={{ padding: '1rem', color: 'var(--accent)' }}>Course</th>
                            <th style={{ padding: '1rem', color: 'var(--accent)' }}>Holes Played</th>
                            <th style={{ padding: '1rem', color: 'var(--accent)' }}>Total Score</th>
                            <th style={{ padding: '1rem', color: 'var(--accent)' }}>Date Started</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cardsArray.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No scorecards found.
                                </td>
                            </tr>
                        ) : (
                            cardsArray.map(card => (
                                <tr key={card.key} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '1rem' }}>{card.playerName}</td>
                                    <td style={{ padding: '1rem' }}>{card.courseName}</td>
                                    <td style={{ padding: '1rem' }}>{card.holesPlayed} / 18</td>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{card.totalScore}</td>
                                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                                        {new Date(card.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
