"use client";

import { useState, useEffect, use } from 'react';
import { useParams } from 'next/navigation';
import { Users, CheckCircle, ChevronLeft, ChevronRight, Save, Award, TrendingUp } from 'lucide-react';
import Link from 'next/link';

// Name formatter: "Tony Vye" → "Tony V."
const shortName = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
};

// Score display helpers
const SCORE_LABELS = {
    '-3': { label: 'Albatross', emoji: '🦅🦅', color: '#FFD700' },
    '-2': { label: 'Eagle', emoji: '🦅', color: '#FFD700' },
    '-1': { label: 'Birdie', emoji: '🐦', color: '#4CAF50' },
    '0':  { label: 'Par', emoji: '', color: '#2196F3' },
    '1':  { label: 'Bogey', emoji: '', color: '#FF9800' },
    '2':  { label: 'Double', emoji: '', color: '#f44336' },
};

function getScoreStyle(score, par) {
    if (!score) return {};
    const diff = score - par;
    if (diff <= -2) return { background: '#FFD700', color: '#000', borderRadius: '50%', fontWeight: 'bold' };
    if (diff === -1) return { background: '#4CAF50', color: '#fff', borderRadius: '50%', fontWeight: 'bold' };
    if (diff === 0)  return { background: '#2196F3', color: '#fff', borderRadius: '4px' };
    if (diff === 1)  return { background: 'rgba(255,152,0,0.2)', color: '#FF9800', border: '1px solid #FF9800', borderRadius: '4px' };
    if (diff >= 2)   return { background: 'rgba(244,67,54,0.2)', color: '#f44336', border: '1px solid #f44336', borderRadius: '4px' };
    return {};
}

