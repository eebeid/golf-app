"use client";

import React, { useState } from 'react';
import { Trophy, TrendingUp, AlertTriangle, Star, CheckCircle, ArrowUp, Flag, History } from 'lucide-react';

export default function RecapDashboard({ 
    tournament, 
    rankingsByRound, 
    moversByRound, 
    difficultHoles, 
    easiestHoles, 
    highlights, 
    finalLeaders,
    numberOfRounds 
}) {
    const [selectedRound, setSelectedRound] = useState('tournament'); // 'tournament' or 1, 2, 3...

    const isTournamentView = selectedRound === 'tournament';
    const roundNum = isTournamentView ? numberOfRounds : parseInt(selectedRound);
    
    const displayLeaders = isTournamentView ? finalLeaders : rankingsByRound[roundNum - 1];
    const displayMovers = isTournamentView ? [] : (moversByRound[roundNum] || []);
    
    // Filter highlights for the specific round if not tournament view
    const displayHighlights = isTournamentView 
        ? highlights 
        : highlights.filter(h => h.round === roundNum);

    // Filter hole difficulty for the specific round's course
    const roundCourseId = tournament.settings?.roundCourses?.[roundNum - 1];
    const displayDifficult = isTournamentView 
        ? difficultHoles 
        : difficultHoles.filter(h => h.courseId === roundCourseId);
    
    const displayEasiest = isTournamentView 
        ? easiestHoles 
        : easiestHoles.filter(h => h.courseId === roundCourseId);

    return (
        <div>
            {/* Header / Selector */}
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <h1 className="section-title" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                    {isTournamentView ? '🏆 Tournament Recap' : `📈 Round ${roundNum} Summary`}
                </h1>
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setSelectedRound('tournament')}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '30px',
                            border: isTournamentView ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
                            background: isTournamentView ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                            color: isTournamentView ? '#000' : 'var(--text-muted)',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Trophy size={18} /> Tournament Recap
                    </button>
                    {Array.from({ length: numberOfRounds }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedRound(i + 1)}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '30px',
                                border: selectedRound === (i + 1) ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
                                background: selectedRound === (i + 1) ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                color: selectedRound === (i + 1) ? '#000' : 'var(--text-muted)',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            Round {i + 1}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div className="card" style={{ display: 'inline-block', padding: '1rem 2rem', background: 'rgba(212, 175, 55, 0.05)', fontStyle: 'italic', maxWidth: '800px' }}>
                    {isTournamentView ? (
                        <p style={{ margin: 0 }}>
                            "What a journey! From the first tee to the final putt, {tournament.name} delivered high drama and unforgettable moments. 
                            Through {numberOfRounds} grueling rounds, the field faced testing conditions, but {finalLeaders[0]?.name} ultimately rose above the rest to claim the title. 
                            Here's how it all unfolded."
                        </p>
                    ) : (
                        <p style={{ margin: 0 }}>
                            "Round {roundNum} is officially in the books. The course played its part today, rewarding precision and punishing the bold. 
                            While some scaled the leaderboard with surgical accuracy, others found themselves battling the elements. 
                            Let's look at the key moments and movers from today's play."
                        </p>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                
                {/* 1. WINNERS / LEADERS SECTION */}
                <div style={{ gridColumn: '1 / -1' }}>
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
                            <Trophy size={200} color="var(--accent)" />
                        </div>
                        
                        <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <Star fill="var(--accent)" size={24} /> 
                            {isTournamentView ? 'Official Final Standings' : `Round ${roundNum} Leaders`}
                            <Star fill="var(--accent)" size={24} />
                        </h2>
                        
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1.5rem', marginBottom: '2rem', padding: '0 1rem' }}>
                            {/* 2nd Place */}
                            {displayLeaders[1] && (
                                <div style={{ flex: 1, maxWidth: '150px' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>2nd</div>
                                    <div className="card" style={{ padding: '1rem', borderTop: '4px solid #C0C0C0' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{displayLeaders[1].name}</div>
                                        <div style={{ color: 'var(--accent)', fontSize: '1.2rem', fontWeight: 'bold', marginTop: '4px' }}>
                                            {displayLeaders[1].stats.totalPoints} <span style={{ fontSize: '0.7rem' }}>PTS</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* 1st Place */}
                            {displayLeaders[0] && (
                                <div style={{ flex: 1, maxWidth: '180px' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--accent)', fontSize: '1.2rem' }}>WINNER</div>
                                    <div className="card" style={{ padding: '1.5rem', borderTop: '4px solid var(--accent)', boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' }}>
                                        <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🏆</div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{displayLeaders[0].name}</div>
                                        <div style={{ color: 'var(--accent)', fontSize: '1.8rem', fontWeight: 'bold', marginTop: '8px' }}>
                                            {displayLeaders[0].stats.totalPoints} <span style={{ fontSize: '0.8rem' }}>PTS</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3rd Place */}
                            {displayLeaders[2] && (
                                <div style={{ flex: 1, maxWidth: '150px' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>3rd</div>
                                    <div className="card" style={{ padding: '1rem', borderTop: '4px solid #CD7F32' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{displayLeaders[2].name}</div>
                                        <div style={{ color: 'var(--accent)', fontSize: '1.2rem', fontWeight: 'bold', marginTop: '4px' }}>
                                            {displayLeaders[2].stats.totalPoints} <span style={{ fontSize: '0.7rem' }}>PTS</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. BIGGEST MOVERS (Current Round only) */}
                {!isTournamentView && displayMovers.length > 0 && (
                    <div style={{ gridColumn: '1 / -1' }}>
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <TrendingUp size={20} color="#4ade80" /> The Round {roundNum} Movers
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                {displayMovers.map((m, i) => (
                                    <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{m.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Jumped {m.movement} spots</div>
                                        </div>
                                        <div style={{ color: '#4ade80', display: 'flex', alignItems: 'center' }}>
                                            <ArrowUp size={16} /> <span style={{ fontWeight: 'bold' }}>{m.movement}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. HOLE DIFFICULTY */}
                <div style={{ gridColumn: 'span 1' }}>
                    <div className="glass-panel" style={{ height: '100%' }}>
                        <h3 style={{ padding: '1.5rem 1.5rem 0', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#ff6b6b' }}>
                            <AlertTriangle size={20} /> Tough Tests
                        </h3>
                        {displayDifficult.length > 0 ? (
                            <div style={{ padding: '0 1.5rem 1.5rem' }}>
                                {displayDifficult.map((h, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--glass-border)' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>Hole {h.holeNum} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({h.courseName})</span></div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Par {h.par} • Played +{h.avgDiff.toFixed(2)} vs Par</div>
                                        </div>
                                        <div style={{ color: '#ff6b6b', fontWeight: 'bold' }}>#{i+1} Hardest</div>
                                    </div>
                                ))}
                            </div>
                        ) : <p style={{ padding: '0 1.5rem 1.5rem', color: 'var(--text-muted)' }}>No data available.</p>}
                    </div>
                </div>

                <div style={{ gridColumn: 'span 1' }}>
                    <div className="glass-panel" style={{ height: '100%' }}>
                        <h3 style={{ padding: '1.5rem 1.5rem 0', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80' }}>
                            <CheckCircle size={20} /> Scoring Opportunities
                        </h3>
                        {displayEasiest.length > 0 ? (
                            <div style={{ padding: '0 1.5rem 1.5rem' }}>
                                {displayEasiest.map((h, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--glass-border)' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>Hole {h.holeNum} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({h.courseName})</span></div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Par {h.par} • Played {h.avgDiff >= 0 ? '+' : ''}{h.avgDiff.toFixed(2)} vs Par</div>
                                        </div>
                                        <div style={{ color: '#4ade80', fontWeight: 'bold' }}>#{i+1} Easiest</div>
                                    </div>
                                ))}
                            </div>
                        ) : <p style={{ padding: '0 1.5rem 1.5rem', color: 'var(--text-muted)' }}>No data available.</p>}
                    </div>
                </div>

                {/* 4. HIGHLIGHT REEL */}
                <div style={{ gridColumn: '1 / -1' }}>
                    <div className="glass-panel">
                        <h3 style={{ padding: '1.5rem 1.5rem 0', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Zap size={20} color="var(--accent)" /> {isTournamentView ? 'The Highlight Reel' : `Round ${roundNum} Highlights`}
                        </h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'var(--primary)', color: '#fff' }}>
                                        <th style={{ padding: '12px 1.5rem' }}>Player</th>
                                        <th style={{ padding: '12px' }}>Insight</th>
                                        <th style={{ padding: '12px', textAlign: 'center' }}>Score</th>
                                        {isTournamentView && <th style={{ padding: '12px', textAlign: 'right' }}>When</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayHighlights.length > 0 ? displayHighlights.map((h, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                            <td style={{ padding: '15px 1.5rem', fontWeight: 'bold' }}>{h.playerName}</td>
                                            <td style={{ padding: '15px' }}>
                                                {h.diff <= -2 ? '🦅 Amazing Eagle on Hole ' : '🐦 Birdie on Hole '}{h.holeNum}
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{h.courseName}</div>
                                            </td>
                                            <td style={{ padding: '15px', textAlign: 'center' }}>
                                                <span style={{ 
                                                    background: h.diff <= -2 ? '#8b5cf6' : '#10b981', 
                                                    color: '#fff', 
                                                    padding: '4px 10px', 
                                                    borderRadius: '4px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {h.score} (Par {h.par})
                                                </span>
                                            </td>
                                            {isTournamentView && (
                                                <td style={{ padding: '15px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                    Round {h.round}
                                                </td>
                                            )}
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No highlights yet for this selection.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* 5. HISTORY TRACKER */}
                {isTournamentView && numberOfRounds > 1 && (
                    <div style={{ gridColumn: '1 / -1' }}>
                        <div className="glass-panel">
                            <h3 style={{ padding: '1.5rem 1.5rem 0', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <History size={20} color="var(--accent)" /> Historical Standings
                            </h3>
                            <div style={{ padding: '0 1.5rem 1.5rem', overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ color: 'var(--accent)', borderBottom: '1px solid var(--accent)' }}>
                                            <th style={{ padding: '10px' }}>Player</th>
                                            {Array.from({ length: numberOfRounds }).map((_, i) => (
                                                <th key={i} style={{ padding: '10px', textAlign: 'center' }}>R{i+1} Rank</th>
                                            ))}
                                            <th style={{ padding: '10px', textAlign: 'right' }}>Trending</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tournament.players.map(p => {
                                            const ranks = rankingsByRound.map(round => round.findIndex(pr => pr.id === p.id) + 1);
                                            const trend = ranks[ranks.length - 2] - ranks[ranks.length - 1];
                                            return (
                                                <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                    <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{p.name}</td>
                                                    {ranks.map((r, i) => (
                                                        <td key={i} style={{ padding: '12px 10px', textAlign: 'center' }}>
                                                            <div style={{ 
                                                                width: '30px', height: '30px', 
                                                                borderRadius: '50%', 
                                                                background: r === 1 ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                                                color: r === 1 ? '#000' : 'var(--text-main)',
                                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                                fontWeight: 'bold'
                                                            }}>{r}</div>
                                                        </td>
                                                    ))}
                                                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                                                        {trend > 0 ? (
                                                            <span style={{ color: '#4ade80', fontWeight: 'bold' }}>↑ {trend}</span>
                                                        ) : trend < 0 ? (
                                                            <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>↓ {Math.abs(trend)}</span>
                                                        ) : '--'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

const Zap = ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={color} />
    </svg>
);
