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

                // Calculate score per course
                const rounds = {};
                let grandTotalGross = 0;
                let grandTotalNet = 0;
                let validRounds = 0;
                let totalParPlayed = 0;

                courses.forEach(c => {
                    const cScores = pScores.filter(s => s.courseId === c.id);
                    const holesPlayed = cScores.length;

                    // Determine course handicap
                    let courseHcp = 0;
                    if (c.id === 1) courseHcp = p.hcpRiver || 0;
                    if (c.id === 2) courseHcp = p.hcpPlantation || 0;
                    if (c.id === 3) courseHcp = p.hcpRNK || 0;

                    if (holesPlayed === 0) {
                        rounds[c.id] = {
                            gross: null,
                            net: null,
                            display: '--'
                        };
                    } else {
                        const grossScore = cScores.reduce((a, b) => a + b.score, 0);

                        // Net Calculation: Gross - Course Handicap
                        // Note: Ideally specific holes are stroked, but for total round net match play/stroke play:
                        // Net = Gross - Handicap.
                        // However, if partial round, we can't deduct full handicap. 
                        // Assuming full rounds typically or standard display.
                        // We will just do Gross - Handicap for the net display.
                        // If they played < 18 holes, this might be artificially low, but standard logic applies.

                        const netScore = grossScore - courseHcp;

                        // Add to totals
                        grandTotalGross += grossScore;
                        grandTotalNet += netScore;
                        validRounds++;

                        // Approximate par for holes played
                        totalParPlayed += (holesPlayed * 4); // Still rough approx, but needed for "To Par"

                        rounds[c.id] = {
                            gross: grossScore,
                            net: netScore,
                            display: `${grossScore} (Net ${netScore})`,
                            holes: holesPlayed
                        };
                    }
                });

                // Total To Par (Net)
                const hasPlayed = validRounds > 0;
                // Net To Par = Total Net - (Total Pars) ? 
                // Actually, "To Par" usually is (Gross - Par) - Handicap = Net To Par.
                // Or simply Total Net - Total Par (sum of pars 71+72+72) if full tournament?
                // Given we use "holes * 4" approx previously, let's stick to consistent relative comparison.
                // Net To Par = Grand Total Net - (holes * 4 approx OR actual total par if we tracked it)

                // Let's refine the total par calculation.
                // Since we don't have per-hole par in this view, we can't be perfect on partials.
                // But for full rounds, we know pars: 71, 72, 72.
                // Let's rely on that if holesPlayed >= 18? No, too complex.
                // Let's just track "Net To Par" as: Grand Net - (Sum of Course Pars for rounds played)
                // If partial, revert to approx.

                // Actually, let's just show "Total Net" and "Total Gross". 
                // "Net To Par" is nice but "Total Net" works for sorting.

                // Let's re-calculate "Net To Par" using the course pars from the array `courses`
                // only strictly adding the par of the course if at least 1 hole was played? 
                // No, that breaks partials.
                // Let's stick to the previous simple logic but applied to Net:
                // Net To Par = GrandTotalNet - (approx par).
                // Re-using the approx par logic from before for consistency.
                const netToPar = hasPlayed ? (grandTotalNet - totalParPlayed) : null;


                return {
                    ...p,
                    rounds,
                    totalGross: hasPlayed ? grandTotalGross : null,
                    totalNet: hasPlayed ? grandTotalNet : null,
                    netToPar: netToPar,
                    scores: pScores
                };
            }).sort((a, b) => {
                // Sort by Total Net (lowest is best)
                if (a.totalNet === null && b.totalNet === null) return 0;
                if (a.totalNet === null) return 1;
                if (b.totalNet === null) return -1;
                return a.totalNet - b.totalNet;
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
                            <strong>Scoring:</strong><br />
                            {courses.map(c => {
                                const r = selectedDetailPlayer.rounds[c.id];
                                if (!r || r.gross == null) return null;
                                return <div key={c.id}>{c.name}: Gross {r.gross} - Hcp = Net {r.net}</div>
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
                                <th style={{ padding: '1rem', textAlign: 'center' }}>River<br /><span style={{ fontSize: '0.8em', opacity: 0.8 }}>Gross (Net)</span></th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Plantation<br /><span style={{ fontSize: '0.8em', opacity: 0.8 }}>Gross (Net)</span></th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>RNK<br /><span style={{ fontSize: '0.8em', opacity: 0.8 }}>Gross (Net)</span></th>
                                <th style={{ padding: '1rem', textAlign: 'center', background: 'rgba(0,0,0,0.2)' }}>Total Gross</th>
                                <th style={{ padding: '1rem', textAlign: 'center', background: 'var(--accent)', color: '#000' }}>Total Net</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((p, idx) => (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer' }} onClick={() => setSelectedDetailPlayer(p)}>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.totalNet !== null ? idx + 1 : '-'}</td>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                                        {p.totalNet !== null && idx === 0 ? '👑 ' : ''}{p.name}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.95rem' }}>{p.rounds[1]?.display}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.95rem' }}>{p.rounds[2]?.display}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.95rem' }}>{p.rounds[3]?.display}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', background: 'rgba(0,0,0,0.1)' }}>
                                        {p.totalGross ?? '--'}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent)', fontSize: '1.1rem' }}>
                                        {p.totalNet ?? '--'}
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
