"use client";

import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Zap, Loader, Plus, Trash2 } from 'lucide-react';

// ── 3-step flow: Basics → Rounds → Launch ──────────────────────────────────
const STEPS = [
    { id: 1, label: 'Basics',  emoji: '🏌️' },
    { id: 2, label: 'Rounds',  emoji: '📅' },
    { id: 3, label: 'Launch',  emoji: '🚀' },
];

const GAME_FORMATS = [
    { value: 'Individual', label: 'Stroke Play' },
    { value: 'Stableford', label: 'Stableford' },
    { value: 'Scramble',   label: 'Scramble' },
    { value: 'BestBall',   label: 'Best Ball' },
    { value: 'MatchPlay',  label: 'Match Play' },
    { value: 'RyderCup',  label: 'Ryder Cup' },
];

const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1px solid var(--glass-border)',
    background: 'rgba(15,23,42,0.8)',
    color: 'var(--text-main)',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
};

const labelStyle = {
    display: 'block',
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
};

// ── Step 1: Basics ──────────────────────────────────────────────────────────
function StepBasics({ name, format, onName, onFormat }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
                <label style={labelStyle}>Tournament Name *</label>
                <input
                    style={inputStyle}
                    placeholder="e.g. Myrtle Beach 2026"
                    value={name}
                    onChange={e => onName(e.target.value)}
                    autoFocus
                />
            </div>

            <div>
                <label style={labelStyle}>Game Format</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {GAME_FORMATS.map(f => (
                        <button
                            key={f.value}
                            type="button"
                            onClick={() => onFormat(f.value)}
                            style={{
                                padding: '10px 6px',
                                borderRadius: '8px',
                                border: format === f.value ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
                                background: format === f.value ? 'rgba(212,175,55,0.15)' : 'rgba(15,23,42,0.5)',
                                color: format === f.value ? 'var(--accent)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: format === f.value ? '600' : '400',
                                transition: 'all 0.15s',
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Step 2: Rounds ──────────────────────────────────────────────────────────
function StepRounds({ rounds, onRounds }) {
    const update = (i, field, val) => {
        const next = rounds.map((r, idx) => idx === i ? { ...r, [field]: val } : r);
        onRounds(next);
    };
    const add    = () => onRounds([...rounds, { date: '', course: '' }]);
    const remove = i => onRounds(rounds.filter((_, idx) => idx !== i));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ margin: '0 0 0.5rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Set a date and course for each round. You can add tees, holes, and players in settings later.
            </p>

            {rounds.map((r, i) => (
                <div key={i} style={{
                    background: 'rgba(15,23,42,0.5)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--accent)', fontWeight: '600', fontSize: '0.9rem' }}>
                            Round {i + 1}
                        </span>
                        {rounds.length > 1 && (
                            <button
                                type="button"
                                onClick={() => remove(i)}
                                style={{ background: 'rgba(255,0,0,0.1)', border: 'none', borderRadius: '6px', color: '#ff6b6b', cursor: 'pointer', padding: '4px 6px' }}
                            >
                                <Trash2 size={15} />
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                            <label style={labelStyle}>Date</label>
                            <input
                                type="date"
                                style={inputStyle}
                                value={r.date}
                                onChange={e => update(i, 'date', e.target.value)}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Course Name</label>
                            <input
                                style={inputStyle}
                                placeholder="e.g. Pebble Beach"
                                value={r.course}
                                onChange={e => update(i, 'course', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            ))}

            <button
                type="button"
                onClick={add}
                className="btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', fontSize: '0.88rem', width: 'fit-content' }}
            >
                <Plus size={15} /> Add Round
            </button>
        </div>
    );
}

// ── Step 3: Launch summary ──────────────────────────────────────────────────
function StepLaunch({ name, format, rounds }) {
    const formatLabel = GAME_FORMATS.find(f => f.value === format)?.label || format;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{
                background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.3)',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex', gap: '10px', alignItems: 'center',
            }}>
                <Zap size={18} color="var(--accent)" />
                <span style={{ color: 'var(--accent)', fontSize: '0.9rem', fontWeight: '600' }}>
                    Ready to go! You can add players, lodging, and prizes in settings after launch.
                </span>
            </div>

            <div style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid var(--glass-border)', borderRadius: '10px', overflow: 'hidden' }}>
                {[
                    ['Tournament', name],
                    ['Format', formatLabel],
                    ['Rounds', rounds.length],
                    ...rounds.map((r, i) => [
                        `Round ${i + 1}`,
                        [r.date ? new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—', r.course || '—'].join(' · ')
                    ]),
                ].map(([label, val], idx, arr) => (
                    <div key={idx} style={{
                        display: 'flex', gap: '1rem', padding: '10px 14px',
                        borderBottom: idx < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', minWidth: '100px' }}>{label}</span>
                        <span style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>{val}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Main Wizard ─────────────────────────────────────────────────────────────
export default function TripSetupWizard({ isOpen, onClose, onSuccess, tournamentId, tournamentName }) {
    const [step, setStep] = useState(1);
    const [launching, setLaunching] = useState(false);
    const [launchError, setLaunchError] = useState('');

    const [name, setName]     = useState(tournamentName || '');
    const [format, setFormat] = useState('Individual');
    const [rounds, setRounds] = useState([{ date: '', course: '' }]);

    if (!isOpen) return null;

    const totalSteps = STEPS.length;
    const canNext = step === 1 ? name.trim().length > 0 : true;
    const progress = (step / totalSteps) * 100;
    const currentMeta = STEPS[step - 1];

    const handleLaunch = async () => {
        setLaunching(true);
        setLaunchError('');
        try {
            // 1. Save settings
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId,
                    tournamentName: name,
                    numberOfRounds: rounds.length,
                    roundDates: rounds.map(r => r.date),
                    roundTimeConfig: Object.fromEntries(
                        rounds.map((_, i) => [i + 1, { format }])
                    ),
                }),
            });

            // 2. Create courses (one per round that has a name)
            const namedCourses = rounds.map(r => r.course?.trim()).filter(Boolean);
            if (namedCourses.length > 0) {
                await fetch('/api/courses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tournamentId,
                        courses: namedCourses.map(n => ({ name: n, par: 72 })),
                    }),
                });
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error('Wizard launch error:', err);
            setLaunchError('Something went wrong. You can complete setup in the admin settings page.');
        } finally {
            setLaunching(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 9999, padding: '16px',
            }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                background: 'linear-gradient(145deg, var(--bg-card), var(--bg-dark))',
                border: '1px solid var(--glass-border)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '520px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
                overflow: 'hidden',
            }}>

                {/* ── Header ── */}
                <div style={{ padding: '20px 24px 0', flex: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.4rem' }}>{currentMeta.emoji}</span>
                            <div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Step {step} of {totalSteps}
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', lineHeight: 1.2 }}>
                                    {currentMeta.label === 'Basics' ? 'Tournament Basics' :
                                     currentMeta.label === 'Rounds' ? 'Rounds & Courses' :
                                     'Ready to Launch'}
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}>
                            <X size={22} />
                        </button>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden', marginBottom: '16px' }}>
                        <div style={{
                            height: '100%',
                            width: `${progress}%`,
                            background: 'linear-gradient(90deg, var(--accent), #b8962e)',
                            borderRadius: '2px',
                            transition: 'width 0.3s ease',
                        }} />
                    </div>

                    {/* Step dots */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
                        {STEPS.map(s => (
                            <div
                                key={s.id}
                                onClick={() => s.id < step && setStep(s.id)}
                                style={{
                                    height: '6px',
                                    flex: 1,
                                    borderRadius: '3px',
                                    background: s.id <= step ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                                    opacity: s.id < step ? 0.6 : 1,
                                    cursor: s.id < step ? 'pointer' : 'default',
                                    transition: 'all 0.2s',
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* ── Body (scrollable) ── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 4px' }}>
                    {step === 1 && <StepBasics name={name} format={format} onName={setName} onFormat={setFormat} />}
                    {step === 2 && <StepRounds rounds={rounds} onRounds={setRounds} />}
                    {step === 3 && <StepLaunch name={name} format={format} rounds={rounds} />}
                </div>

                {/* ── Footer ── */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--glass-border)', flex: 'none' }}>
                    {launchError && (
                        <div style={{ marginBottom: '12px', padding: '10px 14px', background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.3)', borderRadius: '8px', color: '#ff6b6b', fontSize: '0.85rem' }}>
                            {launchError}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between' }}>
                        <button
                            type="button"
                            onClick={() => setStep(s => Math.max(1, s - 1))}
                            disabled={step === 1}
                            className="btn-outline"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', opacity: step === 1 ? 0.3 : 1, cursor: step === 1 ? 'not-allowed' : 'pointer' }}
                        >
                            <ChevronLeft size={18} /> Back
                        </button>

                        {step < totalSteps ? (
                            <button
                                type="button"
                                onClick={() => setStep(s => s + 1)}
                                disabled={!canNext}
                                className="btn"
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 28px', opacity: !canNext ? 0.5 : 1, cursor: !canNext ? 'not-allowed' : 'pointer' }}
                            >
                                Next <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleLaunch}
                                disabled={launching}
                                className="btn"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 28px', fontSize: '1rem' }}
                            >
                                {launching ? <Loader className="animate-spin" size={18} /> : <><Zap size={18} /> Launch</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
