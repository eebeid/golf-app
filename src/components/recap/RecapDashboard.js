"use client";

import React, { useState } from 'react';
import { Trophy, TrendingUp, AlertTriangle, Star, CheckCircle, ArrowUp, Flag, History, Award, Zap } from 'lucide-react';

function PlayerAvatar({ player, size = 48, borderColor = 'var(--glass-border)', badge = null }) {
    const initials = (player?.name || 'P')
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <div style={{ position: 'relative', width: size, height: size, margin: '0 auto', flexShrink: 0 }}>
            {player?.imageUrl ? (
                <img
                    src={player.imageUrl}
                    alt={player.name || 'Player'}
                    style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: `2px solid ${borderColor}`,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                    }}
                />
            ) : (
                <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(0,77,64,0.5))',
                    border: `2px solid ${borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-main)',
                    fontWeight: 'bold',
                    fontSize: `${Math.round(size * 0.38)}px`,
                    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}>
                    {initials}
                </div>
            )}
            {badge && (
                <div style={{
                    position: 'absolute',
                    bottom: -3,
                    right: -3,
                    fontSize: `${Math.max(12, Math.round(size * 0.35))}px`,
                    lineHeight: 1,
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))'
                }}>
                    {badge}
                </div>
            )}
        </div>
    );
}

export default function RecapDashboard({ 
    tournament, 
    rankingsByRound, 
    moversByRound, 
    difficultHoles, 
    easiestHoles, 
    highlights, 
    finalLeaders,
    numberOfRounds,
    completedRounds,
    dailyHighlights = {}
}) {
    const isTournamentComplete = completedRounds.length === numberOfRounds;
    const showTournamentOption = completedRounds.length > 1 || isTournamentComplete;
    const defaultRound = showTournamentOption ? 'tournament' : completedRounds[completedRounds.length - 1];
    const [selectedRound, setSelectedRound] = useState(defaultRound);

    const isTournamentView = selectedRound === 'tournament';
    const roundNum = isTournamentView ? (completedRounds[completedRounds.length - 1] || numberOfRounds) : parseInt(selectedRound);
    
    // rankingsByRound is only for completed rounds. We need to find the correct index.
    const roundIndex = completedRounds.indexOf(roundNum);
    const roundDailyData = !isTournamentView ? dailyHighlights?.[roundNum] : null;

    // Daily podium if in round view, tournament leaders if in tournament view
    const displayLeaders = isTournamentView 
        ? finalLeaders 
        : (roundDailyData?.podium || rankingsByRound[roundIndex] || []);

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

    const superlatives = roundDailyData?.superlatives;

    return (
        <div>
            {/* Header / Selector */}
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <h1 className="section-title" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                    {isTournamentView ? '🏆 Tournament Recap' : `📈 Round ${roundNum} Summary`}
                </h1>
                
                {completedRounds.length > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {showTournamentOption && (
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
                        )}
                        {completedRounds.map((r) => (
                            <button
                                key={r}
                                onClick={() => setSelectedRound(r)}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '30px',
                                    border: selectedRound === r ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
                                    background: selectedRound === r ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                    color: selectedRound === r ? '#000' : 'var(--text-muted)',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                Round {r}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div className="card" style={{ display: 'inline-block', padding: '1rem 2rem', background: 'rgba(212, 175, 55, 0.05)', fontStyle: 'italic', maxWidth: '800px' }}>
                    {isTournamentView ? (
                        <p style={{ margin: 0 }}>
                            {isTournamentComplete ? (
                                `What a journey! From the first tee to the final putt, ${tournament.name} delivered high drama and unforgettable moments. Through ${numberOfRounds} grueling rounds, the field faced testing conditions, but ${finalLeaders[0]?.name} ultimately rose above the rest to claim the title. Here's how it all unfolded.`
                            ) : (
                                `The battle is underway! With ${completedRounds.length} of ${numberOfRounds} rounds in the books, the standings are taking shape. ${finalLeaders[0]?.name} currently leads the field, but with more golf to be played, anyone can make a run. Here is the overall recap so far.`
                            )}
                        </p>
                    ) : (
                        <p style={{ margin: 0 }}>
                            Round {roundNum} is officially in the books. The course played its part today, rewarding precision and punishing the bold. 
                            While some scaled the leaderboard with surgical accuracy, others found themselves battling the elements. 
                            Let's look at the daily champions, stats, and key moments from today's play.
                        </p>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                
                {/* 1. WINNERS / PODIUM SECTION WITH PICTURES */}
                <div style={{ gridColumn: '1 / -1' }}>
                    <div className="glass-panel" style={{ padding: '2.5rem 1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden', border: '1px solid rgba(212,175,55,0.3)' }}>
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.08 }}>
                            <Trophy size={220} color="var(--accent)" />
                        </div>
                        
                        <h2 style={{ color: 'var(--accent)', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <Star fill="var(--accent)" size={24} /> 
                            {isTournamentView ? 'Official Tournament Champions' : `Round ${roundNum} Daily Podium`}
                            <Star fill="var(--accent)" size={24} />
                        </h2>
                        
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'flex-end',
                            gap: '1.25rem',
                            marginBottom: '1rem',
                            padding: '0 0.5rem',
                            flexWrap: 'wrap'
                        }}>
                            {/* 2nd Place */}
                            {displayLeaders[1] && (
                                <div style={{ flex: '1 1 140px', maxWidth: '170px' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#C0C0C0', fontSize: '0.9rem' }}>
                                        🥈 2nd Place
                                    </div>
                                    <div className="card" style={{ padding: '1.25rem 1rem', borderTop: '4px solid #C0C0C0', background: 'rgba(255,255,255,0.03)' }}>
                                        <div style={{ marginBottom: '10px' }}>
                                            <PlayerAvatar
                                                player={displayLeaders[1]}
                                                size={56}
                                                borderColor="#C0C0C0"
                                            />
                                        </div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '4px' }}>
                                            {displayLeaders[1].name}
                                        </div>
                                        <div style={{ color: 'var(--accent)', fontSize: '1.3rem', fontWeight: 'bold' }}>
                                            {displayLeaders[1].points ?? displayLeaders[1].stats?.totalPoints} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PTS</span>
                                        </div>
                                        {(displayLeaders[1].gross || displayLeaders[1].stats?.totalGross) && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                Gross: {displayLeaders[1].gross ?? displayLeaders[1].stats?.totalGross}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {/* 1st Place (WINNER) */}
                            {displayLeaders[0] && (
                                <div style={{ flex: '1 1 180px', maxWidth: '220px', zIndex: 2 }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--accent)', fontSize: '1.15rem' }}>
                                        🏆 {isTournamentView ? 'CHAMPION' : `ROUND ${roundNum} WINNER`}
                                    </div>
                                    <div className="card" style={{
                                        padding: '1.75rem 1.25rem',
                                        borderTop: '4px solid var(--accent)',
                                        boxShadow: '0 0 30px rgba(212, 175, 55, 0.35)',
                                        background: 'linear-gradient(180deg, rgba(212,175,55,0.12) 0%, rgba(20,42,27,0.7) 100%)'
                                    }}>
                                        <div style={{ marginBottom: '12px' }}>
                                            <PlayerAvatar
                                                player={displayLeaders[0]}
                                                size={80}
                                                borderColor="var(--accent)"
                                                badge="👑"
                                            />
                                        </div>
                                        <div style={{ fontWeight: '800', fontSize: '1.25rem', color: '#fff', marginBottom: '6px' }}>
                                            {displayLeaders[0].name}
                                        </div>
                                        <div style={{ color: 'var(--accent)', fontSize: '2rem', fontWeight: '800', lineHeight: 1.1 }}>
                                            {displayLeaders[0].points ?? displayLeaders[0].stats?.totalPoints} <span style={{ fontSize: '0.85rem' }}>PTS</span>
                                        </div>
                                        {(displayLeaders[0].gross || displayLeaders[0].stats?.totalGross) && (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                                                Gross: {displayLeaders[0].gross ?? displayLeaders[0].stats?.totalGross} • Net: {displayLeaders[0].net ?? displayLeaders[0].stats?.totalNet}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 3rd Place */}
                            {displayLeaders[2] && (
                                <div style={{ flex: '1 1 140px', maxWidth: '170px' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#CD7F32', fontSize: '0.9rem' }}>
                                        🥉 3rd Place
                                    </div>
                                    <div className="card" style={{ padding: '1.25rem 1rem', borderTop: '4px solid #CD7F32', background: 'rgba(255,255,255,0.03)' }}>
                                        <div style={{ marginBottom: '10px' }}>
                                            <PlayerAvatar
                                                player={displayLeaders[2]}
                                                size={56}
                                                borderColor="#CD7F32"
                                            />
                                        </div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '4px' }}>
                                            {displayLeaders[2].name}
                                        </div>
                                        <div style={{ color: 'var(--accent)', fontSize: '1.3rem', fontWeight: 'bold' }}>
                                            {displayLeaders[2].points ?? displayLeaders[2].stats?.totalPoints} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PTS</span>
                                        </div>
                                        {(displayLeaders[2].gross || displayLeaders[2].stats?.totalGross) && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                Gross: {displayLeaders[2].gross ?? displayLeaders[2].stats?.totalGross}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. DAILY SUPERLATIVES / STAT CHAMPIONS (When viewing a specific round) */}
                {!isTournamentView && superlatives && (
                    <div style={{ gridColumn: '1 / -1' }}>
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)' }}>
                                <Award size={20} /> Round {roundNum} Stat Champions
                            </h3>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                                {/* Low Gross */}
                                {superlatives.lowGross && (
                                    <div className="card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <PlayerAvatar
                                            player={superlatives.lowGross}
                                            size={48}
                                            borderColor="#60a5fa"
                                            badge="🥇"
                                        />
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase' }}>
                                                Low Gross Champion
                                            </div>
                                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                                                {superlatives.lowGross.name}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                Score: <strong style={{ color: '#fff' }}>{superlatives.lowGross.score}</strong> ({superlatives.lowGross.toPar >= 0 ? `+${superlatives.lowGross.toPar}` : superlatives.lowGross.toPar})
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Low Net */}
                                {superlatives.lowNet && (
                                    <div className="card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <PlayerAvatar
                                            player={superlatives.lowNet}
                                            size={48}
                                            borderColor="#4ade80"
                                            badge="🎯"
                                        />
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 700, textTransform: 'uppercase' }}>
                                                Low Net Champion
                                            </div>
                                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                                                {superlatives.lowNet.name}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                Net: <strong style={{ color: '#4ade80' }}>{superlatives.lowNet.score}</strong> ({superlatives.lowNet.toPar >= 0 ? `+${superlatives.lowNet.toPar}` : superlatives.lowNet.toPar})
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Birdie King */}
                                {superlatives.birdieKing && (
                                    <div className="card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <PlayerAvatar
                                            player={superlatives.birdieKing}
                                            size={48}
                                            borderColor="#fbbf24"
                                            badge="🐦"
                                        />
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase' }}>
                                                Birdie King
                                            </div>
                                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                                                {superlatives.birdieKing.name}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                <strong style={{ color: 'var(--accent)' }}>{superlatives.birdieKing.count} Birdies</strong> logged
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. BIGGEST MOVERS (Current Round only) */}
                {!isTournamentView && displayMovers.length > 0 && (
                    <div style={{ gridColumn: '1 / -1' }}>
                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <TrendingUp size={20} color="#4ade80" /> The Round {roundNum} Movers
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                {displayMovers.map((m, i) => (
                                    <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <PlayerAvatar player={m} size={36} />
                                            <div>
                                                <div style={{ fontWeight: 'bold' }}>{m.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Jumped {m.movement} spots</div>
                                            </div>
                                        </div>
                                        <div style={{ color: '#4ade80', display: 'flex', alignItems: 'center' }}>
                                            <ArrowUp size={16} /> <span style={{ fontWeight: 'bold', marginLeft: '2px' }}>{m.movement}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. HOLE DIFFICULTY */}
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

                {/* 5. HIGHLIGHT REEL */}
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
                                            <td style={{ padding: '15px 1.5rem', fontWeight: 'bold' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <PlayerAvatar player={{ name: h.playerName, imageUrl: h.playerImageUrl }} size={28} />
                                                    <span>{h.playerName}</span>
                                                </div>
                                            </td>
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

                {/* 6. HISTORY TRACKER */}
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
                                            {completedRounds.map((r) => (
                                                <th key={r} style={{ padding: '10px', textAlign: 'center' }}>R{r} Rank</th>
                                            ))}
                                            <th style={{ padding: '10px', textAlign: 'right' }}>Trending</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tournament.players.map(p => {
                                            const ranks = rankingsByRound.map(round => round.findIndex(pr => pr.id === p.id) + 1);
                                            const trend = ranks.length > 1 ? (ranks[ranks.length - 2] - ranks[ranks.length - 1]) : 0;
                                            return (
                                                <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                    <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <PlayerAvatar player={p} size={26} />
                                                            <span>{p.name}{p.handicapIndex !== undefined && p.handicapIndex !== null && p.handicapIndex !== '' ? ` (${p.handicapIndex})` : ''}</span>
                                                        </div>
                                                    </td>
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
