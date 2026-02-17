"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { X } from 'lucide-react';

// We might not need this anymore if we are doing simplified calculation for now
// import { calculateAllCourseHandicaps } from '@/lib/courseHandicap';

export default function LeaderboardPage() {
    const params = useParams();
    const tournamentId = params?.tournamentId;

    const [players, setPlayers] = useState([]);
    const [scores, setScores] = useState([]);
    const [displayCourses, setDisplayCourses] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('points'); // 'points' or 'strokes' or 'net'

    const [selectedDetailPlayer, setSelectedDetailPlayer] = useState(null);

    const fetchData = async () => {
        if (!tournamentId) return;

        try {
            const [pRes, sRes, cRes, setRes] = await Promise.all([
                fetch(`/api/players?tournamentId=${tournamentId}`),
                fetch(`/api/scores?tournamentId=${tournamentId}`),
                fetch(`/api/courses?tournamentId=${tournamentId}`),
                fetch(`/api/settings?tournamentId=${tournamentId}`)
            ]);

            const pData = await pRes.json();
            const sData = await sRes.json();
            const cData = await cRes.json();
            const settingsData = await setRes.json();

            setPlayers(pData);
            setScores(sData);

            // Filter and sort courses based on Settings
            let activeCourses = [];
            if (settingsData && settingsData.roundCourses && Array.isArray(settingsData.roundCourses)) {
                // Map round index to course object
                activeCourses = settingsData.roundCourses.map((courseId, index) => {
                    const course = cData.find(c => c.id === courseId);
                    return course ? { ...course, roundNum: index + 1 } : null;
                }).filter(Boolean);
            } else {
                // Fallback to all courses if settings not found
                activeCourses = Array.isArray(cData) ? cData.sort((a, b) => a.name.localeCompare(b.name)) : [];
            }

            setDisplayCourses(activeCourses);

            const lb = pData.map(p => {
                const pScores = sData.filter(s => s.playerId == p.id);

                // We map course ID to a calculated course handicap value based on USGA formula.
                const courseHandicaps = {};
                if (Array.isArray(cData)) {
                    cData.forEach(c => {
                        let tee = null;
                        if (c.tees && c.tees.length > 0) {
                            const midIndex = Math.floor((c.tees.length - 1) / 2);
                            tee = c.tees[midIndex] || c.tees[0];
                        }
                        if (tee && p.handicapIndex !== undefined) {
                            const rawHcp = (p.handicapIndex * tee.slope / 113) + (tee.rating - c.par);
                            courseHandicaps[c.id] = Math.round(rawHcp);
                        } else {
                            courseHandicaps[c.id] = Math.round(p.handicapIndex || 0);
                        }
                    });
                }

                // Calculate points per active round
                const rounds = {};
                let grandTotalPoints = 0;
                let grandTotalGross = 0;
                let grandTotalNet = 0;
                let validRounds = 0;

                activeCourses.forEach(c => {
                    // Filter scores for this course.
                    // Note: If distinct rounds use the same course, we currently aggregate all scores for that course.
                    // Ideally we'd filter by round if scores had round info.
                    const cScores = pScores.filter(s => s.courseId === c.id);
                    const holesPlayed = cScores.length;

                    if (holesPlayed === 0) {
                        rounds[`${c.id}_${c.roundNum}`] = {
                            points: null,
                            gross: null,
                            net: null,
                            display: '--'
                        };
                    } else {
                        const totalPoints = cScores.reduce((a, b) => a + (b.stablefordPoints || 0), 0);
                        const grossScore = cScores.reduce((a, b) => a + b.score, 0);

                        const ch = courseHandicaps[c.id] || 0;
                        const netScore = grossScore - ch;

                        grandTotalPoints += totalPoints;
                        grandTotalGross += grossScore;
                        grandTotalNet += netScore;
                        validRounds++;

                        rounds[`${c.id}_${c.roundNum}`] = {
                            points: totalPoints,
                            gross: grossScore,
                            net: netScore,
                            display: `${totalPoints} pts`,
                            holes: holesPlayed,
                            id: c.id
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
                    if (a.totalPoints === null && b.totalPoints === null) return 0;
                    if (a.totalPoints === null) return 1;
                    if (b.totalPoints === null) return -1;
                    return b.totalPoints - a.totalPoints;
                } else if (viewMode === 'strokes') {
                    if (a.totalGross === null && b.totalGross === null) return 0;
                    if (a.totalGross === null) return 1;
                    if (b.totalGross === null) return -1;
                    return a.totalGross - b.totalGross;
                } else {
                    if (a.totalNet === null && b.totalNet === null) return 0;
                    if (a.totalNet === null) return 1;
                    if (b.totalNet === null) return -1;
                    return a.totalNet - b.totalNet;
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
    }, [viewMode, tournamentId]);

    if (loading && players.length === 0) {
        return (
            <div className="fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Loading Leaderboard...</div>
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
                            {displayCourses.map(c => {
                                const r = selectedDetailPlayer.rounds[`${c.id}_${c.roundNum}`];
                                if (!r || r.points == null) return null;
                                return <div key={`${c.id}_${c.roundNum}`}>{c.name} (R{c.roundNum}): {r.points} points (Gross: {r.gross})</div>
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
                                <th style={{ textAlign: 'left', padding: '10px' }}>Pos</th>
                                <th style={{ textAlign: 'left', padding: '10px' }}>Player</th>
                                {displayCourses.map((c, i) => (
                                    <th key={`${c.id}-${i}`} style={{ textAlign: 'center', padding: '10px' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#ccc' }}>Round {c.roundNum || i + 1}</div>
                                        {c.name}<br />
                                        <span style={{ fontSize: '0.8em', opacity: 0.8 }}>
                                            {viewMode === 'points' ? 'Points' : (viewMode === 'strokes' ? 'Gross' : 'Net')}
                                        </span>
                                    </th>
                                ))}

                                {viewMode === 'strokes' && (
                                    <th style={{ textAlign: 'center', background: 'var(--accent)', color: '#000', padding: '10px' }}>Total Gross</th>
                                )}
                                {viewMode === 'net' && (
                                    <th style={{ textAlign: 'center', background: 'var(--accent)', color: '#000', padding: '10px' }}>Total Net</th>
                                )}
                                {viewMode === 'points' && (
                                    <th style={{ textAlign: 'center', background: 'var(--accent)', color: '#000', padding: '10px' }}>Total Points</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((p, idx) => (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer' }} onClick={() => setSelectedDetailPlayer(p)}>
                                    <td style={{ fontWeight: 'bold', padding: '10px' }}>{p.totalPoints !== null ? idx + 1 : '-'}</td>
                                    <td style={{ fontWeight: 'bold', padding: '10px' }}>
                                        {p.totalPoints !== null && idx === 0 ? '👑 ' : ''}{p.name}
                                    </td>

                                    {displayCourses.map((c, i) => {
                                        const r = p.rounds[`${c.id}_${c.roundNum}`];
                                        return (
                                            <td key={c.id} style={{ textAlign: 'center', fontSize: '0.95rem', padding: '10px' }}>
                                                {viewMode === 'points' ? r?.points : (viewMode === 'strokes' ? r?.gross : r?.net) ?? '--'}
                                            </td>
                                        );
                                    })}

                                    {viewMode === 'strokes' && (
                                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--accent)', fontSize: '1.1rem', padding: '10px' }}>
                                            {p.totalGross ?? '--'}
                                        </td>
                                    )}
                                    {viewMode === 'net' && (
                                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--accent)', fontSize: '1.1rem', padding: '10px' }}>
                                            {p.totalNet ?? '--'}
                                        </td>
                                    )}
                                    {viewMode === 'points' && (
                                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--accent)', fontSize: '1.1rem', padding: '10px' }}>
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
