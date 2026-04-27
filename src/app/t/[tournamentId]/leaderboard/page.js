"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { X, Share2, ExternalLink } from 'lucide-react';
import Image from 'next/image';

// We might not need this anymore if we are doing simplified calculation for now
// import { calculateAllCourseHandicaps } from '@/lib/courseHandicap';

export default function LeaderboardPage() {
    const params = useParams();
    const tournamentId = params?.tournamentId;

    const [players, setPlayers] = useState([]);
    const [scores, setScores] = useState([]);
    const [displayCourses, setDisplayCourses] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [teeTimes, setTeeTimes] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('points'); // 'points', 'strokes', 'net', or 'ryder'

    const [selectedDetailPlayer, setSelectedDetailPlayer] = useState(null);
    const [expandedMatch, setExpandedMatch] = useState(null);

    const fetchStaticData = async () => {
        if (!tournamentId) return;
        try {
            const [pRes, cRes, setRes, tRes] = await Promise.all([
                fetch(`/api/players?tournamentId=${tournamentId}`),
                fetch(`/api/courses?tournamentId=${tournamentId}`),
                fetch(`/api/settings?tournamentId=${tournamentId}`),
                fetch(`/api/schedule?tournamentId=${tournamentId}`)
            ]);

            const pData = await pRes.json();
            const cData = await cRes.json();
            const settingsData = await setRes.json();
            const tData = await tRes.json();

            if (settingsData?.showLeaderboard === false) {
                window.location.href = `/t/${tournamentId}`;
                return;
            }

            setPlayers(pData);
            setSettings(settingsData);
            setTeeTimes(tData);

            // Filter and sort courses based on Settings
            let activeCourses = [];
            if (settingsData?.roundCourses && Array.isArray(settingsData.roundCourses)) {
                activeCourses = settingsData.roundCourses.map((courseId, index) => {
                    const course = cData.find(c => c.id === courseId);
                    const roundNum = index + 1;
                    const config = settingsData.roundTimeConfig?.[roundNum] || {};
                    return course ? { ...course, roundNum, format: config.format } : null;
                }).filter(Boolean);
            } else {
                activeCourses = Array.isArray(cData) ? cData.sort((a, b) => a.name.localeCompare(b.name)) : [];
            }
            const individualCourses = activeCourses.filter(c => c.format !== 'Scramble');
            setDisplayCourses(individualCourses);

            return { pData, cData, settingsData, activeCourses };
        } catch (e) {
            console.error('Static data fetch error:', e);
        }
    };

    const fetchScores = async () => {
        if (!tournamentId) return;
        try {
            const sRes = await fetch(`/api/scores?tournamentId=${tournamentId}`);
            if (sRes.ok) setScores(await sRes.json());
        } catch (e) {
            console.error('Scores fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchData = async () => {
        if (!tournamentId) return;

        try {
            const staticResult = await fetchStaticData();
            if (!staticResult) return;

            const { pData, cData, settingsData, activeCourses } = staticResult;
            const sRes = await fetch(`/api/scores?tournamentId=${tournamentId}`);
            const sData = await sRes.json();
            setScores(sData);

            const lb = buildLeaderboard(pData, sData, cData, activeCourses, settingsData);
            setLeaderboard(lb);
            setError(null);
        } catch (e) {
            console.error(e);
            setError("Failed to load leaderboard data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    // Helper to build leaderboard from already-loaded state
    const buildLeaderboard = (pData, sData, cData, activeCourses, settingsData) => {
        return pData.map(p => {
            const pScores = sData.filter(s => s.playerId == p.id);

            // We map course ID to a calculated course handicap value based on USGA formula.
            const courseHandicaps = {};
            if (Array.isArray(cData)) {
                cData.forEach(c => {
                    let tee = null;
                    const pcd = typeof p.courseData === 'string' ? JSON.parse(p.courseData || '{}') : (p.courseData || {});
                    const playerTeeName = pcd[c.id]?.tee;

                    if (playerTeeName && c.tees && c.tees.length > 0) {
                        tee = c.tees.find(t => t.name === playerTeeName);
                    }

                    if (!tee && c.tees && c.tees.length > 0) {
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
                const cScores = pScores.filter(s => s.courseId === c.id && (s.round || 1) === c.roundNum);
                const holesPlayed = cScores.length;

                if (holesPlayed === 0) {
                    rounds[`${c.id}_${c.roundNum}`] = { points: null, gross: null, net: null, display: '--' };
                } else {
                    const totalPoints = cScores.reduce((a, b) => a + (b.stablefordPoints || 0), 0);
                    const grossScore = cScores.reduce((a, b) => a + b.score, 0);
                    const ch = courseHandicaps[c.id] || 0;
                    const netScore = grossScore - ch;

                    if (c.format !== 'Scramble') {
                        grandTotalPoints += totalPoints;
                        grandTotalGross += grossScore;
                        grandTotalNet += netScore;
                        validRounds++;
                    }

                    rounds[`${c.id}_${c.roundNum}`] = {
                        points: totalPoints, gross: grossScore, net: netScore,
                        display: `${totalPoints} pts`, holes: holesPlayed, id: c.id, format: c.format
                    };
                }
            });

            const hasPlayed = validRounds > 0;
            return {
                ...p, rounds,
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
    };



    const isGlobalRyderCup = settings?.ryderCupConfig?.enabled;
    const hasRyderRound = isGlobalRyderCup || (settings?.roundTimeConfig && Object.values(settings.roundTimeConfig).some(cfg => cfg.format === 'RyderCup' || cfg.format === 'MatchPlay'));
    const hasStablefordRound = settings?.roundTimeConfig && Object.values(settings.roundTimeConfig).some(cfg => cfg.format === 'Stableford');
    const hasScrambleRound = settings?.roundTimeConfig && Object.values(settings.roundTimeConfig).some(cfg => cfg.format === 'Scramble');

    const calculateScrambleScores = () => {
        if (!hasScrambleRound) return [];

        const scrambleRounds = [];
        const numRounds = settings?.numberOfRounds || 0;
        const globalTeam1Ids = settings?.ryderCupConfig?.team1 || [];
        const globalTeam2Ids = settings?.ryderCupConfig?.team2 || [];

        for (let roundNum = 1; roundNum <= numRounds; roundNum++) {
            const config = settings?.roundTimeConfig?.[roundNum] || {};
            if (config.format !== 'Scramble') continue;

            const courseId = settings?.roundCourses?.[roundNum - 1];
            const roundTeeTimes = teeTimes.filter(tt => String(tt.round) === String(roundNum));

            const matchPairings = [];

            roundTeeTimes.forEach(tt => {
                const getBestGross = (playerIds) => {
                    let total = 0;
                    let thru = 0;
                    for (let h = 1; h <= 18; h++) {
                        let bestHoleForTeam = null;
                        playerIds.forEach(pid => {
                            const s = scores.find(sc => String(sc.playerId) === String(pid) && String(sc.courseId) === String(courseId) && sc.hole === h && (sc.round || 1) === roundNum);
                            if (s && s.score > 0 && (bestHoleForTeam === null || s.score < bestHoleForTeam)) {
                                bestHoleForTeam = s.score;
                            }
                        });
                        if (bestHoleForTeam !== null) {
                            total += bestHoleForTeam;
                            thru = h;
                        }
                    }
                    return thru > 0 ? { total, thru } : null;
                };

                const team1Ids = isGlobalRyderCup ? globalTeam1Ids : (config.team1 || []);
                const team2Ids = isGlobalRyderCup ? globalTeam2Ids : (config.team2 || []);

                // TeeTime players are often objects {id, name, ...}
                const ttPlayers = tt.players || [];
                const t1InGroup = ttPlayers.filter(p => team1Ids.some(id => String(id) === String(p.id))).map(p => p.id);
                const t2InGroup = ttPlayers.filter(p => team2Ids.some(id => String(id) === String(p.id))).map(p => p.id);

                if (t1InGroup.length > 0 || t2InGroup.length > 0) {
                    const t1Score = getBestGross(t1InGroup);
                    const t2Score = getBestGross(t2InGroup);
                    matchPairings.push({
                        type: 'ryder',
                        t1Players: t1InGroup.map(id => players.find(p => String(p.id) === String(id))?.name).filter(Boolean).join(' & '),
                        t2Players: t2InGroup.map(id => players.find(p => String(p.id) === String(id))?.name).filter(Boolean).join(' & '),
                        t1Score,
                        t2Score
                    });
                } else {
                    const allPlayerIds = ttPlayers.map(p => p.id);
                    const groupScore = getBestGross(allPlayerIds);
                    matchPairings.push({
                        type: 'standard',
                        players: ttPlayers.map(p => p.name).filter(Boolean).join(' & '),
                        score: groupScore
                    });
                }
            });

            scrambleRounds.push({
                roundNum,
                pairings: matchPairings
            });
        }
        return scrambleRounds;
    };

    const calculateRyderScores = () => {
        if (!hasRyderRound) return { matches: [], team1Points: 0, team2Points: 0, team1Name: 'Team 1', team2Name: 'Team 2' };

        const ryderMatches = [];
        let t1Total = 0;
        let t2Total = 0;

        const globalTeam1Ids = settings?.ryderCupConfig?.team1 || [];
        const globalTeam2Ids = settings?.ryderCupConfig?.team2 || [];
        const team1Name = settings?.ryderCupConfig?.team1Name || 'Team 1';
        const team2Name = settings?.ryderCupConfig?.team2Name || 'Team 2';

        const numRounds = settings?.numberOfRounds || 0;

        // Iterate through all rounds
        for (let roundNum = 1; roundNum <= numRounds; roundNum++) {
            const config = settings?.roundTimeConfig?.[roundNum] || {};
            const isRoundRyderCup = config.format === 'RyderCup' || config.format === 'MatchPlay';

            // If neither global nor this specific round is RyderCup, skip
            if (!isGlobalRyderCup && !isRoundRyderCup) continue;

            const team1Ids = isGlobalRyderCup ? globalTeam1Ids : (config.team1 || []);
            const team2Ids = isGlobalRyderCup ? globalTeam2Ids : (config.team2 || []);

            const roundTeeTimes = teeTimes.filter(tt => String(tt.round) === String(roundNum));
            const courseId = settings?.roundCourses?.[roundNum - 1];
            const course = displayCourses.find(c => String(c.id) === String(courseId));

            if (!course) continue;

            roundTeeTimes.forEach(tt => {
                const ttPlayers = tt.players || [];
                const t1MatchPlayerIds = ttPlayers.filter(p => team1Ids.some(id => String(id) === String(p.id))).map(p => p.id);
                const t2MatchPlayerIds = ttPlayers.filter(p => team2Ids.some(id => String(id) === String(p.id))).map(p => p.id);

                // If this tee time has no head-to-head match, skip it
                if (t1MatchPlayerIds.length === 0 || t2MatchPlayerIds.length === 0) return;

                // Match Status Calculation
                let t1HolesWon = 0;
                let t2HolesWon = 0;
                let holesPlayed = 0;
                const holeResults = [];

                for (let holeNum = 1; holeNum <= 18; holeNum++) {
                    const holeData = course?.holes?.find(h => h.number === holeNum);
                    const getBestNet = (playerIds) => {
                        let best = null;
                        playerIds.forEach(pid => {
                            const p = players.find(pl => String(pl.id) === String(pid));
                            const pScore = scores.find(s => String(s.playerId) === String(pid) && s.courseId === courseId && s.hole === holeNum && (s.round || 1) === roundNum);
                            if (!p || !pScore) return;

                            // Re-calculate course handicap for net comparison
                            let ch = Math.round(p.handicapIndex || 0);

                            // Prioritize modern courseData map
                            const cd = p.courseData?.[courseId] || {};
                            if (cd.hcp !== undefined) {
                                ch = cd.hcp;
                            } else {
                                // Legacy fallback
                                const cName = course.name.toLowerCase();
                                if (cName.includes('plantation')) ch = p.hcpPlantation || ch;
                                else if (cName.includes('river')) ch = p.hcpRiver || ch;
                                else if (cName.includes('royal') || cName.includes('rnk')) ch = p.hcpRNK || ch;
                            }

                            // --- NEW: Tee-Specific Hole Handicap ---
                            let si = holeData?.handicapIndex || 18;
                            if (cd.tee && course.tees) {
                                const selectedTee = course.tees.find(t => t.name === cd.tee);
                                if (selectedTee && selectedTee.handicaps) {
                                    const teeHoleHcp = selectedTee.handicaps.find(h => h.hole === holeNum);
                                    if (teeHoleHcp && teeHoleHcp.index) {
                                        si = parseInt(teeHoleHcp.index);
                                    }
                                }
                            }
                            // ----------------------------------------

                            const strokes = Math.floor(ch / 18) + (si <= (ch % 18) ? 1 : 0);
                            const net = pScore.score - strokes;
                            if (best === null || net < best) best = net;
                        });
                        return best;
                    };

                    const t1Net = getBestNet(t1MatchPlayerIds);
                    const t2Net = getBestNet(t2MatchPlayerIds);

                    if (t1Net !== null && t2Net !== null) {
                        holesPlayed = holeNum;
                        let holeStatus = 'AS';
                        if (t1Net < t2Net) {
                            t1HolesWon++;
                            holeStatus = 'T1';
                        } else if (t2Net < t1Net) {
                            t2HolesWon++;
                            holeStatus = 'T2';
                        }
                        holeResults.push({ hole: holeNum, t1Net, t2Net, status: holeStatus });
                    }
                }

                const diff = t1HolesWon - t2HolesWon;
                const holesRemaining = 18 - holesPlayed;
                let status = "AS";

                if (diff > 0) {
                    if (diff > holesRemaining) {
                        status = `${diff} & ${holesRemaining}`;
                    } else {
                        status = `T1 UP ${diff}`;
                    }
                } else if (diff < 0) {
                    const absDiff = Math.abs(diff);
                    if (absDiff > holesRemaining) {
                        status = `${absDiff} & ${holesRemaining}`;
                    } else {
                        status = `T2 UP ${absDiff}`;
                    }
                }

                let t1MatchPoints = 0;
                let t2MatchPoints = 0;

                if (holesPlayed > 0) {
                    if (diff > holesRemaining || (holesPlayed === 18 && diff > 0)) {
                        t1MatchPoints = 1; t2MatchPoints = 0;
                    } else if (Math.abs(diff) > holesRemaining || (holesPlayed === 18 && diff < 0)) {
                        t1MatchPoints = 0; t2MatchPoints = 1;
                    } else if (holesPlayed === 18 && diff === 0) {
                        t1MatchPoints = 0.5; t2MatchPoints = 0.5;
                    }
                    t1Total += t1MatchPoints;
                    t2Total += t2MatchPoints;
                }

                ryderMatches.push({
                    tt,
                    roundNum,
                    t1Players: t1MatchPlayerIds.map(id => players.find(p => String(p.id) === String(id))?.name || 'Unknown').join(' & '),
                    t2Players: t2MatchPlayerIds.map(id => players.find(p => String(p.id) === String(id))?.name || 'Unknown').join(' & '),
                    status,
                    holesPlayed,
                    holeResults,
                    t1MatchPoints,
                    t2MatchPoints
                });
            });
        } // end round loop

        return { matches: ryderMatches, team1Points: t1Total, team2Points: t2Total, team1Name, team2Name };
    };

    const ryderData = calculateRyderScores();
    const scrambleData = calculateScrambleScores();

    useEffect(() => {
        if (settings && !loading) {
            const hasStableford = Object.values(settings.roundTimeConfig || {}).some(cfg => cfg.format === 'Stableford');
            const hasRyder = settings.ryderCupConfig?.enabled || Object.values(settings.roundTimeConfig || {}).some(cfg => cfg.format === 'RyderCup' || cfg.format === 'MatchPlay');
            const hasScramble = Object.values(settings.roundTimeConfig || {}).some(cfg => cfg.format === 'Scramble');

            if (viewMode === 'points' && !hasStableford) {
                if (hasRyder) setViewMode('ryder');
                else if (hasScramble) setViewMode('scramble');
                else setViewMode('strokes');
            }
        }
    }, [settings, loading]);

    useEffect(() => {
        fetchData();
        // Poll scores-only every 30s (static data never changes mid-round)
        const interval = setInterval(fetchScores, 30000);
        return () => clearInterval(interval);
    }, [tournamentId]); // ← removed viewMode: viewMode switching should NOT restart the interval


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
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <img src="/images/leaderboard-icon.png" alt="Leaderboard" width={150} height={150} style={{ height: '150px', width: 'auto', borderRadius: 'var(--radius)', boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
                    <h1 className="section-title" style={{ margin: 0 }}>Tournament Leaderboard</h1>
                    <button
                        onClick={() => {
                            const url = window.location.href;
                            if (navigator.share) {
                                navigator.share({
                                    title: 'Live Leaderboard',
                                    text: 'Follow the live golf tournament leaderboard!',
                                    url: url,
                                }).catch(console.error);
                            } else {
                                navigator.clipboard.writeText(url);
                                alert('Leaderboard link copied to clipboard!');
                            }
                        }}
                        className="btn-outline"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '8px 16px', fontSize: '0.9rem' }}
                    >
                        <Share2 size={16} /> Share Public Link
                    </button>
                </div>

                <div style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', overflow: 'hidden', width: 'fit-content' }}>
                    {hasStablefordRound && (
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
                    )}
                    <button
                        onClick={() => setViewMode('strokes')}
                        style={{
                            padding: '8px 16px',
                            background: viewMode === 'strokes' ? 'var(--accent)' : 'transparent',
                            color: viewMode === 'strokes' ? '#000' : 'var(--text-muted)',
                            border: 'none',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            borderLeft: hasStablefordRound ? '1px solid var(--glass-border)' : 'none',
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
                            cursor: 'pointer',
                            borderLeft: '1px solid var(--glass-border)'
                        }}
                    >
                        Net
                    </button>
                    {hasRyderRound && (
                        <button
                            onClick={() => setViewMode('ryder')}
                            style={{
                                padding: '8px 16px',
                                background: viewMode === 'ryder' ? 'var(--accent)' : 'transparent',
                                color: viewMode === 'ryder' ? '#000' : 'var(--text-muted)',
                                border: 'none',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                borderLeft: '1px solid var(--glass-border)'
                            }}
                        >
                            🏆 Ryder Cup
                        </button>
                    )}
                    {hasScrambleRound && (
                        <button
                            onClick={() => setViewMode('scramble')}
                            style={{
                                padding: '8px 16px',
                                background: viewMode === 'scramble' ? 'var(--accent)' : 'transparent',
                                color: viewMode === 'scramble' ? '#000' : 'var(--text-muted)',
                                border: 'none',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                borderLeft: '1px solid var(--glass-border)'
                            }}
                        >
                            🌪️ Scramble
                        </button>
                    )}
                </div>
            </div>

            {viewMode === 'ryder' ? (
                <div className="fade-in">
                    {/* Team Scoreboard Header */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                        <div className="card" style={{ flex: 1, textAlign: 'center', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{ryderData.team1Name || 'TEAM 1'}</div>
                            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#3b82f6' }}>{ryderData.team1Points}</div>
                        </div>
                        <div className="card" style={{ flex: 1, textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{ryderData.team2Name || 'TEAM 2'}</div>
                            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#ef4444' }}>{ryderData.team2Points}</div>
                        </div>
                    </div>

                    {/* Match List */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="leaderboard-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'var(--primary)', color: '#fff' }}>
                                        <th style={{ textAlign: 'left', padding: '12px' }}>Round</th>
                                        <th style={{ textAlign: 'left', padding: '12px' }}>Match</th>
                                        <th style={{ textAlign: 'center', padding: '12px' }}>Status</th>
                                        <th style={{ textAlign: 'right', padding: '12px' }}>Points</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ryderData.matches.map((m, i) => {
                                        const isExpanded = expandedMatch === i;
                                        return (
                                            <React.Fragment key={i}>
                                                <tr
                                                    onClick={() => setExpandedMatch(isExpanded ? null : i)}
                                                    style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent' }}
                                                >
                                                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>R{m.roundNum}</td>
                                                    <td style={{ padding: '12px' }}>
                                                        <div style={{ fontWeight: 'bold', color: '#3b82f6' }}>{m.t1Players}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0' }}>vs</div>
                                                        <div style={{ fontWeight: 'bold', color: '#ef4444' }}>{m.t2Players}</div>
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                                        <span style={{
                                                            color: m.status.includes('T1') || m.status.includes('&') && m.t1MatchPoints > 0 ? '#3b82f6' :
                                                                (m.status.includes('T2') || m.status.includes('&') && m.t2MatchPoints > 0) ? '#ef4444' : 'var(--text-main)'
                                                        }}>
                                                            {m.status}
                                                        </span>
                                                        <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>through {m.holesPlayed}</div>
                                                        <div style={{ fontSize: '0.6rem', color: 'var(--accent)', marginTop: '4px' }}>{isExpanded ? '▴ Hide Details' : '▾ View Details'}</div>
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'right' }}>
                                                        <div style={{ color: m.t1MatchPoints > 0 ? '#3b82f6' : 'transparent', fontWeight: 'bold' }}>{m.t1MatchPoints}</div>
                                                        <div style={{ color: m.t2MatchPoints > 0 ? '#ef4444' : 'transparent', fontWeight: 'bold' }}>{m.t2MatchPoints}</div>
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan="4" style={{ padding: '0 0 1rem 0', background: 'rgba(0,0,0,0.2)' }}>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(18, 1fr)', gap: '2px', padding: '10px' }}>
                                                                {Array.from({ length: 18 }, (_, hi) => {
                                                                    const holeNum = hi + 1;
                                                                    const res = m.holeResults.find(hr => hr.hole === holeNum);
                                                                    let bgColor = 'rgba(255,255,255,0.05)';
                                                                    let label = holeNum;
                                                                    if (res) {
                                                                        if (res.status === 'T1') bgColor = '#3b82f6';
                                                                        else if (res.status === 'T2') bgColor = '#ef4444';
                                                                        else bgColor = 'rgba(255,255,255,0.2)';
                                                                    } else if (holeNum <= m.holesPlayed) {
                                                                        bgColor = 'rgba(255,255,255,0.1)'; // Played but AS maybe?
                                                                    }
                                                                    return (
                                                                        <div key={holeNum} style={{
                                                                            aspectRatio: '1/1',
                                                                            background: bgColor,
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            fontSize: '0.6rem',
                                                                            borderRadius: '2px',
                                                                            color: res ? '#fff' : 'var(--text-muted)'
                                                                        }}>
                                                                            {holeNum}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                            <div style={{ padding: '0 10px', fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', background: '#3b82f6' }}></div> Team 1</div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', background: '#ef4444' }}></div> Team 2</div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', background: 'rgba(255,255,255,0.2)' }}></div> Halved</div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : viewMode === 'scramble' ? (
                <div className="fade-in">
                    {scrambleData.map((round) => (
                        <div key={round.roundNum} style={{ marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '1.5rem', color: 'var(--accent)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ background: 'var(--accent)', color: '#000', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 'bold' }}>
                                    {round.roundNum}
                                </div>
                                Scramble Results
                            </h2>
                            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="leaderboard-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: 'var(--primary)', color: '#fff' }}>
                                                <th style={{ textAlign: 'left', padding: '12px' }}>Pairing</th>
                                                <th style={{ textAlign: 'center', padding: '12px' }}>Thru</th>
                                                <th style={{ textAlign: 'right', padding: '12px' }}>Score</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {round.pairings.map((p, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                    <td style={{ padding: '12px' }}>
                                                        {p.type === 'ryder' ? (
                                                            <div style={{ display: 'grid', gap: '8px' }}>
                                                                <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid #3b82f6', borderRadius: '4px' }}>
                                                                    <div style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 'bold', textTransform: 'uppercase' }}>{settings?.ryderCupConfig?.team1Name || 'Team 1'}</div>
                                                                    <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{p.t1Players}</div>
                                                                    {p.t1Score && <div style={{ fontSize: '1.1rem', color: 'var(--accent)', marginTop: '4px' }}>{p.t1Score.total} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>thru {p.t1Score.thru === 18 ? 'F' : p.t1Score.thru}</span></div>}
                                                                </div>
                                                                <div style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', borderRadius: '4px' }}>
                                                                    <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 'bold', textTransform: 'uppercase' }}>{settings?.ryderCupConfig?.team2Name || 'Team 2'}</div>
                                                                    <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{p.t2Players}</div>
                                                                    {p.t2Score && <div style={{ fontSize: '1.1rem', color: 'var(--accent)', marginTop: '4px' }}>{p.t2Score.total} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>thru {p.t2Score.thru === 18 ? 'F' : p.t2Score.thru}</span></div>}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{p.players}</div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                        {p.type === 'standard' ? (p.score?.thru === 18 ? 'F' : p.score?.thru || '--') : 'Match'}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent)' }}>
                                                        {p.type === 'standard' ? (p.score?.total || '--') : '--'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="hide-on-desktop" style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                        👆 Tap a player to view round-by-round details
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="leaderboard-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--primary)', color: '#fff' }}>
                                    <th style={{ textAlign: 'left', padding: '10px' }}>Pos</th>
                                    <th style={{ textAlign: 'left', padding: '10px' }}>Player</th>
                                    <th style={{ textAlign: 'center', padding: '10px' }}>Thru</th>
                                    {displayCourses.map((c, i) => (
                                        <th key={`${c.id}-${i}`} className="hide-on-mobile" style={{ textAlign: 'center', padding: '10px' }}>
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
                                        <td style={{ fontWeight: 'bold', padding: '10px' }}>
                                            {(() => {
                                                const total = viewMode === 'points' ? p.totalPoints : (viewMode === 'strokes' ? p.totalGross : p.totalNet);
                                                return total !== null ? idx + 1 : '-';
                                            })()}
                                        </td>
                                        <td style={{ fontWeight: 'bold', padding: '10px' }}>
                                            {(() => {
                                                const total = viewMode === 'points' ? p.totalPoints : (viewMode === 'strokes' ? p.totalGross : p.totalNet);
                                                return total !== null && idx === 0 ? '👑 ' : '';
                                            })()}{p.name}
                                        </td>
                                        <td style={{ textAlign: 'center', padding: '10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            {(() => {
                                                const roundsWithData = displayCourses.map(c => p.rounds[`${c.id}_${c.roundNum}`]).filter(r => r && r.holes > 0);
                                                if (roundsWithData.length === 0) return '--';
                                                const latestRound = roundsWithData[roundsWithData.length - 1];
                                                return latestRound.holes === 18 ? 'F' : latestRound.holes;
                                            })()}
                                        </td>

                                        {displayCourses.map((c, i) => {
                                            const r = p.rounds[`${c.id}_${c.roundNum}`];
                                            return (
                                                <td key={c.id} className="hide-on-mobile" style={{ textAlign: 'center', fontSize: '0.95rem', padding: '10px' }}>
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
                </div>
            )}
            {players.length === 0 && !loading && (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No players registered yet. Contact the admin to setup this page in the settings.
                </div>
            )}
        </div>
    );
}