export default function GroupScorePage({ params }) {
    const { tournamentId, id: courseId } = use(params);
    const basePath = `/t/${tournamentId}`;

    // Step 1: Setup - pick round & tee time group
    // Step 2: Scorecard entry
    const [step, setStep] = useState(1);

    const [teeTimes, setTeeTimes] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]);
    const [course, setCourse] = useState(null);
    const [settings, setSettings] = useState(null);

    const [selectedRound, setSelectedRound] = useState('');
    const [selectedTeeTimeId, setSelectedTeeTimeId] = useState('');

    // groupPlayers: array of player objects in the selected tee time
    const [groupPlayers, setGroupPlayers] = useState([]);

    // scores: { [playerId]: { [hole]: score } }
    const [scores, setScores] = useState({});

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    // Fetch initial data
    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const [teaRes, playersRes, courseRes, settingsRes] = await Promise.all([
                    fetch(`/api/schedule?tournamentId=${tournamentId}`),
                    fetch(`/api/players?tournamentId=${tournamentId}`),
                    fetch(`/api/courses/${courseId}`),
                    fetch(`/api/settings?tournamentId=${tournamentId}`),
                ]);

                const [tea, players, courseData, settingsData] = await Promise.all([
                    teaRes.ok ? teaRes.json() : [],
                    playersRes.ok ? playersRes.json() : [],
                    courseRes.ok ? courseRes.json() : null,
                    settingsRes.ok ? settingsRes.json() : null,
                ]);

                setTeeTimes(Array.isArray(tea) ? tea : []);
                setAllPlayers(Array.isArray(players) ? players : []);
                setCourse(courseData);
                setSettings(settingsData);
            } catch (e) {
                console.error(e);
                setError('Failed to load data. Please refresh.');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [tournamentId, courseId]);

    // Filter tee times for selected round
    const roundOptions = [...new Set(teeTimes.map(t => t.round))].sort((a, b) => a - b);
    const filteredTimes = teeTimes.filter(t => String(t.round) === String(selectedRound));

    // When tee time changes, resolve group players
    useEffect(() => {
        if (!selectedTeeTimeId) {
            setGroupPlayers([]);
            return;
        }
        const teeTime = teeTimes.find(t => t.id === selectedTeeTimeId);
        if (!teeTime) return;

        const rawPlayers = Array.isArray(teeTime.players) ? teeTime.players : [];
        // Players may be stored as plain IDs (string) OR as {id, name} objects
        const resolved = rawPlayers
            .map(entry => {
                const id = typeof entry === 'object' ? entry?.id : entry;
                return allPlayers.find(p => p.id === id) || (typeof entry === 'object' ? entry : null);
            })
            .filter(Boolean);
        setGroupPlayers(resolved);

        // Pre-populate empty scores map
        const initial = {};
        resolved.forEach(p => { initial[p.id] = {}; });
        setScores(initial);
    }, [selectedTeeTimeId, teeTimes, allPlayers]);

    // Load existing scores when we move to step 2
    useEffect(() => {
        if (step !== 2 || groupPlayers.length === 0 || !courseId || !selectedRound) return;

        async function loadExistingScores() {
            try {
                const res = await fetch(`/api/scores?courseId=${courseId}`);
                if (!res.ok) return;
                const allScores = await res.json();

                const roundNum = parseInt(selectedRound);
                const updated = { ...scores };
                groupPlayers.forEach(p => {
                    const playerScores = allScores.filter(
                        s => s.playerId === p.id && s.round === roundNum
                    );
                    const map = {};
                    playerScores.forEach(s => { map[s.hole] = s.score; });
                    updated[p.id] = map;
                });
                setScores(updated);
            } catch (e) {
                console.error('Error loading existing scores', e);
            }
        }
        loadExistingScores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

    const handleScoreChange = (playerId, hole, value) => {
        setScores(prev => ({
            ...prev,
            [playerId]: {
                ...prev[playerId],
                [hole]: value === '' ? '' : parseInt(value),
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSaved(false);

        try {
            const promises = [];
            groupPlayers.forEach(player => {
                const playerScores = scores[player.id] || {};
                Object.entries(playerScores).forEach(([hole, score]) => {
                    if (!score && score !== 0) return;
                    promises.push(
                        fetch('/api/scores', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                playerId: player.id,
                                hole: parseInt(hole),
                                score: parseInt(score),
                                courseId,
                                round: parseInt(selectedRound),
                            }),
                        })
                    );
                });
            });

            const results = await Promise.all(promises);
            const failed = results.filter(r => !r.ok);
            if (failed.length > 0) {
                setError(`${failed.length} score(s) failed to save. Please retry.`);
            } else {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (e) {
            console.error(e);
            setError('Error saving scores. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const holes = course?.holes || [];

    // Totals per player
    const getPlayerTotal = (playerId) => {
        const playerScores = scores[playerId] || {};
        return Object.values(playerScores).reduce((acc, s) => acc + (parseInt(s) || 0), 0);
    };

    const getPlayerToPar = (playerId) => {
        const playerScores = scores[playerId] || {};
        let toPar = 0;
        holes.forEach(h => {
            const s = playerScores[h.number];
            if (s) toPar += (parseInt(s) - h.par);
        });
        return toPar;
    };

    const formatToPar = (toPar) => {
        if (toPar === 0) return 'E';
        return toPar > 0 ? `+${toPar}` : `${toPar}`;
    };

    if (loading) {
        return (
            <div className="fade-in" style={{ textAlign: 'center', padding: '4rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⛳</div>
                <p style={{ color: 'var(--text-muted)' }}>Loading scorecard...</p>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 0.5rem 4rem' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', marginBottom: '1rem' }}>
                <Link 
                    href={`${basePath}/admin/scores`}
                    style={{ 
                        flex: 1, textAlign: 'center', padding: '12px', 
                        color: 'var(--text-muted)', textDecoration: 'none', 
                        borderBottom: '1px solid transparent'
                    }}
                >
                    Individual
                </Link>
                <Link 
                    href={`${basePath}/courses/${courseId}/group-score`}
                    style={{ 
                        flex: 1, textAlign: 'center', padding: '12px', 
                        background: 'rgba(212, 175, 55, 0.1)', color: 'var(--accent)',
                        fontWeight: 'bold', textDecoration: 'none', borderBottom: '2px solid var(--accent)'
                    }}
                >
                    Group
                </Link>
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Link href={`${basePath}/courses`} style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ChevronLeft size={18} /> Courses
                </Link>
            </div>

            <h1 className="section-title" style={{ marginBottom: '0.5rem' }}>
                <Users size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                Group Scorecard
            </h1>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <Link href={`/t/${tournamentId}/leaderboard`} className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={18} /> View Live Leaderboard
                </Link>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                {course?.name || 'Loading course...'} — Enter scores for your whole group
            </p>

            {/* Step Indicator */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
                {[{ n: 1, label: 'Select Group' }, { n: 2, label: 'Enter Scores' }].map(s => (
                    <div key={s.n} style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 1.25rem',
                        borderRadius: '999px',
                        background: step === s.n ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                        color: step === s.n ? '#000' : 'var(--text-muted)',
                        fontWeight: step === s.n ? 'bold' : 'normal',
                        fontSize: '0.9rem',
                        cursor: step > s.n ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                    }} onClick={() => step > s.n && setStep(s.n)}>
                        {step > s.n ? <CheckCircle size={16} /> : <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid currentColor', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>{s.n}</span>}
                        {s.label}
                    </div>
                ))}
            </div>

            {/* ── STEP 1: Select Group ── */}
            {step === 1 && (
                <div className="card" style={{ maxWidth: '520px', margin: '0 auto' }}>
                    <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent)' }}>Who are you scoring for?</h2>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Select Round
                        </label>
                        <select
                            value={selectedRound}
                            onChange={e => { setSelectedRound(e.target.value); setSelectedTeeTimeId(''); }}
                            style={{
                                width: '100%', padding: '12px',
                                borderRadius: 'var(--radius)',
                                background: 'var(--bg-dark)',
                                color: 'var(--text-main)',
                                border: '1px solid var(--glass-border)',
                                fontSize: '1rem',
                            }}
                        >
                            <option value="">-- Choose Round --</option>
                            {roundOptions.map(r => (
                                <option key={r} value={r}>Round {r}</option>
                            ))}
                        </select>
                    </div>

                    {selectedRound && (
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                Select Your Tee Time
                            </label>
                            {filteredTimes.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No tee times set up for Round {selectedRound}.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {filteredTimes.map(tt => {
                                        const groupNames = (Array.isArray(tt.players) ? tt.players : [])
                                            .map(entry => {
                                                if (typeof entry === 'object') return entry?.name || 'Unknown';
                                                return allPlayers.find(p => p.id === entry)?.name || entry;
                                            })
                                            .filter(Boolean);
                                        const isSelected = selectedTeeTimeId === tt.id;
                                        return (
                                            <div
                                                key={tt.id}
                                                onClick={() => setSelectedTeeTimeId(tt.id)}
                                                style={{
                                                    padding: '1rem 1.25rem',
                                                    borderRadius: 'var(--radius)',
                                                    border: isSelected ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
                                                    background: isSelected ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255,255,255,0.03)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s',
                                                }}
                                            >
                                                <div style={{ fontWeight: 'bold', color: 'var(--accent)', marginBottom: '0.25rem' }}>
                                                    🕐 {tt.time}
                                                </div>
                                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                                    {groupNames.join('  •  ') || 'No players assigned'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        className="btn"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        disabled={!selectedTeeTimeId || groupPlayers.length === 0}
                        onClick={() => setStep(2)}
                    >
                        Start Scoring <ChevronRight size={18} />
                    </button>

                    {groupPlayers.length > 0 && (
                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(212,175,55,0.08)', borderRadius: 'var(--radius)', border: '1px solid rgba(212,175,55,0.2)' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Scoring for:</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {groupPlayers.map(p => (
                                    <span key={p.id} style={{
                                        padding: '4px 12px', borderRadius: '999px',
                                        background: 'rgba(212,175,55,0.15)', color: 'var(--accent)',
                                        fontSize: '0.9rem', fontWeight: '500'
                                    }}>{p.name}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── STEP 2: Scorecard Entry ── */}
            {step === 2 && (
                <div>
                    {/* Player summary banner */}
                    <div style={{
                        display: 'flex', flexWrap: 'nowrap', overflowX: 'auto',
                        gap: '0.5rem',
                        marginBottom: '1rem', padding: '0.75rem 0.5rem',
                        background: 'var(--bg-card)', borderRadius: 'var(--radius)',
                        border: '1px solid var(--glass-border)'
                    }}>
                        {groupPlayers.map(p => {
                            const toPar = getPlayerToPar(p.id);
                            const total = getPlayerTotal(p.id);
                            return (
                                <div key={p.id} style={{
                                    flex: '1 1 80px', minWidth: '70px', padding: '0.5rem 0.4rem',
                                    background: 'rgba(255,255,255,0.04)',
                                    borderRadius: 'var(--radius)',
                                    textAlign: 'center',
                                    border: '1px solid var(--glass-border)'
                                }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '0.15rem', fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shortName(p.name)}</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: toPar < 0 ? '#4CAF50' : toPar > 0 ? '#FF9800' : '#2196F3' }}>
                                        {total > 0 ? formatToPar(toPar) : '—'}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        {total > 0 ? total : ''}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Scorecard Table */}
                    <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                        <table style={{
                            width: '100%', borderCollapse: 'collapse',
                            fontSize: '0.82rem', minWidth: `${Math.max(320, groupPlayers.length * 72 + 120)}px`
                        }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--accent)', background: 'rgba(212,175,55,0.05)' }}>
                                    <th style={{ padding: '0.4rem 0.3rem', textAlign: 'center', width: '32px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.75rem' }}>#</th>
                                    <th style={{ padding: '0.4rem 0.3rem', textAlign: 'center', width: '32px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.75rem' }}>Par</th>
                                    <th style={{ padding: '0.4rem 0.3rem', textAlign: 'center', width: '28px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.7rem' }}>HCP</th>
                                    {groupPlayers.map(p => (
                                        <th key={p.id} style={{ padding: '0.4rem 0.3rem', textAlign: 'center', color: 'var(--accent)', fontWeight: '700', minWidth: '64px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                            {shortName(p.name)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {holes.map((hole, idx) => {
                                    const isFront = hole.number <= 9;
                                    const isNinthRow = hole.number === 9;
                                    const isEighteenthRow = hole.number === 18;

                                    // Front 9 subtotal row
                                    const subtotalRow = isNinthRow ? (
                                        <tr key="front9" style={{ borderBottom: '2px solid var(--accent)', background: 'rgba(212,175,55,0.08)' }}>
                                            <td colSpan={2} style={{ padding: '0.3rem 0.4rem', fontWeight: 'bold', color: 'var(--accent)', fontSize: '0.7rem', textAlign: 'right' }}>OUT</td>
                                            <td style={{ padding: '0.3rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                                {holes.filter(h => h.number <= 9).reduce((a, h) => a + h.par, 0)}
                                            </td>
                                            {groupPlayers.map(p => {
                                                const front9 = holes.filter(h => h.number <= 9).reduce((acc, h) => acc + (parseInt(scores[p.id]?.[h.number]) || 0), 0);
                                                return (
                                                    <td key={p.id} style={{ padding: '0.3rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent)', fontSize: '0.82rem' }}>
                                                        {front9 || '—'}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ) : null;

                                    const mainRow = (
                                        <tr key={hole.number} style={{
                                            borderBottom: '1px solid var(--glass-border)',
                                            background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                                        }}>
                                            <td style={{ padding: '0.3rem 0.2rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.82rem' }}>
                                                {hole.number}
                                            </td>
                                            <td style={{ padding: '0.3rem 0.2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                                {hole.par}
                                            </td>
                                            <td style={{ padding: '0.3rem 0.2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                                                {hole.handicapIndex || hole.index || '—'}
                                            </td>
                                            {groupPlayers.map(p => {
                                                const val = scores[p.id]?.[hole.number];
                                                const scoreStyle = getScoreStyle(val ? parseInt(val) : null, hole.par);
                                                return (
                                                    <td key={p.id} style={{ padding: '0.25rem 0.2rem', textAlign: 'center' }}>
                                                        <input
                                                            id={`score-${p.id}-${hole.number}`}
                                                            type="number"
                                                            min="1"
                                                            max="15"
                                                            inputMode="numeric"
                                                            value={val ?? ''}
                                                            onChange={e => handleScoreChange(p.id, hole.number, e.target.value)}
                                                            onFocus={e => e.target.select()}
                                                            style={{
                                                                width: '44px', height: '36px',
                                                                textAlign: 'center',
                                                                borderRadius: '5px',
                                                                border: '1px solid var(--glass-border)',
                                                                background: val ? 'transparent' : 'var(--bg-dark)',
                                                                color: 'var(--text-main)',
                                                                fontSize: '1rem',
                                                                fontWeight: 'bold',
                                                                outline: 'none',
                                                                transition: 'all 0.15s',
                                                                ...scoreStyle,
                                                            }}
                                                        />
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );

                                    return [mainRow, subtotalRow].filter(Boolean);
                                })}

                                {/* Total Row */}
                                <tr style={{ borderTop: '2px solid var(--accent)', background: 'rgba(212,175,55,0.08)', fontWeight: 'bold' }}>
                                    <td colSpan={2} style={{ padding: '0.4rem 0.3rem', color: 'var(--accent)', textAlign: 'right', fontSize: '0.75rem' }}>IN</td>
                                    <td style={{ padding: '0.4rem 0.3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                        {holes.reduce((a, h) => a + h.par, 0)}
                                    </td>
                                    {groupPlayers.map(p => {
                                        const total = getPlayerTotal(p.id);
                                        const toPar = getPlayerToPar(p.id);
                                        return (
                                            <td key={p.id} style={{ padding: '0.4rem 0.3rem', textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.95rem', color: 'var(--accent)', fontWeight: 'bold' }}>{total || '—'}</div>
                                                {total > 0 && (
                                                    <div style={{ fontSize: '0.72rem', color: toPar < 0 ? '#4CAF50' : toPar > 0 ? '#FF9800' : '#2196F3' }}>
                                                        {formatToPar(toPar)}
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Error / Success messages */}
                    {error && (
                        <div style={{ padding: '1rem', background: 'rgba(244,67,54,0.1)', border: '1px solid #f44336', borderRadius: 'var(--radius)', color: '#f44336', marginBottom: '1rem' }}>
                            {error}
                        </div>
                    )}
                    {saved && (
                        <div style={{ padding: '1rem', background: 'rgba(76,175,80,0.1)', border: '1px solid #4CAF50', borderRadius: 'var(--radius)', color: '#4CAF50', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle size={18} /> Scores saved successfully!
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <button
                            className="btn-outline"
                            onClick={() => setStep(1)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '12px 24px', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '1rem' }}
                        >
                            <ChevronLeft size={18} /> Change Group
                        </button>
                        <button
                            className="btn"
                            onClick={handleSave}
                            disabled={saving}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', minWidth: '180px' }}
                        >
                            {saving ? (
                                <>Saving...</>
                            ) : (
                                <><Save size={18} /> Save All Scores</>
                            )}
                        </button>
                    </div>

                    <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        Scores are saved automatically per hole. You can save incrementally as you play.
                    </p>
                </div>
            )}
        </div>
    );
}
