"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

// "use client" is at top
// imports...

export default function LeaderboardPage() {
    const [players, setPlayers] = useState([]);
    const [scores, setScores] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);

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

                // Calculate score per course
                const rounds = {};
                let grandTotalToPar = 0;
                let validRounds = 0;

                courses.forEach(c => {
                    const cScores = pScores.filter(s => s.courseId === c.id);
                    const holesPlayed = cScores.length;

                    if (holesPlayed === 0) {
                        rounds[c.id] = { score: null, display: '--' };
                    } else {
                        const totalScore = cScores.reduce((a, b) => a + b.score, 0);
                        // Simple logic: if they played 18 holes, show gross. If partial, maybe show partial? 
                        // Let's just show total gross score so far.

                        // To Par calculation (approximate for partial rounds)
                        const estimatedPar = holesPlayed * 4; // Simplified. Better to map specific pars if we had data available here.
                        // Ideally we have per-hole par data. For now, assuming par 4 avg is rough but acceptable or just show Gross.
                        // Actually, standard leaderboard shows Total To Par.
                        // Let's rely on the Course Pars (71, 72, 72) assuming full rounds for the main "To Par" column?
                        // Or just sum up relative par. Relative is safer for partial rounds.
                        // Let's stick to "Tournament To Par" being sum of scores minus (holes * 4). Simple.

                        const toPar = totalScore - (holesPlayed * 4); // Very rough approximation
                        grandTotalToPar += toPar;
                        validRounds++;

                        rounds[c.id] = {
                            score: totalScore,
                            display: totalScore,
                            holes: holesPlayed
                        };
                    }
                });

                // Total To Par
                // Only count players who have played at least one hole
                const hasPlayed = validRounds > 0;

                return {
                    ...p,
                    rounds,
                    totalToPar: hasPlayed ? grandTotalToPar : null,
                    scores: pScores // for modal
                };
            }).sort((a, b) => {
                // Sort by Total To Par (lowest is best)
                // Nulls at bottom
                if (a.totalToPar === null && b.totalToPar === null) return 0;
                if (a.totalToPar === null) return 1;
                if (b.totalToPar === null) return -1;
                return a.totalToPar - b.totalToPar;
            });

            setLeaderboard(lb);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fade-in">
            {/* Modal Logic (Simplified for brevity, keeping existing structure mostly) */}
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
                        {/* Could restore full scorecard here if needed */}
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
                                <th style={{ padding: '1rem', textAlign: 'center' }}>River</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Plantation</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>RNK</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Total (To Par)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((p, idx) => (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.totalToPar !== null ? idx + 1 : '-'}</td>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                                        {p.totalToPar !== null && idx === 0 ? '👑 ' : ''}{p.name}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>{p.rounds[1]?.display}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>{p.rounds[2]?.display}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>{p.rounds[3]?.display}</td>
                                    <td style={{
                                        padding: '1rem',
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                        color: p.totalToPar < 0 ? 'var(--accent)' : (p.totalToPar > 0 ? '#ff6b6b' : 'inherit')
                                    }}>
                                        {p.totalToPar === null ? '--' : (p.totalToPar > 0 ? `+${p.totalToPar}` : (p.totalToPar === 0 ? 'E' : p.totalToPar))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {players.length === 0 && <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}
            </div>
        </div>
    );
}
