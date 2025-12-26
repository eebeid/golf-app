"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

import { calculateAllCourseHandicaps } from '@/lib/courseHandicap';

// "use client" is at top
// imports...

export default function LeaderboardPage() {
    const [players, setPlayers] = useState([]);
    const [scores, setScores] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('points'); // 'points' or 'strokes'

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
            const [pRes, sRes, cRes] = await Promise.all([
                fetch('/api/players'),
                fetch('/api/scores'),
                fetch('/api/courses')
            ]);
            const pData = await pRes.json();
            const sData = await sRes.json();
            const cData = await cRes.json();

            setPlayers(pData);
            setScores(sData);

            const lb = pData.map(p => {
                const pScores = sData.filter(s => s.playerId == p.id);

                // Calculate Net Handicaps
                const teeSelections = {
                    river: p.teeRiver,
                    plantation: p.teePlantation,
                    rnk: p.teeRNK
                };
                const handicaps = calculateAllCourseHandicaps(p.handicapIndex, cData, teeSelections);
                const courseHandicaps = {
                    1: handicaps.hcpPlantation,
                    2: handicaps.hcpRiver,
                    3: handicaps.hcpRNK
                };

                // Calculate Stableford points per course
                const rounds = {};
                let grandTotalPoints = 0;
                let grandTotalGross = 0;
                let grandTotalNet = 0;
                let validRounds = 0;

                courses.forEach(c => {
                    const cScores = pScores.filter(s => s.courseId === c.id);
                    const holesPlayed = cScores.length;

                    if (holesPlayed === 0) {
                        rounds[c.id] = {
                            points: null,
                            gross: null,
                            net: null,
                            display: '--'
                        };
                    } else {
                        // Sum up Stableford points for this course
                        const totalPoints = cScores.reduce((a, b) => a + (b.stablefordPoints || 0), 0);
                        const grossScore = cScores.reduce((a, b) => a + b.score, 0);

                        // Net Calculation: Gross - Course Handicap
                        const ch = courseHandicaps[c.id] || 0;
                        const netScore = grossScore - ch;

                        grandTotalPoints += totalPoints;
                        grandTotalGross += grossScore;
                        grandTotalNet += netScore;
                        validRounds++;

                        rounds[c.id] = {
                            points: totalPoints,
                            gross: grossScore,
                            net: netScore,
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
                    totalNet: hasPlayed ? grandTotalNet : null,
                    scores: pScores
                };
            }).sort((a, b) => {
                if (viewMode === 'points') {
                    // Sort by Total Points (highest is best)
                    if (a.totalPoints === null && b.totalPoints === null) return 0;
                    if (a.totalPoints === null) return 1;
                    if (b.totalPoints === null) return -1;
                    return b.totalPoints - a.totalPoints; // Descending order
                } else if (viewMode === 'strokes') {
                    // Sort by Total Gross (lowest is best)
                    if (a.totalGross === null && b.totalGross === null) return 0;
                    if (a.totalGross === null) return 1;
                    if (b.totalGross === null) return -1;
                    return a.totalGross - b.totalGross; // Ascending order
                } else {
                    // Sort by Total Net (lowest is best)
                    if (a.totalNet === null && b.totalNet === null) return 0;
                    if (a.totalNet === null) return 1;
                    if (b.totalNet === null) return -1;
                    return a.totalNet - b.totalNet; // Ascending order
                }
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
    }, [viewMode]);

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

            <div style={{ marginBottom: '2rem' }}>
                <h1 className="section-title" style={{ margin: '0 0 1rem 0' }}>Tournament Leaderboard</h1>

                <div style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', overflow: 'hidden', width: 'fit-content' }}>
                    <button
                        onClick={() => setViewMode('points')}
                        style={{
                            padding: '8px 16px',
                            background: viewMode === 'points' ? 'var(--accent)' : 'transparent',
                            color: viewMode === 'points' ? '#000' : 'var(--text-muted)',
                            border: 'none',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Stableford
                    </button>
                    <button
                        onClick={() => setViewMode('strokes')}
                        style={{
                            padding: '8px 16px',
                            background: viewMode === 'strokes' ? 'var(--accent)' : 'transparent',
                            color: viewMode === 'strokes' ? '#000' : 'var(--text-muted)',
                            border: 'none',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            borderLeft: '1px solid var(--glass-border)',
                            borderRight: '1px solid var(--glass-border)'
                        }}
                    >
                        Gross
                    </button>
                    <button
                        onClick={() => setViewMode('net')}
                        style={{
                            padding: '8px 16px',
                            background: viewMode === 'net' ? 'var(--accent)' : 'transparent',
                            color: viewMode === 'net' ? '#000' : 'var(--text-muted)',
                            border: 'none',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Net
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="leaderboard-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--primary)', color: '#fff' }}>
                                <th style={{ textAlign: 'left' }}>Pos</th>
                                <th style={{ textAlign: 'left' }}>Player</th>
                                <th style={{ textAlign: 'center' }}>River<br /><span style={{ fontSize: '0.8em', opacity: 0.8 }}>{viewMode === 'points' ? 'Points' : (viewMode === 'strokes' ? 'Gross' : 'Net')}</span></th>
                                <th style={{ textAlign: 'center' }}>Plantation<br /><span style={{ fontSize: '0.8em', opacity: 0.8 }}>{viewMode === 'points' ? 'Points' : (viewMode === 'strokes' ? 'Gross' : 'Net')}</span></th>
                                <th style={{ textAlign: 'center' }}>RNK<br /><span style={{ fontSize: '0.8em', opacity: 0.8 }}>{viewMode === 'points' ? 'Points' : (viewMode === 'strokes' ? 'Gross' : 'Net')}</span></th>

                                {viewMode === 'strokes' && (
                                    <th style={{ textAlign: 'center', background: 'var(--accent)', color: '#000' }}>Total Gross</th>
                                )}
                                {viewMode === 'net' && (
                                    <th style={{ textAlign: 'center', background: 'var(--accent)', color: '#000' }}>Total Net</th>
                                )}
                                {viewMode === 'points' && (
                                    <th style={{ textAlign: 'center', background: 'var(--accent)', color: '#000' }}>Total Points</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((p, idx) => (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer' }} onClick={() => setSelectedDetailPlayer(p)}>
                                    <td style={{ fontWeight: 'bold' }}>{p.totalPoints !== null ? idx + 1 : '-'}</td>
                                    <td style={{ fontWeight: 'bold' }}>
                                        {p.totalPoints !== null && idx === 0 ? '👑 ' : ''}{p.name}
                                    </td>
                                    <td style={{ textAlign: 'center', fontSize: '0.95rem' }}>{viewMode === 'points' ? p.rounds[1]?.points : (viewMode === 'strokes' ? p.rounds[1]?.gross : p.rounds[1]?.net) ?? '--'}</td>
                                    <td style={{ textAlign: 'center', fontSize: '0.95rem' }}>{viewMode === 'points' ? p.rounds[2]?.points : (viewMode === 'strokes' ? p.rounds[2]?.gross : p.rounds[2]?.net) ?? '--'}</td>
                                    <td style={{ textAlign: 'center', fontSize: '0.95rem' }}>{viewMode === 'points' ? p.rounds[3]?.points : (viewMode === 'strokes' ? p.rounds[3]?.gross : p.rounds[3]?.net) ?? '--'}</td>

                                    {viewMode === 'strokes' && (
                                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--accent)', fontSize: '1.1rem' }}>
                                            {p.totalGross ?? '--'}
                                        </td>
                                    )}
                                    {viewMode === 'net' && (
                                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--accent)', fontSize: '1.1rem' }}>
                                            {p.totalNet ?? '--'}
                                        </td>
                                    )}
                                    {viewMode === 'points' && (
                                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--accent)', fontSize: '1.1rem' }}>
                                            {p.totalPoints ?? '--'}
                                        </td>
                                    )}
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
