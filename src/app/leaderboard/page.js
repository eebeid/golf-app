"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function LeaderboardPage() {
    const [players, setPlayers] = useState([]);
    const [scores, setScores] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [courses, setCourses] = useState([
        { id: 1, name: "Kingsmill River" },
        { id: 2, name: "Kingsmill Plantation" },
        { id: 3, name: "Royal New Kent" }
    ]);
    const [selectedCourseId, setSelectedCourseId] = useState(1);

    // Admin Mode state (Removed since we have separate pages now, or keep as global override?)
    // Let's keep it but make it course aware if we wanted. But user asked for separate pages.
    // I will hide the inline admin entry to encourage using the new pages, or update it.
    // For now I'll focus on display.

    // Detail Modal State
    const [selectedDetailPlayer, setSelectedDetailPlayer] = useState(null);

    const fetchData = async () => {
        try {
            const [pRes, sRes] = await Promise.all([
                fetch('/api/players'),
                fetch(`/api/scores?courseId=${selectedCourseId}`)
            ]);
            const pData = await pRes.json();
            const sData = await sRes.json();

            setPlayers(pData);
            setScores(sData);

            const lb = pData.map(p => {
                const pScores = sData.filter(s => s.playerId == p.id);
                const total = pScores.reduce((acc, curr) => acc + curr.score, 0);
                const holesPlayed = pScores.length;
                const par = holesPlayed * 4; // Approx
                const toPar = total - par;

                return {
                    ...p,
                    scores: pScores.sort((a, b) => a.hole - b.hole),
                    total,
                    holesPlayed,
                    toPar
                };
            }).sort((a, b) => {
                // Sort players with scores to top
                if (a.holesPlayed > 0 && b.holesPlayed === 0) return -1;
                if (a.holesPlayed === 0 && b.holesPlayed > 0) return 1;
                return a.total - b.total;
            });

            setLeaderboard(lb);
        } catch (e) {
            console.error("Error fetching leaderboard data", e);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [selectedCourseId]); // Re-fetch when course changes

    return (
        <div className="fade-in">
            {/* Player Detail Modal */}
            {selectedDetailPlayer && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }} onClick={() => setSelectedDetailPlayer(null)}>
                    <div
                        className="glass-panel"
                        style={{ width: '100%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedDetailPlayer(null)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>
                        <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem', paddingRight: '2rem' }}>{selectedDetailPlayer.name}</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                            <div style={{ background: 'var(--bg-dark)', padding: '10px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total</div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{selectedDetailPlayer.total}</div>
                            </div>
                            <div style={{ background: 'var(--bg-dark)', padding: '10px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>To Par</div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: selectedDetailPlayer.toPar < 0 ? 'var(--accent)' : 'inherit' }}>
                                    {selectedDetailPlayer.toPar > 0 ? '+' : ''}{selectedDetailPlayer.toPar === 0 ? 'E' : selectedDetailPlayer.toPar}
                                </div>
                            </div>
                            <div style={{ background: 'var(--bg-dark)', padding: '10px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Holes</div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{selectedDetailPlayer.holesPlayed}</div>
                            </div>
                        </div>

                        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Scorecard</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                            <div style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>Hole</div>
                            <div style={{ fontWeight: 'bold', color: 'var(--text-muted)', textAlign: 'right' }}>Score</div>
                            {selectedDetailPlayer.scores.length === 0 ? (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>No holes played yet.</div>
                            ) : (
                                selectedDetailPlayer.scores.map(s => (
                                    <>
                                        <div key={`h-${s.hole}`} style={{ padding: '8px', borderBottom: '1px solid var(--glass-border)' }}>{s.hole}</div>
                                        <div key={`s-${s.hole}`} style={{ padding: '8px', borderBottom: '1px solid var(--glass-border)', textAlign: 'right', fontWeight: 'bold' }}>{s.score}</div>
                                    </>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="section-title" style={{ margin: 0 }}>Live Leaderboard</h1>

                <select
                    value={selectedCourseId}
                    onChange={e => setSelectedCourseId(e.target.value)}
                    style={{ padding: '10px', borderRadius: 'var(--radius)', border: '1px solid var(--accent)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                >
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--primary)', color: '#fff' }}>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Pos</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Player</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Holes</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>To Par</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((p, idx) => (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{idx + 1}</td>
                                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {idx === 0 && p.holesPlayed > 0 && <span style={{ color: 'var(--accent)' }}>👑</span>}
                                        <button
                                            onClick={() => setSelectedDetailPlayer(p)}
                                            style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline', textUnderlineOffset: '4px', fontSize: 'inherit' }}
                                        >
                                            {p.name}
                                        </button>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>{p.holesPlayed}</td>
                                    <td style={{
                                        padding: '1rem',
                                        textAlign: 'center',
                                        color: p.toPar < 0 ? 'var(--accent)' : (p.toPar > 0 ? '#ff6b6b' : 'var(--text-main)')
                                    }}>
                                        {p.toPar === 0 ? 'E' : (p.toPar > 0 ? `+${p.toPar}` : p.toPar)}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>{p.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
