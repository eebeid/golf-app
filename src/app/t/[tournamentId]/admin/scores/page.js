"use client";

import { useState, useEffect, useRef } from 'react';
import { Save, Loader2, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Hash } from 'lucide-react';

export default function MobileScoreEntryPage({ params }) {
    const { tournamentId } = params;

    // Data
    const [players, setPlayers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [settings, setSettings] = useState(null);
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);

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
                const [pRes, cRes, sRes, scRes] = await Promise.all([
                    fetch(`/api/players?tournamentId=${tournamentId}`),
                    fetch(`/api/courses?tournamentId=${tournamentId}`),
                    fetch(`/api/settings?tournamentId=${tournamentId}`),
                    fetch(`/api/scores?tournamentId=${tournamentId}`)
                ]);

                if (pRes.ok) setPlayers(await pRes.json());
                if (cRes.ok) setCourses(await cRes.json());
                if (sRes.ok) setSettings(await sRes.json());
                if (scRes.ok) setScores(await scRes.json());
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
                    score: scoreVal
                })
            });

            if (res.ok) {
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

    if (loading) return <div className="fade-in" style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="animate-spin" /> Loading...</div>;

    const rounds = Array.from({ length: settings?.numberOfRounds || 1 }, (_, i) => i + 1);
    const par = currentCourse?.holes?.find(h => h.number === currentHole)?.par || '-';
    const index = currentCourse?.holes?.find(h => h.number === currentHole)?.handicapIndex || '-';
    const currentScore = currentScores[currentHole - 1];

    // Quick Buttons Grid
    // 1-10
    const buttons = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Maybe custom layout?
    // Layout: 3-4-5 / 6-7-8? Or 1-5 / 6-10?

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
                        {rounds.map(r => <option key={r} value={r}>Round {r}</option>)}
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


                    {/* Stats & Handicap */}
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
