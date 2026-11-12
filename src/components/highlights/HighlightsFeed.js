"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Star, Bird, Target, ArrowRight, Flame, AlertTriangle, CheckCircle, Award } from 'lucide-react';

function PlayerAvatar({ player, size = 48, borderColor = 'var(--glass-border)', badge = null }) {
    const initials = (player?.name || 'P')
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
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

export default function HighlightsFeed({ tournamentId }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedRound, setSelectedRound] = useState(null);

    useEffect(() => {
        if (!tournamentId) return;

        const fetchHighlights = async () => {
            try {
                const res = await fetch(`/api/highlights?tournamentId=${tournamentId}`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                    if (json.latestRound) {
                        setSelectedRound(prev => (prev !== null ? prev : json.latestRound));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch highlights", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHighlights();
        // Poll every 10 minutes (600000ms) to reduce server load
        const interval = setInterval(fetchHighlights, 600000);
        return () => clearInterval(interval);
    }, [tournamentId]);

    if (loading) {
        return (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading daily highlights...
            </div>
        );
    }

    const dailyHighlights = data?.dailyHighlights || {};
    const completedRounds = data?.completedRounds || [];
    const activeRoundNum = selectedRound || data?.latestRound || completedRounds[completedRounds.length - 1];
    const activeRoundData = activeRoundNum ? dailyHighlights[activeRoundNum] : null;
    const recentFeed = data?.recentFeed || [];

    // If no scores recorded at all
    if (!activeRoundData && recentFeed.length === 0) {
        return (
            <div className="card fade-in" style={{ padding: '2.5rem', textAlign: 'center', background: 'rgba(255,255,255,0.03)' }}>
                <Trophy size={40} className="mx-auto mb-3" style={{ color: 'var(--accent)', opacity: 0.6 }} />
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent)' }}>Daily Highlights</h3>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
                    Enter scores during or after your round to see daily winners, stats, and highlights!
                </p>
            </div>
        );
    }

    const winner = activeRoundData?.winner;
    const podium = activeRoundData?.podium || [];
    const superlatives = activeRoundData?.superlatives || {};
    const moments = activeRoundData?.moments || recentFeed.slice(0, 6);

    return (
        <div className="card fade-in" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(212,175,55,0.3)', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
            
            {/* Header with Title and Round Tabs */}
            <div style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--glass-border)',
                background: 'linear-gradient(180deg, rgba(212,175,55,0.12) 0%, rgba(0,0,0,0.1) 100%)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{
                        background: 'rgba(212,175,55,0.2)',
                        border: '1px solid var(--accent)',
                        borderRadius: '8px',
                        padding: '6px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Trophy size={18} color="var(--accent)" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--accent)', fontWeight: '700' }}>
                            Daily Highlights
                        </h3>
                        {activeRoundData?.courseName && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {activeRoundData.courseName} {activeRoundData.date ? `• ${activeRoundData.date}` : ''}
                            </div>
                        )}
                    </div>
                </div>

                {/* Round Switcher Tabs */}
                {completedRounds.length > 1 && (
                    <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                        {completedRounds.map(r => (
                            <button
                                key={r}
                                onClick={() => setSelectedRound(r)}
                                style={{
                                    border: 'none',
                                    padding: '5px 14px',
                                    borderRadius: '16px',
                                    background: activeRoundNum === r ? 'var(--accent)' : 'transparent',
                                    color: activeRoundNum === r ? '#000' : 'var(--text-muted)',
                                    fontWeight: 'bold',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Round {r}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Daily Winner Spotlight */}
            {winner && (
                <div style={{
                    padding: '1.5rem',
                    background: 'radial-gradient(ellipse at top, rgba(212,175,55,0.15) 0%, rgba(20,42,27,0.4) 100%)',
                    borderBottom: '1px solid var(--glass-border)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1.25rem'
                    }}>
                        {/* Winner Avatar + Name & Title */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', minWidth: '240px' }}>
                            <div style={{ position: 'relative' }}>
                                <PlayerAvatar
                                    player={winner}
                                    size={72}
                                    borderColor="var(--accent)"
                                    badge="👑"
                                />
                            </div>
                            <div>
                                <span style={{
                                    display: 'inline-block',
                                    background: 'rgba(212,175,55,0.2)',
                                    border: '1px solid rgba(212,175,55,0.4)',
                                    borderRadius: '12px',
                                    padding: '2px 8px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    color: 'var(--accent)',
                                    letterSpacing: '0.5px',
                                    marginBottom: '4px'
                                }}>
                                    ROUND {activeRoundNum} WINNER
                                </span>
                                <h4 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: '#fff' }}>
                                    {winner.name}{winner.handicapIndex !== undefined && winner.handicapIndex !== null && winner.handicapIndex !== '' ? ` (${winner.handicapIndex})` : ''}
                                </h4>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    Hcp {winner.courseHandicap !== undefined ? winner.courseHandicap : winner.handicapIndex} • {winner.holesPlayed} Holes Played
                                </div>
                            </div>
                        </div>

                        {/* Winner Stats Chips */}
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{
                                background: 'rgba(0,0,0,0.4)',
                                border: '1px solid rgba(212,175,55,0.4)',
                                borderRadius: '10px',
                                padding: '8px 14px',
                                textAlign: 'center',
                                minWidth: '80px'
                            }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Points</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1.1 }}>
                                    {winner.points}
                                </div>
                            </div>

                            <div style={{
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '10px',
                                padding: '8px 14px',
                                textAlign: 'center',
                                minWidth: '70px'
                            }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Gross</div>
                                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.1 }}>
                                    {winner.gross}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    {winner.toParGross >= 0 ? `+${winner.toParGross}` : winner.toParGross}
                                </div>
                            </div>

                            <div style={{
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '10px',
                                padding: '8px 14px',
                                textAlign: 'center',
                                minWidth: '70px'
                            }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Net</div>
                                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#4ade80', lineHeight: 1.1 }}>
                                    {winner.net}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#4ade80' }}>
                                    {winner.toParNet >= 0 ? `+${winner.toParNet}` : winner.toParNet}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Podium Runner-ups (2nd & 3rd place preview) */}
                    {podium.length > 1 && (
                        <div style={{
                            display: 'flex',
                            gap: '1rem',
                            marginTop: '1.25rem',
                            paddingTop: '1rem',
                            borderTop: '1px solid rgba(255,255,255,0.08)',
                            flexWrap: 'wrap'
                        }}>
                            {podium.slice(1).map(runner => (
                                <div key={runner.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.6rem',
                                    background: 'rgba(0,0,0,0.25)',
                                    borderRadius: '20px',
                                    padding: '4px 12px 4px 6px',
                                    border: '1px solid var(--glass-border)'
                                }}>
                                    <PlayerAvatar
                                        player={runner}
                                        size={28}
                                        borderColor={runner.place === 2 ? '#C0C0C0' : '#CD7F32'}
                                    />
                                    <span style={{ fontSize: '0.8rem', color: runner.place === 2 ? '#C0C0C0' : '#CD7F32', fontWeight: 'bold' }}>
                                        {runner.place === 2 ? '2nd' : '3rd'}
                                    </span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                        {runner.name}{runner.handicapIndex !== undefined && runner.handicapIndex !== null && runner.handicapIndex !== '' ? ` (${runner.handicapIndex})` : ''}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 'bold' }}>
                                        {runner.points} pts
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Daily Superlatives / Stat Awards Grid */}
            <div style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--glass-border)',
                background: 'rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '1rem'
                }}>
                    {/* Low Gross */}
                    {superlatives?.lowGross && (
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '10px',
                            padding: '10px 12px',
                            border: '1px solid var(--glass-border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <PlayerAvatar
                                player={superlatives.lowGross}
                                size={40}
                                borderColor="#60a5fa"
                                badge="🥇"
                            />
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase' }}>
                                    Low Gross
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {superlatives.lowGross.name}{superlatives.lowGross.handicapIndex !== undefined && superlatives.lowGross.handicapIndex !== null && superlatives.lowGross.handicapIndex !== '' ? ` (${superlatives.lowGross.handicapIndex})` : ''}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    Score: <strong style={{ color: 'var(--text-main)' }}>{superlatives.lowGross.score}</strong> ({superlatives.lowGross.toPar >= 0 ? `+${superlatives.lowGross.toPar}` : superlatives.lowGross.toPar})
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Low Net */}
                    {superlatives?.lowNet && (
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '10px',
                            padding: '10px 12px',
                            border: '1px solid var(--glass-border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <PlayerAvatar
                                player={superlatives.lowNet}
                                size={40}
                                borderColor="#4ade80"
                                badge="🎯"
                            />
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '0.72rem', color: '#4ade80', fontWeight: 700, textTransform: 'uppercase' }}>
                                    Low Net
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {superlatives.lowNet.name}{superlatives.lowNet.handicapIndex !== undefined && superlatives.lowNet.handicapIndex !== null && superlatives.lowNet.handicapIndex !== '' ? ` (${superlatives.lowNet.handicapIndex})` : ''}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    Net: <strong style={{ color: '#4ade80' }}>{superlatives.lowNet.score}</strong> ({superlatives.lowNet.toPar >= 0 ? `+${superlatives.lowNet.toPar}` : superlatives.lowNet.toPar})
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Birdie King */}
                    {superlatives?.birdieKing && (
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '10px',
                            padding: '10px 12px',
                            border: '1px solid var(--glass-border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <PlayerAvatar
                                player={superlatives.birdieKing}
                                size={40}
                                borderColor="#fbbf24"
                                badge="🐦"
                            />
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase' }}>
                                    Birdie King
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {superlatives.birdieKing.name}{superlatives.birdieKing.handicapIndex !== undefined && superlatives.birdieKing.handicapIndex !== null && superlatives.birdieKing.handicapIndex !== '' ? ` (${superlatives.birdieKing.handicapIndex})` : ''}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    <strong style={{ color: 'var(--accent)' }}>{superlatives.birdieKing.count} Birdies</strong> logged
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Toughest Hole */}
                    {activeRoundData?.toughHoles?.[0] && (
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '10px',
                            padding: '10px 12px',
                            border: '1px solid var(--glass-border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <div style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                background: 'rgba(239,68,68,0.15)',
                                border: '2px solid #ef4444',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ef4444',
                                flexShrink: 0
                            }}>
                                <AlertTriangle size={20} />
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase' }}>
                                    Toughest Hole
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                                    Hole #{activeRoundData.toughHoles[0].hole} (Par {activeRoundData.toughHoles[0].par})
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    Played <strong style={{ color: '#ef4444' }}>+{activeRoundData.toughHoles[0].avgDiff.toFixed(2)}</strong> vs par
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Key Shot Moments Reel */}
            {moments.length > 0 && (
                <div style={{ padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.15)' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem'
                    }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Round {activeRoundNum} Moments
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {moments.length} Highlight{moments.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }} className="custom-scrollbar">
                        {moments.map((item, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '0.75rem',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <PlayerAvatar
                                        player={{ name: item.playerName || item.player, imageUrl: item.playerImageUrl }}
                                        size={28}
                                    />
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                            {item.playerName || item.player}
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                            {item.message}
                                        </div>
                                    </div>
                                </div>
                                {item.timeAgo && (
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', opacity: 0.8, whiteSpace: 'nowrap' }}>
                                        {item.timeAgo}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer with link to Full Recap */}
            <div style={{
                padding: '0.9rem 1.5rem',
                borderTop: '1px solid var(--glass-border)',
                background: 'rgba(0,0,0,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Detailed round analytics & historical movements
                </span>
                <Link
                    href={`/t/${tournamentId}/recap`}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--accent)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        textDecoration: 'none'
                    }}
                >
                    View Full Recap <ArrowRight size={15} />
                </Link>
            </div>
        </div>
    );
}
