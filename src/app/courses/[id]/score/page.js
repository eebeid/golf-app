"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import coursesData from '@/../../data/courses.json';
import { distributeHandicapStrokes, calculateStablefordPoints, getScoreType } from '@/lib/stableford';

export default function CourseScorePage({ params }) {
    const courseId = parseInt(params.id);
    const router = useRouter();

    const [players, setPlayers] = useState([]);
    const [selectedPlayer, setSelectedPlayer] = useState('');
    const [playerData, setPlayerData] = useState(null);
    const [scoreData, setScoreData] = useState({}); // { hole: score }
    const [loading, setLoading] = useState(false);
    const [strokesMap, setStrokesMap] = useState({});

    const course = coursesData.find(c => c.id === courseId);

    useEffect(() => {
        // Fetch players
        fetch('/api/players')
            .then(r => r.json())
            .then(setPlayers)
            .catch(console.error);
    }, []);

    useEffect(() => {
        // Fetch existing scores when player is selected
        if (selectedPlayer && courseId) {
            // Get player data
            const player = players.find(p => p.id === selectedPlayer);
            setPlayerData(player);

            // Calculate handicap strokes distribution
            if (player && course) {
                let courseHandicap = 0;
                if (courseId === 1) courseHandicap = player.hcpRiver || 0;
                if (courseId === 2) courseHandicap = player.hcpPlantation || 0;
                if (courseId === 3) courseHandicap = player.hcpRNK || 0;

                const strokes = distributeHandicapStrokes(courseHandicap, course.holes);
                setStrokesMap(strokes);
            }

            // Fetch existing scores
            fetch(`/api/scores?courseId=${courseId}`)
                .then(res => res.json())
                .then(data => {
                    const pScores = data.filter(s => s.playerId === selectedPlayer);
                    const map = {};
                    pScores.forEach(s => map[s.hole] = s.score);
                    setScoreData(map);
                })
                .catch(console.error);
        } else {
            setScoreData({});
            setStrokesMap({});
            setPlayerData(null);
        }
    }, [selectedPlayer, courseId, players, course]);

    const handleScoreChange = (hole, val) => {
        setScoreData(prev => ({ ...prev, [hole]: val }));
    };

    const submitScores = async () => {
        if (!selectedPlayer) return alert("Select a player!");
        setLoading(true);

        try {
            const promises = Object.entries(scoreData).map(([hole, score]) => {
                if (!score) return null;
                return fetch('/api/scores', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        playerId: selectedPlayer,
                        hole,
                        score,
                        courseId
                    })
                });
            }).filter(Boolean);

            await Promise.all(promises);
            alert("Scores saved!");
            router.refresh();
        } catch (e) {
            console.error(e);
            alert("Error saving scores");
        } finally {
            setLoading(false);
        }
    };

    // Calculate total Stableford points
    const calculateTotalPoints = () => {
        let total = 0;
        course?.holes.forEach(hole => {
            const score = scoreData[hole.number];
            if (score) {
                const strokes = strokesMap[hole.number] || 0;
                const points = calculateStablefordPoints(parseInt(score), hole.par, strokes);
                total += points;
            }
        });
        return total;
    };

    const getScoreColor = (scoreToPar) => {
        if (scoreToPar <= -2) return '#FFD700'; // Gold for eagle or better
        if (scoreToPar === -1) return '#4CAF50'; // Green for birdie
        if (scoreToPar === 0) return '#2196F3'; // Blue for par
        if (scoreToPar === 1) return '#FF9800'; // Orange for bogey
        return '#f44336'; // Red for double bogey or worse
    };

    if (!course) {
        return <div className="fade-in"><h1>Course not found</h1></div>;
    }

    const totalPoints = calculateTotalPoints();

    return (
        <div className="fade-in">
            <h1 className="section-title">{course.name} - Enter Scores</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                Stableford Scoring: Birdie=3pts, Par=2pts, Bogey=1pt
            </p>

            <div className="card">
                <div style={{ marginBottom: '2rem' }}>
                    <label>Select Player:</label>
                    <select
                        value={selectedPlayer}
                        onChange={e => setSelectedPlayer(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            marginTop: '10px',
                            borderRadius: 'var(--radius)',
                            background: 'var(--bg-dark)',
                            color: 'var(--text-main)',
                            border: '1px solid var(--glass-border)'
                        }}
                    >
                        <option value="">-- Choose Player --</option>
                        {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                {selectedPlayer && playerData && (
                    <div style={{
                        marginBottom: '2rem',
                        padding: '1rem',
                        background: 'rgba(212, 175, 55, 0.1)',
                        borderRadius: 'var(--radius)',
                        border: '1px solid rgba(212, 175, 55, 0.3)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <strong>{playerData.name}</strong>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    Course Handicap: {courseId === 1 ? playerData.hcpRiver : courseId === 2 ? playerData.hcpPlantation : playerData.hcpRNK}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total Points</div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                                    {totalPoints}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--accent)' }}>
                                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Hole</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Par</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Strokes</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Score</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Net</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Points</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Result</th>
                            </tr>
                        </thead>
                        <tbody>
                            {course.holes.map(hole => {
                                const score = scoreData[hole.number] ? parseInt(scoreData[hole.number]) : null;
                                const strokes = strokesMap[hole.number] || 0;
                                const netScore = score ? score - strokes : null;
                                const scoreToPar = netScore ? netScore - hole.par : null;
                                const points = score ? calculateStablefordPoints(score, hole.par, strokes) : 0;
                                const scoreTypeText = scoreToPar !== null ? getScoreType(scoreToPar) : '-';

                                return (
                                    <tr key={hole.number} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>
                                            {hole.number}
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                            {hole.par}
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--accent)' }}>
                                            {strokes > 0 ? strokes : '-'}
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                            <input
                                                type="number"
                                                min="1"
                                                style={{
                                                    width: '60px',
                                                    padding: '6px',
                                                    textAlign: 'center',
                                                    borderRadius: '4px',
                                                    border: '1px solid var(--glass-border)',
                                                    background: 'var(--bg-dark)',
                                                    color: 'var(--text-main)'
                                                }}
                                                value={scoreData[hole.number] || ''}
                                                onChange={e => handleScoreChange(hole.number, e.target.value)}
                                            />
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>
                                            {netScore ?? '-'}
                                        </td>
                                        <td style={{
                                            padding: '0.75rem',
                                            textAlign: 'center',
                                            fontWeight: 'bold',
                                            fontSize: '1.1rem',
                                            color: points > 0 ? 'var(--accent)' : 'var(--text-muted)'
                                        }}>
                                            {score ? points : '-'}
                                        </td>
                                        <td style={{
                                            padding: '0.75rem',
                                            textAlign: 'center',
                                            color: scoreToPar !== null ? getScoreColor(scoreToPar) : 'var(--text-muted)',
                                            fontWeight: '500'
                                        }}>
                                            {scoreTypeText}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <button
                    onClick={submitScores}
                    className="btn"
                    style={{ width: '100%', marginTop: '2rem' }}
                    disabled={loading || !selectedPlayer}
                >
                    {loading ? 'Saving...' : 'Save Round'}
                </button>
            </div>
        </div>
    );
}
