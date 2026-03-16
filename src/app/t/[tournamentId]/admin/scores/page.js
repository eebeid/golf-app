"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Save, Loader2, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Hash } from 'lucide-react';

export default function MobileScoreEntryPage({ params }) {
    const { tournamentId } = params;

    // Data
    const [players, setPlayers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [settings, setSettings] = useState(null);
    const [scores, setScores] = useState([]);
    const [teeTimes, setTeeTimes] = useState([]); // NEW
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const { data: session, status } = useSession();

    // Selection
    const [selectedPlayerId, setSelectedPlayerId] = useState('');
    const [selectedRound, setSelectedRound] = useState(1);

    // UI State
    const [currentHole, setCurrentHole] = useState(1); // 1-18
    const [currentScores, setCurrentScores] = useState(Array(18).fill(''));
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const inputRef = useRef(null);

    // Load Data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [pRes, cRes, sRes, scRes, tRes] = await Promise.all([
                    fetch(`/api/players?tournamentId=${tournamentId}`),
                    fetch(`/api/courses?tournamentId=${tournamentId}`),
                    fetch(`/api/settings?tournamentId=${tournamentId}`),
                    fetch(`/api/scores?tournamentId=${tournamentId}`),
                    fetch(`/api/schedule?tournamentId=${tournamentId}`) // NEW
                ]);

                if (pRes.ok) setPlayers(await pRes.json());
                if (cRes.ok) setCourses(await cRes.json());
                if (sRes.ok) {
                    const settingsData = await sRes.json();
                    if (settingsData?.showPlay === false && !settingsData?.isAdmin) {
                        window.location.href = `/t/${tournamentId}`;
                        return;
                    }
                    setSettings(settingsData);
                    setIsAdmin(!!settingsData?.isAdmin);
                }
                if (scRes.ok) setScores(await scRes.json());
                if (tRes.ok) setTeeTimes(await tRes.json()); // NEW
            } catch (e) {
                console.error("Failed to load", e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [tournamentId]);

    // Derived Logic
    const currentCourseId = settings?.roundCourses?.[selectedRound - 1];
    const currentCourse = courses.find(c => c.id === currentCourseId);

    // Sync Scores
    useEffect(() => {
        if (!selectedPlayerId || !currentCourseId) {
            setCurrentScores(Array(18).fill(''));
            return;
        }

        const playerScores = scores.filter(s =>
            s.playerId === selectedPlayerId &&
            s.courseId === currentCourseId
        );

        const newScores = Array(18).fill('');
        playerScores.forEach(s => {
            if (s.hole >= 1 && s.hole <= 18) {
                newScores[s.hole - 1] = s.score;
            }
        });
        setCurrentScores(newScores);
        setMessage('');

    }, [selectedPlayerId, selectedRound, currentCourseId, scores]);

    // Save Single Score for Current Hole
    const saveScore = async (holeNum, scoreVal) => {
        if (!selectedPlayerId || !currentCourse) return;

        // Optimistic update
        const newScores = [...currentScores];
        newScores[holeNum - 1] = scoreVal;
        setCurrentScores(newScores);

        try {
            const res = await fetch('/api/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId: selectedPlayerId,
                    courseId: currentCourse.id,
                    hole: holeNum,
                    score: scoreVal,
                    round: selectedRound // Include round
                })
            });

            if (res.ok) {
                // Update local scores state to trigger UI updates (like Ryder status)
                setScores(prev => {
                    const filtered = prev.filter(s =>
                        !(s.playerId === selectedPlayerId &&
                            s.courseId === currentCourse.id &&
                            s.hole === holeNum &&
                            (s.round || 1) === selectedRound)
                    );
                    return [...filtered, {
                        playerId: selectedPlayerId,
                        courseId: currentCourse.id,
                        hole: holeNum,
                        score: scoreVal,
                        round: selectedRound
                    }];
                });

                // Auto-advance if not last hole
                if (holeNum < 18) {
                    setTimeout(() => setCurrentHole(h => h + 1), 200);
                }
            }
        } catch (e) {
            console.error("Failed to save score", e);
            setMessage("Error saving score");
        }
    };

    const getRyderMatchStatus = () => {
        if (!settings || !selectedPlayerId || !selectedRound || !currentCourse) return null;

        const isGlobalRyderCup = settings?.ryderCupConfig?.enabled;
        const config = settings?.roundTimeConfig?.[selectedRound];
        const isRoundRyderCup = config?.format === 'RyderCup';

        if (!isGlobalRyderCup && !isRoundRyderCup) return null;

        const team1Ids = isGlobalRyderCup ? (settings?.ryderCupConfig?.team1 || []) : (config?.team1 || []);
        const team2Ids = isGlobalRyderCup ? (settings?.ryderCupConfig?.team2 || []) : (config?.team2 || []);

        const team1Name = settings?.ryderCupConfig?.team1Name || 'TEAM 1';
        const team2Name = settings?.ryderCupConfig?.team2Name || 'TEAM 2';

        const tt = teeTimes.find(t => t.round === selectedRound && t.players.includes(selectedPlayerId));
        if (!tt) return null;

        const t1MatchPlayers = tt.players.filter(pid => team1Ids.includes(pid));
        const t2MatchPlayers = tt.players.filter(pid => team2Ids.includes(pid));

        let t1HolesWon = 0;
        let t2HolesWon = 0;
        let holesPlayed = 0;

        for (let h = 1; h <= 18; h++) {
            const hData = currentCourse.holes?.find(hd => hd.number === h);
            const si = hData?.handicapIndex || 18;

            const getBestNet = (pids) => {
                let best = null;
                pids.forEach(pid => {
                    const p = players.find(pl => pl.id === pid);
                    let hVal = null;
                    if (pid === selectedPlayerId) {
                        hVal = currentScores[h - 1];
                    } else {
                        const s = scores.find(sc => sc.playerId === pid && sc.courseId === currentCourse.id && sc.hole === h && (sc.round || 1) === selectedRound);
                        hVal = s?.score;
                    }

                    if (!p || !hVal) return;

                    let ch = Math.round(p.handicapIndex || 0);
                    const cName = currentCourse.name.toLowerCase();
                    if (cName.includes('plantation')) ch = p.hcpPlantation || ch;
                    else if (cName.includes('river')) ch = p.hcpRiver || ch;
                    else if (cName.includes('royal') || cName.includes('rnk')) ch = p.hcpRNK || ch;

                    const strokes = Math.floor(ch / 18) + (si <= (ch % 18) ? 1 : 0);
                    const net = hVal - strokes;
                    if (best === null || net < best) best = net;
                });
                return best;
            };

            const t1Net = getBestNet(t1MatchPlayers);
            const t2Net = getBestNet(t2MatchPlayers);

            if (t1Net !== null && t2Net !== null) {
                holesPlayed = h;
                if (t1Net < t2Net) t1HolesWon++;
                else if (t2Net < t1Net) t2HolesWon++;
            }
        }

        const diff = t1HolesWon - t2HolesWon;
        const holesRemaining = 18 - holesPlayed;
        let status = "ALL SQUARE";
        let color = "var(--text-main)";

        if (diff > 0) {
            status = diff > holesRemaining ? `${diff} & ${holesRemaining} (${team1Name} Win)` : `${team1Name} UP ${diff}`;
            color = "#3b82f6";
        } else if (diff < 0) {
            const abs = Math.abs(diff);
            status = abs > holesRemaining ? `${abs} & ${holesRemaining} (${team2Name} Win)` : `${team2Name} UP ${abs}`;
            color = "#ef4444";
        }

        return {
            status,
            color,
            t1: t1MatchPlayers.map(id => players.find(p => p.id === id)?.name).join(' & '),
            t2: t2MatchPlayers.map(id => players.find(p => p.id === id)?.name).join(' & ')
        };
    };

    const ryderStatus = getRyderMatchStatus();

    const handleQuickScore = (val) => {
        saveScore(currentHole, val);
    };

    const handleManualInput = (e) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val)) {
            const newScores = [...currentScores];
            newScores[currentHole - 1] = val;
            setCurrentScores(newScores);
        }
    };

    const handleBlur = () => {
        const val = currentScores[currentHole - 1];
        if (val) saveScore(currentHole, val);
    };

    if (status === 'loading' || loading) return <div className="fade-in" style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="animate-spin" /> Loading...</div>;
    if (!isAdmin) {
        return (
            <div className="fade-in" style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
                <h1 className="section-title">Access Denied</h1>
                <div className="card">
                    <p style={{ marginBottom: '1.5rem' }}>You do not have permission to manage scores.</p>
                    <Link href={`/t/${tournamentId}`} className="btn" style={{ width: '100%' }}>Return to Tournament</Link>
                </div>
            </div>
        );
    }

    if (players.length === 0) {
        return (
            <div className="fade-in" style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 1rem', textAlign: 'center' }}>
                <div className="card" style={{ padding: '3rem 2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏌️</div>
                    <h2 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>No Players Yet</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
                        You need to add players before you can enter scores.<br />
                        Head to the <strong style={{ color: 'var(--text-main)' }}>Players</strong> page to register your group.
                    </p>
                    <a
                        href={`/t/${tournamentId}/players`}
                        className="btn"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                    >
                        Go to Players →
                    </a>
                </div>
            </div>
        );
    }

    const rounds = Array.from({ length: settings?.numberOfRounds || 1 }, (_, i) => i + 1);
    const par = currentCourse?.holes?.find(h => h.number === currentHole)?.par || '-';
    const index = currentCourse?.holes?.find(h => h.number === currentHole)?.handicapIndex || '-';
    const currentScore = currentScores[currentHole - 1];

    // Quick Buttons Grid
    const buttons = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    return (
        <div className="fade-in" style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '2rem', height: '100vh', display: 'flex', flexDirection: 'column' }}>

            {/* Header / Selectors */}
            <div style={{ padding: '1rem', background: 'var(--bg-dark)', borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <select
                        value={selectedRound}
                        onChange={e => setSelectedRound(parseInt(e.target.value))}
                        style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius)', background: '#000', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}
                    >
                        {rounds.map(r => {
                            const courseId = settings?.roundCourses?.[r - 1];
                            const courseName = courses.find(c => c.id === courseId)?.name;
                            return (
                                <option key={r} value={r}>
                                    Round {r}{courseName ? ` — ${courseName}` : ''}
                                </option>
                            );
                        })}
                    </select>
                    <select
                        value={selectedPlayerId}
                        onChange={e => setSelectedPlayerId(e.target.value)}
                        style={{ flex: 2, padding: '10px', borderRadius: 'var(--radius)', background: '#000', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}
                    >
                        <option value="">Select Player</option>
                        {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            </div>

            {selectedPlayerId && currentCourse ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1rem' }}>

                    {/* Ryder Match Status Widget */}
                    {ryderStatus && (
                        <div className="card" style={{
                            marginBottom: '1rem',
                            padding: '12px',
                            border: `1px solid ${ryderStatus.color}44`,
                            background: `${ryderStatus.color}11`,
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>RYDER CUP MATCH STATUS</div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: ryderStatus.color }}>
                                {ryderStatus.status}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                {ryderStatus.t1} vs {ryderStatus.t2}
                            </div>
                        </div>
                    )}

                    {/* Hole Info & Navigation */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <button
                            onClick={() => setCurrentHole(h => Math.max(1, h - 1))}
                            disabled={currentHole === 1}
                            className="btn-icon"
                            style={{ opacity: currentHole === 1 ? 0.3 : 1 }}
                        >
                            <ChevronLeft size={32} />
                        </button>

                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '3.5rem', fontWeight: 'bold', lineHeight: 1 }}>{currentHole}</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>HOLE</div>
                        </div>

                        <button
                            onClick={() => setCurrentHole(h => Math.min(18, h + 1))}
                            disabled={currentHole === 18}
                            className="btn-icon"
                            style={{ opacity: currentHole === 18 ? 0.3 : 1 }}
                        >
                            <ChevronRight size={32} />
                        </button>
                    </div>

                    {/* Special hole banners */}
                    {(() => {
                        const ctp = (settings?.closestToPin || []).filter(e => e.courseId === currentCourse?.id && e.hole === currentHole);
                        const ld = (settings?.longDrive || []).filter(e => e.courseId === currentCourse?.id && e.hole === currentHole);
                        if (ctp.length === 0 && ld.length === 0) return null;
                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                                {ctp.length > 0 && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.1))',
                                        border: '2px solid var(--accent)',
                                        borderRadius: 'var(--radius)',
                                        padding: '0.9rem 1.2rem',
                                        textAlign: 'center',
                                        animation: 'pulse 2s infinite'
                                    }}>
                                        <div style={{ fontSize: '1.8rem', lineHeight: 1 }}>📍</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent)', marginTop: '0.25rem' }}>
                                            CLOSEST TO PIN
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                            This is a Closest to Pin hole!
                                        </div>
                                    </div>
                                )}
                                {ld.length > 0 && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(99,102,241,0.1))',
                                        border: '2px solid #818cf8',
                                        borderRadius: 'var(--radius)',
                                        padding: '0.9rem 1.2rem',
                                        textAlign: 'center',
                                        animation: 'pulse 2s infinite'
                                    }}>
                                        <div style={{ fontSize: '1.8rem', lineHeight: 1 }}>💥</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#818cf8', marginTop: '0.25rem' }}>
                                            LONG DRIVE
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                            This is a Long Drive hole!
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '2rem', textAlign: 'center' }}>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PAR</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{par}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>INDEX</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{index}</div>
                        </div>

                        {(() => {
                            // Calculate Strokes
                            const player = players.find(p => p.id === selectedPlayerId);
                            let courseHcp = 0;
                            const courseName = currentCourse?.name?.toLowerCase() || '';

                            if (courseName.includes('plantation')) courseHcp = player?.hcpPlantation || 0;
                            else if (courseName.includes('river')) courseHcp = player?.hcpRiver || 0;
                            else if (courseName.includes('royal') || courseName.includes('rnk')) courseHcp = player?.hcpRNK || 0;

                            // Distribute strokes
                            // Standard allocation: 1 stroke for SI 1..CH.
                            // If CH > 18: 2 strokes for SI 1..(CH-18), etc.
                            const si = parseInt(index);
                            let strokesRec = 0;
                            if (!isNaN(si)) {
                                const base = Math.floor(courseHcp / 18);
                                const remainder = courseHcp % 18;
                                strokesRec = base + (si <= remainder ? 1 : 0);
                            }

                            // Calculate NET
                            const gross = parseInt(currentScore);
                            const net = !isNaN(gross) ? gross - strokesRec : null;

                            // Calculate Points (Stableford)
                            let points = null;
                            const parVal = parseInt(par);
                            if (net !== null && !isNaN(parVal)) {
                                points = Math.max(0, parVal + 2 - net);
                            }

                            return (
                                <>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>NET {strokesRec > 0 && <span style={{ color: 'var(--accent)' }}>*</span>}</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                                            {net !== null ? net : '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PTS</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                                            {points !== null ? points : '-'}
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>

                    {/* Current Score Display / Custom Input */}
                    <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '5px' }}>SCORE</div>
                        <input
                            ref={inputRef}
                            type="number"
                            inputMode="numeric"
                            value={currentScore}
                            onChange={handleManualInput}
                            onBlur={handleBlur}
                            placeholder="-"
                            style={{
                                fontSize: '3rem',
                                width: '120px',
                                textAlign: 'center',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: '2px solid var(--accent)',
                                color: 'var(--accent)',
                                fontWeight: 'bold',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Numeric Keypad */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                        {buttons.map(val => (
                            <button
                                key={val}
                                onClick={() => handleQuickScore(val)}
                                style={{
                                    height: '60px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--glass-border)',
                                    background: currentScore === val ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                    color: currentScore === val ? '#000' : 'var(--text-main)',
                                    fontSize: '1.5rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {val}
                            </button>
                        ))}
                    </div>

                    {/* Manual Entry Helper */}
                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <button
                            onClick={() => inputRef.current?.focus()}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '100%' }}
                        >
                            <Hash size={16} /> Tap score above for &gt; 10
                        </button>
                    </div>

                </div>
            ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    Select a player to start scoring.
                </div>
            )}
        </div>
    );
}
