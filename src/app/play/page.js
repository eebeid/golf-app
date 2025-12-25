"use client";

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Save, Trophy } from 'lucide-react';

export default function PlayPage() {
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(true);

    // Data
    const [players, setPlayers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [settings, setSettings] = useState(null);

    // State
    const [selectedPlayerId, setSelectedPlayerId] = useState('');
    const [selectedRound, setSelectedRound] = useState(1);
    const [currentHole, setCurrentHole] = useState(1);
    const [score, setScore] = useState(4); // Default to par usually, but 4 is safe default
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [calculatedPoints, setCalculatedPoints] = useState(null);

    // Fetch initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [playersRes, coursesRes, settingsRes] = await Promise.all([
                    fetch('/api/players'),
                    fetch('/api/courses'),
                    fetch('/api/settings')
                ]);

                if (playersRes.ok) setPlayers(await playersRes.json());
                if (coursesRes.ok) setCourses(await coursesRes.json());
                if (settingsRes.ok) setSettings(await settingsRes.json());

                // Try to recover selected player from localStorage
                const savedPlayerId = localStorage.getItem('golfApp_playerId');
                if (savedPlayerId) setSelectedPlayerId(savedPlayerId);

            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Effect to update default score when changing hole/course (set to par)
    useEffect(() => {
        if (currentCourse && currentHoleData) {
            setScore(currentHoleData.par);
            setCalculatedPoints(null); // Reset preview
            setMessage('');
        }
    }, [selectedRound, currentHole, courses, settings]); // Dependencies for when hole changes

    // Helpers
    const getCourseForRound = (roundNum) => {
        if (!settings || !courses.length) return null;
        const courseId = settings.roundCourses[roundNum - 1]; // 0-indexed array vs 1-indexed round
        return courses.find(c => c.id === parseInt(courseId));
    };

    const currentCourse = getCourseForRound(selectedRound);
    const currentHoleData = currentCourse?.holes?.find(h => h.number === currentHole);

    // Save Score
    const handleSaveScore = async () => {
        if (!selectedPlayerId || !currentCourse) return;

        setSaving(true);
        setMessage('');

        try {
            const res = await fetch('/api/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId: selectedPlayerId,
                    courseId: currentCourse.id,
                    hole: currentHole,
                    score: score
                })
            });

            if (res.ok) {
                const data = await res.json();
                setCalculatedPoints(data.stablefordPoints);
                setMessage('Score Saved!');

                // Optional: Auto-advance after short delay?
                // setTimeout(() => {
                //     if (currentHole < 18) setCurrentHole(h => h + 1);
                // }, 1000);
            } else {
                setMessage('Error saving score');
            }
        } catch (error) {
            console.error(error);
            setMessage('Error saving score');
        } finally {
            setSaving(false);
        }
    };

    // Auth Guard
    if (status === 'loading' || loading) {
        return <div className="fade-in" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
    }

    if (!session) {
        return (
            <div className="fade-in" style={{ padding: '2rem', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
                <h1 className="section-title">Live Scoring</h1>
                <div className="card">
                    <p style={{ marginBottom: '1.5rem' }}>Please sign in to keep score.</p>
                    <button onClick={() => signIn()} className="btn" style={{ width: '100%' }}>Sign In</button>
                </div>
            </div>
        );
    }

    // Player Selection View
    if (!selectedPlayerId) {
        return (
            <div className="fade-in" style={{ padding: '1rem', maxWidth: '500px', margin: '0 auto' }}>
                <h1 className="section-title">Who are you?</h1>
                <div className="card">
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {players.map(p => (
                            <button
                                key={p.id}
                                onClick={() => {
                                    setSelectedPlayerId(p.id);
                                    localStorage.setItem('golfApp_playerId', p.id);
                                }}
                                style={{
                                    padding: '1rem',
                                    background: 'var(--bg-dark)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: 'var(--radius)',
                                    color: 'var(--text-main)',
                                    textAlign: 'left',
                                    fontSize: '1.1rem',
                                    cursor: 'pointer'
                                }}
                            >
                                {p.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const player = players.find(p => p.id === selectedPlayerId);

    return (
        <div className="fade-in" style={{ padding: '1rem', maxWidth: '500px', margin: '0 auto', paddingBottom: '4rem' }}>

            {/* Header / Player Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <button
                    onClick={() => {
                        setSelectedPlayerId('');
                        localStorage.removeItem('golfApp_playerId');
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer' }}
                >
                    ← Change Player
                </button>
                <div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{player?.name}</div>
            </div>

            {/* Round Selection */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {settings && Array.from({ length: settings.numberOfRounds }).map((_, i) => {
                    const roundNum = i + 1;
                    const isActive = selectedRound === roundNum;
                    return (
                        <button
                            key={roundNum}
                            onClick={() => setSelectedRound(roundNum)}
                            style={{
                                flex: '1',
                                padding: '0.5rem',
                                borderRadius: '20px',
                                border: isActive ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
                                background: isActive ? 'var(--accent)' : 'transparent',
                                color: isActive ? '#000' : 'var(--text-muted)',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Round {roundNum}
                        </button>
                    );
                })}
            </div>

            {currentCourse ? (
                <>
                    <div className="card" style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{currentCourse.name}</h2>

                        {/* Hole Navigation */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.5rem 0' }}>
                            <button
                                onClick={() => setCurrentHole(h => Math.max(1, h - 1))}
                                disabled={currentHole === 1}
                                className="btn-icon"
                                style={{ opacity: currentHole === 1 ? 0.3 : 1 }}
                            >
                                <ChevronLeft size={32} />
                            </button>

                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: 1 }}>{currentHole}</div>
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

                        {/* Hole Info */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem', color: 'var(--text-muted)' }}>
                            <div>
                                <div style={{ fontSize: '0.8rem' }}>PAR</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{currentHoleData?.par}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem' }}>INDEX</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{currentHoleData?.handicapIndex}</div>
                            </div>
                            {/* Potential enhancement: Show strokes received here if we calculate it client-side */}
                        </div>

                        {/* Score Input */}
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
                            <button
                                onClick={() => setScore(s => Math.max(1, s - 1))}
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    color: 'var(--text-main)',
                                    fontSize: '2rem',
                                    cursor: 'pointer'
                                }}
                            >
                                -
                            </button>

                            <div style={{ textAlign: 'center', minWidth: '80px' }}>
                                <div style={{ fontSize: '4rem', fontWeight: 'bold', color: 'var(--accent)' }}>{score}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>STROKES</div>
                            </div>

                            <button
                                onClick={() => setScore(s => s + 1)}
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    color: 'var(--text-main)',
                                    fontSize: '2rem',
                                    cursor: 'pointer'
                                }}
                            >
                                +
                            </button>
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSaveScore}
                            disabled={saving}
                            className="btn"
                            style={{
                                width: '100%',
                                padding: '1rem',
                                fontSize: '1.2rem',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '0.5rem',
                                opacity: saving ? 0.7 : 1
                            }}
                        >
                            <Save size={20} />
                            {saving ? 'Saving...' : 'Save Score'}
                        </button>

                        {/* Feedback / Points Preview */}
                        <div style={{ marginTop: '1.5rem', height: '2rem' }}>
                            {message ? (
                                <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{message}</span>
                            ) : calculatedPoints !== null ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#4ade80' }}>
                                    <Trophy size={16} />
                                    <span>{calculatedPoints} Points</span>
                                </div>
                            ) : null}
                        </div>

                    </div>

                    {/* Navigation Help */}
                    <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Current Round: {new Date(settings.roundDates?.[selectedRound - 1]).toLocaleDateString() || 'N/A'}
                    </div>
                </>
            ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No course found for this round.
                </div>
            )}
        </div>
    );
}
