"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

// "use client" is at top
// imports...

export default function LeaderboardPage() {
    const [players, setPlayers] = useState([]);
    const [scores, setScores] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Hardcoded course details for calculation
    const courses = [
        { id: 1, name: "River", par: 71 },
        { id: 2, name: "Plantation", par: 72 },
        { id: 3, name: "RNK", par: 72 }
    ];

    const [selectedDetailPlayer, setSelectedDetailPlayer] = useState(null);

    const fetchData = async () => {
        try {
            // Fetch everything (removing courseId filter from API call)
            const [pRes, sRes] = await Promise.all([
                fetch('/api/players'),
                fetch('/api/scores')
            ]);
            const pData = await pRes.json();
            const sData = await sRes.json();

            setPlayers(pData);
            setScores(sData);

            const lb = pData.map(p => {
                const pScores = sData.filter(s => s.playerId == p.id);

                // Calculate Stableford points per course
                const rounds = {};
                let grandTotalPoints = 0;
                let grandTotalGross = 0;
                let validRounds = 0;

                courses.forEach(c => {
                    const cScores = pScores.filter(s => s.courseId === c.id);
                    const holesPlayed = cScores.length;

                    if (holesPlayed === 0) {
                        rounds[c.id] = {
                            points: null,
                            gross: null,
                            display: '--'
                        };
                    } else {
                        // Sum up Stableford points for this course
                        const totalPoints = cScores.reduce((a, b) => a + (b.stablefordPoints || 0), 0);
                        const grossScore = cScores.reduce((a, b) => a + b.score, 0);

                        grandTotalPoints += totalPoints;
                        grandTotalGross += grossScore;
                        validRounds++;

                        rounds[c.id] = {
                            points: totalPoints,
                            gross: grossScore,
                            display: `${totalPoints} pts (${grossScore})`,
                            holes: holesPlayed
                        };
                    }
                });

                const hasPlayed = validRounds > 0;

                return {
                    ...p,
                    rounds,
                    totalPoints: hasPlayed ? grandTotalPoints : null,
                    totalGross: hasPlayed ? grandTotalGross : null,
                    scores: pScores
                };
            }).sort((a, b) => {
                // Sort by Total Points (highest is best)
                if (a.totalPoints === null && b.totalPoints === null) return 0;
                if (a.totalPoints === null) return 1;
                if (b.totalPoints === null) return -1;
                return b.totalPoints - a.totalPoints; // Descending order
            });

            setLeaderboard(lb);
            setError(null);
        } catch (e) {
            console.error(e);
            setError("Failed to load leaderboard data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading && players.length === 0) {
        return (
            <div className="fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Loading Leaderboard...</div>
                <div className="spinner"></div> {/* Assuming spinner class exists or just text */}
            </div>
        );
    }

    if (error) {
        return (
            <div className="fade-in" style={{ padding: '2rem', textAlign: 'center', color: '#ff6b6b' }}>
                <h3>Error</h3>
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="btn">Retry</button>
            </div>
        );
    }

    return (
        <div className="fade-in">
            {/* Modal Logic ... */}
            {selectedDetailPlayer && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }} onClick={() => setSelectedDetailPlayer(null)}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
                        <button onClick={() => setSelectedDetailPlayer(null)} style={{ float: 'right', background: 'none', border: 'none', color: 'white' }}><X /></button>
                        <h2>{selectedDetailPlayer.name}</h2>
                        <p>Details per hole not shown in this view, but raw data is available.</p>
                        <p style={{ marginTop: '1rem' }}>
                            <strong>Stableford Scoring:</strong><br />
                            {courses.map(c => {
                                const r = selectedDetailPlayer.rounds[c.id];
                                if (!r || r.points == null) return null;
                                return <div key={c.id}>{c.name}: {r.points} points (Gross: {r.gross})</div>
                            })}
                        </p>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="section-title" style={{ margin: 0 }}>Tournament Leaderboard</h1>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--primary)', color: '#fff' }}>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Pos</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Player</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>River<br /><span style={{ fontSize: '0.8em', opacity: 0.8 }}>Points (Gross)</span></th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Plantation<br /><span style={{ fontSize: '0.8em', opacity: 0.8 }}>Points (Gross)</span></th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>RNK<br /><span style={{ fontSize: '0.8em', opacity: 0.8 }}>Points (Gross)</span></th>
                                <th style={{ padding: '1rem', textAlign: 'center', background: 'rgba(0,0,0,0.2)' }}>Total Gross</th>
                                <th style={{ padding: '1rem', textAlign: 'center', background: 'var(--accent)', color: '#000' }}>Total Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((p, idx) => (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer' }} onClick={() => setSelectedDetailPlayer(p)}>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.totalPoints !== null ? idx + 1 : '-'}</td>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                                        {p.totalPoints !== null && idx === 0 ? '👑 ' : ''}{p.name}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.95rem' }}>{p.rounds[1]?.display}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.95rem' }}>{p.rounds[2]?.display}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.95rem' }}>{p.rounds[3]?.display}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', background: 'rgba(0,0,0,0.1)' }}>
                                        {p.totalGross ?? '--'}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent)', fontSize: '1.1rem' }}>
                                        {p.totalPoints ?? '--'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {players.length === 0 && !loading && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No players registered yet.
                    </div>
                )}
            </div>
        </div>
    );
}
