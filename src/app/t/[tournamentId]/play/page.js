"use client";

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Save, Trophy, KeyRound, Loader2, AlertCircle } from 'lucide-react';
import SponsorRotation from '@/components/SponsorRotation';

export default function PlayPage() {
    const { data: session, status } = useSession();
    const { tournamentId } = useParams();
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
    const [teeTimes, setTeeTimes] = useState([]);

    // PPID Access States
    const [hasPPIDAccess, setHasPPIDAccess] = useState(false);
    const [ppidInput, setPpidInput] = useState('');
    const [ppidVerifying, setPpidVerifying] = useState(false);
    const [ppidError, setPpidError] = useState('');
    
    // Offline Sync States
    const [pendingScoresCount, setPendingScoresCount] = useState(0);
    const [syncingOffline, setSyncingOffline] = useState(false);
    const [syncSuccessMessage, setSyncSuccessMessage] = useState('');

    const syncOfflineScores = async () => {
        if (typeof window === 'undefined') return;
        const queueStr = localStorage.getItem('pinplaced_score_queue');
        if (!queueStr) return;
        
        let queue = [];
        try {
            queue = JSON.parse(queueStr);
        } catch (e) {
            console.error("Failed to parse score queue:", e);
            return;
        }

        if (queue.length === 0) return;

        setSyncingOffline(true);
        let successfullySyncedCount = 0;
        const remainingQueue = [...queue];

        const currentPpid = settings?.ppid || (typeof window !== 'undefined' ? (localStorage.getItem(`pinplaced_ppid_${tournamentId}`) || '') : '');

        for (const item of queue) {
            try {
                const res = await fetch('/api/scores', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        playerId: item.playerId,
                        courseId: item.courseId,
                        hole: item.hole,
                        score: item.score,
                        round: item.round,
                        ppid: item.ppid || currentPpid
                    })
                });

                if (res.ok || res.status === 400) {
                    successfullySyncedCount++;
                    const idx = remainingQueue.findIndex(q => q.id === item.id);
                    if (idx !== -1) remainingQueue.splice(idx, 1);
                } else {
                    break;
                }
            } catch (error) {
                console.error("Failed to sync score item:", error);
                break;
            }
        }

        localStorage.setItem('pinplaced_score_queue', JSON.stringify(remainingQueue));
        setPendingScoresCount(remainingQueue.length);
        setSyncingOffline(false);

        if (successfullySyncedCount > 0 && remainingQueue.length === 0) {
            setSyncSuccessMessage('✓ All offline scores synced successfully!');
            setTimeout(() => setSyncSuccessMessage(''), 3000);
        }
    };

    // Watch offline status & setup sync intervals
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const queueStr = localStorage.getItem('pinplaced_score_queue');
            if (queueStr) {
                try {
                    const queue = JSON.parse(queueStr);
                    setPendingScoresCount(queue.length);
                } catch (e) {}
            }
            
            syncOfflineScores();

            window.addEventListener('online', syncOfflineScores);
            const interval = setInterval(syncOfflineScores, 15000);

            return () => {
                window.removeEventListener('online', syncOfflineScores);
                clearInterval(interval);
            };
        }
    }, []);

    // Fetch initial data
    useEffect(() => {
        if (!tournamentId) return;
        const loadData = async () => {
            try {
                const [playersRes, coursesRes, settingsRes, teeTimesRes] = await Promise.all([
                    fetch(`/api/players?tournamentId=${tournamentId}`),
                    fetch(`/api/courses?tournamentId=${tournamentId}`),
                    fetch(`/api/settings?tournamentId=${tournamentId}`),
                    fetch(`/api/schedule?tournamentId=${tournamentId}`)
                ]);

                if (playersRes.ok) setPlayers(await playersRes.json());
                if (coursesRes.ok) {
                    const coursesData = await coursesRes.json();
                    coursesData.forEach(c => {
                        if (typeof c.holes === 'string') {
                            try { c.holes = JSON.parse(c.holes); } catch(e) { c.holes = []; }
                        }
                        if (typeof c.tees === 'string') {
                            try { c.tees = JSON.parse(c.tees); } catch(e) { c.tees = []; }
                        }
                    });
                    setCourses(coursesData);
                }
                if (settingsRes.ok) setSettings(await settingsRes.json());
                if (teeTimesRes.ok) setTeeTimes(await teeTimesRes.json());

                // Try to recover selected player from localStorage (with migration for PinPlaced)
                const oldPlayerId = localStorage.getItem('golfApp_playerId');
                if (oldPlayerId) {
                    localStorage.setItem('pinplaced_playerId', oldPlayerId);
                    localStorage.removeItem('golfApp_playerId');
                }
                const savedPlayerId = localStorage.getItem('pinplaced_playerId');
                if (savedPlayerId) setSelectedPlayerId(savedPlayerId);

            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [tournamentId]);

    // Auto-select player based on session email
    useEffect(() => {
        if (session?.user?.email && players.length > 0) {
            const matchedPlayer = players.find(p => p.email === session.user.email);
            if (matchedPlayer) {
                console.log("Auto-linked player:", matchedPlayer.name);
                setSelectedPlayerId(matchedPlayer.id);
                // Also update localStorage to keep it in sync
                localStorage.setItem('pinplaced_playerId', matchedPlayer.id);
            }
        }
    }, [session, players]);

    // Check PPID access credentials (cookie, localStorage, or saved player in tournament)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const cookie = document.cookie || '';
        const hasAccessCookie =
            cookie.includes(`pinplaced_access_${tournamentId}=1`) ||
            (settings?.slug && cookie.includes(`pinplaced_access_${settings.slug}=1`)) ||
            (settings?.tournamentId && cookie.includes(`pinplaced_access_${settings.tournamentId}=1`)) ||
            (settings?.ppid && cookie.includes(`pinplaced_recent_ppid=${settings.ppid}`));

        const hasLocalPpid =
            !!localStorage.getItem(`pinplaced_ppid_${tournamentId}`) ||
            (settings?.tournamentId && !!localStorage.getItem(`pinplaced_ppid_${settings.tournamentId}`));

        const savedPlayer = localStorage.getItem('pinplaced_playerId');
        const hasSavedPlayerInTournament = savedPlayer && players.some(p => p.id === savedPlayer);

        if (hasAccessCookie || hasLocalPpid || hasSavedPlayerInTournament) {
            setHasPPIDAccess(true);
        }
    }, [tournamentId, settings, players]);

    const handleVerifyPPID = async (e) => {
        e?.preventDefault?.();
        const code = ppidInput.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
        if (!code) return;

        setPpidVerifying(true);
        setPpidError('');

        try {
            const res = await fetch('/api/tournaments/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ppid: code, tournamentId })
            });

            const data = await res.json();
            if (res.ok && data.tournament) {
                if (typeof window !== 'undefined') {
                    localStorage.setItem(`pinplaced_ppid_${data.tournament.id}`, code);
                    localStorage.setItem(`pinplaced_ppid_${tournamentId}`, code);
                }
                setHasPPIDAccess(true);
            } else {
                setPpidError(data.error || 'Tournament code not found. Please verify with your trip leader.');
            }
        } catch (err) {
            console.error('Verify PPID error:', err);
            setPpidError('Connection error. Please try again.');
        } finally {
            setPpidVerifying(false);
        }
    };

    // Handle URL Params for Round Selection
    const searchParams = useSearchParams();
    useEffect(() => {
        const roundParam = searchParams.get('round');
        if (roundParam) {
            const roundNum = parseInt(roundParam);
            if (!isNaN(roundNum) && roundNum > 0) {
                setSelectedRound(roundNum);
            }
        }
    }, [searchParams]);

    // Effect to update default score when changing hole/course
    useEffect(() => {
        const fetchCurrentScore = async () => {
            if (!selectedPlayerId || !currentCourse || !currentHole) return;

            try {
                const res = await fetch(`/api/scores?tournamentId=${settings?.tournamentId || ''}&courseId=${currentCourse.id}`);
                if (res.ok) {
                    const allScores = await res.json();
                    const existing = allScores.find(s =>
                        s.playerId === selectedPlayerId &&
                        s.hole === currentHole &&
                        (s.round || 1) === selectedRound
                    );
                    if (existing) {
                        setScore(existing.score);
                    } else if (currentHoleData) {
                        setScore(currentHoleData.par);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch score", e);
                if (currentHoleData) setScore(currentHoleData.par);
            }
        };

        if (currentCourse) {
            fetchCurrentScore();
            setCalculatedPoints(null);
            setMessage('');
        }
    }, [selectedRound, currentHole, selectedPlayerId, courses, settings]);

    // Helpers
    const getCourseForRound = (roundNum) => {
        if (!settings || !courses.length) return null;
        const courseId = settings.roundCourses?.[roundNum - 1]; // 0-indexed array vs 1-indexed round
        if (!courseId) return null;
        // courseId is a UUID string — do NOT parseInt it
        return courses.find(c => c.id === courseId || (typeof courseId === 'string' && c.name && c.name.trim().toLowerCase() === courseId.trim().toLowerCase()));
    };

    const currentCourse = getCourseForRound(selectedRound);
    
    // Calculate tee-specific hole data
    const currentHoleData = (() => {
        if (!currentCourse) return null;
        let holeData = currentCourse.holes?.find(h => h.number === currentHole) || { number: currentHole, par: 4, handicapIndex: 18 };
        
        const player = players.find(p => p.id === selectedPlayerId);
        if (player && currentCourse) {
            const pcd = typeof player.courseData === 'string' ? JSON.parse(player.courseData || '{}') : (player.courseData || {});
            const playerTeeName = pcd[currentCourse.id]?.tee;
            
            if (playerTeeName) {
                const selectedTee = currentCourse.tees?.find(t => t.name === playerTeeName);
                if (selectedTee?.handicaps) {
                    const teeHoleHcp = selectedTee.handicaps.find(h => h.hole === currentHole);
                    if (teeHoleHcp?.index) {
                        return { ...holeData, handicapIndex: teeHoleHcp.index };
                    }
                }
            }
        }
        return holeData;
    })();

    // Save Score
    const handleSaveScore = async () => {
        if (!selectedPlayerId || !currentCourse) return;

        setSaving(true);
        setMessage('');

        const currentPpid = settings?.ppid || (typeof window !== 'undefined' ? (localStorage.getItem(`pinplaced_ppid_${tournamentId}`) || '') : '');

        const payload = {
            playerId: selectedPlayerId,
            courseId: currentCourse.id,
            hole: currentHole,
            score: score,
            round: selectedRound,
            ppid: currentPpid
        };

        try {
            const res = await fetch('/api/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                setCalculatedPoints(data.stablefordPoints);
                setMessage('Score Saved!');

                setTimeout(() => {
                    const maxHoles = currentCourse?.holes?.length || 18;
                    if (currentHole < maxHoles) setCurrentHole(h => h + 1);
                }, 1000);
            } else {
                throw new Error("Failed to save score on server");
            }
        } catch (error) {
            console.warn("Save score failed, buffering locally:", error);
            
            // Read and push to offline queue
            const queueStr = localStorage.getItem('pinplaced_score_queue') || '[]';
            let queue = [];
            try {
                queue = JSON.parse(queueStr);
            } catch (e) {}

            const bufferedItem = {
                id: `${Date.now()}-${Math.random()}`,
                ...payload,
                timestamp: Date.now()
            };
            queue.push(bufferedItem);
            localStorage.setItem('pinplaced_score_queue', JSON.stringify(queue));
            setPendingScoresCount(queue.length);
            
            setCalculatedPoints(null);
            setMessage('Saved locally (offline)');

            setTimeout(() => {
                const maxHoles = currentCourse?.holes?.length || 18;
                if (currentHole < maxHoles) setCurrentHole(h => h + 1);
            }, 1000);
        } finally {
            setSaving(false);
        }
    };

    // Auth Guard
    if (status === 'loading' || loading) {
        return <div className="fade-in" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
    }

    if (settings && settings.isSetupComplete === false) {
        return (
            <div className="fade-in" style={{ padding: '2rem', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
                <h1 className="section-title">Setup Required</h1>
                <div className="card">
                    <p style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>The tournament is not ready for play yet.</p>
                    <div style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Please ensure the following are configured in Admin Settings:
                        <ul style={{ paddingLeft: '20px', marginTop: '0.5rem' }}>
                            <li>At least 1 player added</li>
                            <li>Tee times established</li>
                            <li>Courses assigned to rounds</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    if (!session && !settings?.publicScoring && !hasPPIDAccess) {
        return (
            <div className="fade-in" style={{ padding: '2rem 1rem', maxWidth: '440px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                        display: 'inline-flex',
                        padding: '12px',
                        background: 'rgba(212, 175, 55, 0.12)',
                        borderRadius: '50%',
                        color: 'var(--accent)',
                        marginBottom: '0.75rem',
                        border: '1px solid rgba(212, 175, 55, 0.3)'
                    }}>
                        <KeyRound size={32} />
                    </div>
                    <h1 className="section-title" style={{ margin: '0 0 0.5rem 0' }}>Live Scoring Access</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                        Enter your tournament&apos;s PPID (access code) to start scoring, or sign in with an account.
                    </p>
                </div>

                <div className="card" style={{ border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                    <form onSubmit={handleVerifyPPID}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '0.5rem' }}>
                            Tournament PPID
                        </label>
                        <input
                            type="text"
                            value={ppidInput}
                            onChange={(e) => setPpidInput(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 16))}
                            placeholder="e.g. PEBBLE26"
                            autoFocus
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: 'var(--radius)',
                                border: '1px solid var(--glass-border)',
                                background: 'var(--bg-dark)',
                                color: 'var(--accent)',
                                fontSize: '1.3rem',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                letterSpacing: '3px',
                                fontFamily: 'monospace',
                                textTransform: 'uppercase',
                                marginBottom: '1rem'
                            }}
                        />

                        {ppidError && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#ff6b6b',
                                fontSize: '0.85rem',
                                background: 'rgba(255, 107, 107, 0.1)',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 107, 107, 0.25)',
                                marginBottom: '1rem'
                            }}>
                                <AlertCircle size={16} />
                                <span>{ppidError}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!ppidInput.trim() || ppidVerifying}
                            className="btn"
                            style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 'bold' }}
                        >
                            {ppidVerifying ? <Loader2 size={18} className="animate-spin" /> : 'Unlock Live Scoring'}
                        </button>
                    </form>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        margin: '1.5rem 0',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem'
                    }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
                        <span>OR</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
                    </div>

                    <button
                        onClick={() => signIn()}
                        className="btn-outline"
                        style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }}
                    >
                        Sign In with Google / Apple
                    </button>
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
                                    setCurrentHole(1);
                                    localStorage.setItem('pinplaced_playerId', p.id);
                                    if (typeof document !== 'undefined') {
                                        document.cookie = `pinplaced_playerId=${p.id}; path=/; max-age=${30 * 24 * 60 * 60}`;
                                    }
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

            {/* Offline Sync Status Indicators */}
            {pendingScoresCount > 0 && (
                <div style={{
                    marginBottom: '1rem',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'rgba(212, 175, 55, 0.1)',
                    border: '1px solid var(--accent)',
                    color: 'var(--accent)',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    fontWeight: 'bold'
                }}>
                    ⚠️ {pendingScoresCount} score{pendingScoresCount > 1 ? 's' : ''} saved locally - syncing when back online
                </div>
            )}

            {syncSuccessMessage && (
                <div style={{
                    marginBottom: '1rem',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'rgba(74, 222, 128, 0.1)',
                    border: '1px solid #4ade80',
                    color: '#4ade80',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    fontWeight: 'bold'
                }}>
                    {syncSuccessMessage}
                </div>
            )}

            {/* Header / Player Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <button
                    onClick={() => {
                        setSelectedPlayerId('');
                        localStorage.removeItem('pinplaced_playerId');
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

            {/* Scramble Mode Banner */}
            {settings?.roundTimeConfig?.[selectedRound]?.format === 'Scramble' && (
                <div className="card" style={{
                    marginBottom: '1rem',
                    padding: '12px',
                    border: '1px solid var(--accent)',
                    background: 'rgba(212, 175, 55, 0.1)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>🌪️ SCRAMBLE TEAM MODE</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        Team: {(() => {
                            const roundConfig = settings?.roundTimeConfig?.[selectedRound] || {};
                            const tt = teeTimes.find(t => t.round === selectedRound && t.players.includes(selectedPlayerId));
                            if (!tt) return 'Team';

                            const isGlobalRyder = settings?.ryderCupConfig?.enabled;
                            const team1Ids = isGlobalRyder ? (settings.ryderCupConfig.team1 || []) : (roundConfig.team1 || []);
                            const team2Ids = isGlobalRyder ? (settings.ryderCupConfig.team2 || []) : (roundConfig.team2 || []);

                            let team = tt.players;
                            if (team1Ids.includes(selectedPlayerId)) team = tt.players.filter(pid => team1Ids.includes(pid));
                            else if (team2Ids.includes(selectedPlayerId)) team = tt.players.filter(pid => team2Ids.includes(pid));

                            return team.map(pid => players.find(p => p.id === pid)?.name).join(' & ');
                        })()}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>Score applies to all team members.</div>
                </div>
            )}

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
                                onClick={() => setCurrentHole(h => Math.min(currentCourse?.holes?.length || 18, h + 1))}
                                disabled={currentHole === (currentCourse?.holes?.length || 18)}
                                className="btn-icon"
                                style={{ opacity: currentHole === (currentCourse?.holes?.length || 18) ? 0.3 : 1 }}
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
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: 'var(--text-main)',
                                    fontSize: '3rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    userSelect: 'none'
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
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: 'rgba(212,175,55,0.2)',
                                    border: '1px solid var(--accent)',
                                    color: 'var(--accent)',
                                    fontSize: '3rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    userSelect: 'none'
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
                    {settings?.isPro && settings?.sponsorLogos && (
                        <SponsorRotation sponsorLogos={settings.sponsorLogos} />
                    )}
                </>
            ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No course found for this round. Contact the admin to setup this page in the settings.
                </div>
            )}
        </div>
    );
}
