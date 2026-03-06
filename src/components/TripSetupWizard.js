"use client";

import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Plus, Trash2, Loader, Zap } from 'lucide-react';

const STEPS = [
    { id: 1, label: 'Basics', emoji: '🏌️' },
    { id: 2, label: 'Dates', emoji: '📅' },
    { id: 3, label: 'Courses', emoji: '⛳' },
    { id: 4, label: 'Players', emoji: '👥' },
    { id: 5, label: 'Lodging', emoji: '🏨' },
    { id: 6, label: 'Food', emoji: '🍽️' },
    { id: 7, label: 'Prizes', emoji: '🏆' },
    { id: 8, label: 'Launch', emoji: '🚀' },
];

const GAME_FORMATS = ['Stroke Play', 'Stableford', 'Match Play', 'Ryder Cup', 'Best Ball', 'Scramble'];

const emptyPlayer = () => ({ name: '', email: '', phone: '', handicap: '' });
const emptyLodging = () => ({ name: '', address: '', url: '', notes: '' });
const emptyRestaurant = () => ({ name: '', cuisine: '', notes: '' });
const emptyPrize = () => ({ title: '', description: '' });

// ─────────────────────────────────────────────────────────────────────────────
// Shared input style
// ─────────────────────────────────────────────────────────────────────────────
const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--glass-border)',
    background: 'rgba(15,23,42,0.8)',
    color: 'var(--text-main)',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s',
};

const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
};

const rowStyle = { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 };

// ─────────────────────────────────────────────────────────────────────────────
// Step components
// ─────────────────────────────────────────────────────────────────────────────

function StepBasics({ data, onChange }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={rowStyle}>
                <label style={labelStyle}>Trip Name *</label>
                <input
                    style={inputStyle}
                    placeholder="e.g. Myrtle Beach 2026"
                    value={data.name}
                    onChange={e => onChange('name', e.target.value)}
                    autoFocus
                />
            </div>
            <div style={rowStyle}>
                <label style={labelStyle}>Game Format</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                    {GAME_FORMATS.map(fmt => (
                        <button
                            key={fmt}
                            type="button"
                            onClick={() => onChange('format', fmt)}
                            style={{
                                padding: '10px 8px',
                                borderRadius: '8px',
                                border: data.format === fmt ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
                                background: data.format === fmt ? 'rgba(212,175,55,0.15)' : 'rgba(15,23,42,0.5)',
                                color: data.format === fmt ? 'var(--accent)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: data.format === fmt ? '600' : '400',
                                transition: 'all 0.2s',
                            }}
                        >
                            {fmt}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StepDates({ data, onChange }) {
    const handleRoundChange = (i, field, val) => {
        const updated = data.rounds.map((r, idx) => idx === i ? { ...r, [field]: val } : r);
        onChange('rounds', updated);
    };

    const addRound = () => onChange('rounds', [...data.rounds, { date: '' }]);
    const removeRound = (i) => onChange('rounds', data.rounds.filter((_, idx) => idx !== i));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Set a date for each round. You can always change these later.</p>
            {data.rounds.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'rgba(15,23,42,0.5)', borderRadius: '8px', padding: '12px 14px', border: '1px solid var(--glass-border)' }}>
                    <span style={{ color: 'var(--accent)', fontWeight: '600', minWidth: '64px', fontSize: '0.9rem' }}>Round {i + 1}</span>
                    <input
                        type="date"
                        style={{ ...inputStyle, flex: 1 }}
                        value={r.date}
                        onChange={e => handleRoundChange(i, 'date', e.target.value)}
                    />
                    {data.rounds.length > 1 && (
                        <button type="button" onClick={() => removeRound(i)} style={{ background: 'rgba(255,0,0,0.1)', border: 'none', borderRadius: '6px', color: '#ff6b6b', cursor: 'pointer', padding: '6px' }}>
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            ))}
            <button type="button" onClick={addRound} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', fontSize: '0.9rem', width: 'fit-content' }}>
                <Plus size={16} /> Add Round
            </button>
        </div>
    );
}

function StepCourses({ data, onChange, rounds }) {
    const handleChange = (i, val) => {
        const updated = [...data.courses];
        updated[i] = val;
        onChange('courses', updated);
    };

    // Ensure courses array matches number of rounds
    const courseSlots = rounds.map((_, i) => data.courses[i] || '');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Enter the name of the golf course for each round. You can add full course details (tees, holes) in the admin settings later.</p>
            {rounds.map((r, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={labelStyle}>Round {i + 1} Course{r.date ? ` — ${new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}</label>
                    <input
                        style={inputStyle}
                        placeholder="e.g. Pebble Beach Golf Links"
                        value={courseSlots[i]}
                        onChange={e => handleChange(i, e.target.value)}
                    />
                </div>
            ))}
            {rounds.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>Go back to Dates to add rounds first.</p>
            )}
        </div>
    );
}

function StepPlayers({ data, onChange }) {
    const updatePlayer = (i, field, val) => {
        const updated = data.players.map((p, idx) => idx === i ? { ...p, [field]: val } : p);
        onChange('players', updated);
    };
    const addPlayer = () => onChange('players', [...data.players, emptyPlayer()]);
    const removePlayer = (i) => onChange('players', data.players.filter((_, idx) => idx !== i));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Add your crew. Email and phone are optional.</p>
            {data.players.map((p, i) => (
                <div key={i} style={{ background: 'rgba(15,23,42,0.5)', borderRadius: '10px', padding: '14px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--accent)', fontWeight: '600', fontSize: '0.9rem' }}>Player {i + 1}</span>
                        {data.players.length > 1 && (
                            <button type="button" onClick={() => removePlayer(i)} style={{ background: 'rgba(255,0,0,0.1)', border: 'none', borderRadius: '6px', color: '#ff6b6b', cursor: 'pointer', padding: '4px 6px' }}>
                                <Trash2 size={15} />
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div style={rowStyle}>
                            <label style={labelStyle}>Name *</label>
                            <input style={inputStyle} placeholder="Full name" value={p.name} onChange={e => updatePlayer(i, 'name', e.target.value)} />
                        </div>
                        <div style={rowStyle}>
                            <label style={labelStyle}>Handicap</label>
                            <input style={inputStyle} type="number" placeholder="e.g. 12.4" value={p.handicap} onChange={e => updatePlayer(i, 'handicap', e.target.value)} />
                        </div>
                        <div style={rowStyle}>
                            <label style={labelStyle}>Email</label>
                            <input style={inputStyle} type="email" placeholder="optional" value={p.email} onChange={e => updatePlayer(i, 'email', e.target.value)} />
                        </div>
                        <div style={rowStyle}>
                            <label style={labelStyle}>Phone</label>
                            <input style={inputStyle} type="tel" placeholder="optional" value={p.phone} onChange={e => updatePlayer(i, 'phone', e.target.value)} />
                        </div>
                    </div>
                </div>
            ))}
            <button type="button" onClick={addPlayer} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', fontSize: '0.9rem', width: 'fit-content' }}>
                <Plus size={16} /> Add Player
            </button>
        </div>
    );
}

function StepLodging({ data, onChange }) {
    const update = (i, field, val) => {
        const updated = data.lodgings.map((l, idx) => idx === i ? { ...l, [field]: val } : l);
        onChange('lodgings', updated);
    };
    const add = () => onChange('lodgings', [...data.lodgings, emptyLodging()]);
    const remove = (i) => onChange('lodgings', data.lodgings.filter((_, idx) => idx !== i));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Where is everyone staying? Add one or more accommodations.</p>
            {data.lodgings.map((l, i) => (
                <div key={i} style={{ background: 'rgba(15,23,42,0.5)', borderRadius: '10px', padding: '14px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--accent)', fontWeight: '600', fontSize: '0.9rem' }}>Accommodation {i + 1}</span>
                        {data.lodgings.length > 1 && (
                            <button type="button" onClick={() => remove(i)} style={{ background: 'rgba(255,0,0,0.1)', border: 'none', borderRadius: '6px', color: '#ff6b6b', cursor: 'pointer', padding: '4px 6px' }}>
                                <Trash2 size={15} />
                            </button>
                        )}
                    </div>
                    <div style={rowStyle}>
                        <label style={labelStyle}>Name / Property</label>
                        <input style={inputStyle} placeholder="e.g. Ocean Breeze Villa" value={l.name} onChange={e => update(i, 'name', e.target.value)} />
                    </div>
                    <div style={rowStyle}>
                        <label style={labelStyle}>Address</label>
                        <input style={inputStyle} placeholder="Street address or area" value={l.address} onChange={e => update(i, 'address', e.target.value)} />
                    </div>
                    <div style={rowStyle}>
                        <label style={labelStyle}>Booking URL</label>
                        <input style={inputStyle} type="url" placeholder="https://..." value={l.url} onChange={e => update(i, 'url', e.target.value)} />
                    </div>
                    <div style={rowStyle}>
                        <label style={labelStyle}>Notes</label>
                        <input style={inputStyle} placeholder="Check-in time, access code, etc." value={l.notes} onChange={e => update(i, 'notes', e.target.value)} />
                    </div>
                </div>
            ))}
            <button type="button" onClick={add} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', fontSize: '0.9rem', width: 'fit-content' }}>
                <Plus size={16} /> Add Accommodation
            </button>
        </div>
    );
}

function StepFood({ data, onChange }) {
    const update = (i, field, val) => {
        const updated = data.restaurants.map((r, idx) => idx === i ? { ...r, [field]: val } : r);
        onChange('restaurants', updated);
    };
    const add = () => onChange('restaurants', [...data.restaurants, emptyRestaurant()]);
    const remove = (i) => onChange('restaurants', data.restaurants.filter((_, idx) => idx !== i));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Plan your meals. Add any dinners, lunches, or 19th hole spots.</p>
            {data.restaurants.map((r, i) => (
                <div key={i} style={{ background: 'rgba(15,23,42,0.5)', borderRadius: '10px', padding: '14px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--accent)', fontWeight: '600', fontSize: '0.9rem' }}>Restaurant {i + 1}</span>
                        {data.restaurants.length > 1 && (
                            <button type="button" onClick={() => remove(i)} style={{ background: 'rgba(255,0,0,0.1)', border: 'none', borderRadius: '6px', color: '#ff6b6b', cursor: 'pointer', padding: '4px 6px' }}>
                                <Trash2 size={15} />
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div style={rowStyle}>
                            <label style={labelStyle}>Name</label>
                            <input style={inputStyle} placeholder="Restaurant name" value={r.name} onChange={e => update(i, 'name', e.target.value)} />
                        </div>
                        <div style={rowStyle}>
                            <label style={labelStyle}>Cuisine</label>
                            <input style={inputStyle} placeholder="e.g. Steakhouse" value={r.cuisine} onChange={e => update(i, 'cuisine', e.target.value)} />
                        </div>
                    </div>
                    <div style={rowStyle}>
                        <label style={labelStyle}>Notes</label>
                        <input style={inputStyle} placeholder="Reservation time, special notes…" value={r.notes} onChange={e => update(i, 'notes', e.target.value)} />
                    </div>
                </div>
            ))}
            <button type="button" onClick={add} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', fontSize: '0.9rem', width: 'fit-content' }}>
                <Plus size={16} /> Add Restaurant
            </button>
        </div>
    );
}

function StepPrizes({ data, onChange }) {
    const updatePrize = (i, field, val) => {
        const updated = data.prizes.map((p, idx) => idx === i ? { ...p, [field]: val } : p);
        onChange('prizes', updated);
    };
    const addPrize = () => onChange('prizes', [...data.prizes, emptyPrize()]);
    const removePrize = (i) => onChange('prizes', data.prizes.filter((_, idx) => idx !== i));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', margin: 0 }}>Prizes</h4>
                {data.prizes.map((p, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'end', background: 'rgba(15,23,42,0.5)', borderRadius: '10px', padding: '12px', border: '1px solid var(--glass-border)' }}>
                        <div style={rowStyle}>
                            <label style={labelStyle}>Prize Title</label>
                            <input style={inputStyle} placeholder="e.g. Champion" value={p.title} onChange={e => updatePrize(i, 'title', e.target.value)} />
                        </div>
                        <div style={rowStyle}>
                            <label style={labelStyle}>Description</label>
                            <input style={inputStyle} placeholder="e.g. Low gross overall" value={p.description} onChange={e => updatePrize(i, 'description', e.target.value)} />
                        </div>
                        <button type="button" onClick={() => removePrize(i)} style={{ background: 'rgba(255,0,0,0.1)', border: 'none', borderRadius: '6px', color: '#ff6b6b', cursor: 'pointer', padding: '10px 8px', alignSelf: 'flex-end' }}>
                            <Trash2 size={15} />
                        </button>
                    </div>
                ))}
                <button type="button" onClick={addPrize} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', fontSize: '0.9rem', width: 'fit-content' }}>
                    <Plus size={16} /> Add Prize
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)', margin: 0 }}>Payment Handles</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    {[['venmo', 'Venmo', '@handle'], ['paypal', 'PayPal', '@handle or email'], ['zelle', 'Zelle', 'Phone or email']].map(([key, label, ph]) => (
                        <div key={key} style={rowStyle}>
                            <label style={labelStyle}>{label}</label>
                            <input style={inputStyle} placeholder={ph} value={data[key]} onChange={e => onChange(key, e.target.value)} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ReviewRow({ label, value }) {
    if (!value) return null;
    return (
        <div style={{ display: 'flex', gap: '1rem', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', minWidth: '120px' }}>{label}</span>
            <span style={{ color: 'var(--text-main)', fontSize: '0.85rem', flex: 1 }}>{value}</span>
        </div>
    );
}

function StepReview({ data }) {
    const filledPlayers = data.players.filter(p => p.name.trim());
    const filledLodgings = data.lodgings.filter(l => l.name.trim());
    const filledRestaurants = data.restaurants.filter(r => r.name.trim());
    const filledPrizes = data.prizes.filter(p => p.title.trim());
    const filledCourses = data.courses.filter(c => c.trim());

    const sections = [
        { title: '🏌️ Trip Basics', rows: [['Name', data.name], ['Format', data.format]] },
        { title: '📅 Rounds', rows: data.rounds.map((r, i) => [`Round ${i + 1}`, r.date ? new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—']) },
        { title: '⛳ Courses', rows: filledCourses.map((c, i) => [`Round ${i + 1}`, c]) },
        { title: '👥 Players', rows: filledPlayers.map(p => [p.name, `HCP ${p.handicap || '—'}${p.email ? ` • ${p.email}` : ''}`]) },
        { title: '🏨 Lodging', rows: filledLodgings.map(l => [l.name, l.address || l.url || '']) },
        { title: '🍽️ Food', rows: filledRestaurants.map(r => [r.name, r.cuisine || r.notes || '']) },
        { title: '🏆 Prizes', rows: filledPrizes.map(p => [p.title, p.description || '']) },
        { title: '💳 Payment', rows: [['Venmo', data.venmo], ['PayPal', data.paypal], ['Zelle', data.zelle]].filter(([, v]) => v) },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '10px', padding: '14px 16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Zap size={18} color="var(--accent)" />
                <span style={{ color: 'var(--accent)', fontSize: '0.9rem', fontWeight: '600' }}>Everything looks good! Hit Launch to save your trip.</span>
            </div>

            {sections.map(({ title, rows }) => rows.length > 0 && (
                <div key={title}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</h4>
                    <div style={{ background: 'rgba(15,23,42,0.5)', borderRadius: '10px', padding: '4px 14px', border: '1px solid var(--glass-border)' }}>
                        {rows.map(([l, v], i) => <ReviewRow key={i} label={l} value={v} />)}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main wizard
// ─────────────────────────────────────────────────────────────────────────────

export default function TripSetupWizard({ isOpen, onClose, onSuccess, tournamentId, tournamentName }) {
    const [step, setStep] = useState(1);
    const [launching, setLaunching] = useState(false);
    const [launchError, setLaunchError] = useState('');

    // ── wizard state ──────────────────────────────────────────────────────────
    const [basics, setBasics] = useState({ name: tournamentName || '', format: 'Stroke Play' });
    const [dates, setDates] = useState({ rounds: [{ date: '' }] });
    const [courses, setCourses] = useState({ courses: [] });
    const [players, setPlayers] = useState({ players: [emptyPlayer()] });
    const [lodging, setLodging] = useState({ lodgings: [emptyLodging()] });
    const [food, setFood] = useState({ restaurants: [emptyRestaurant()] });
    const [prizes, setPrizes] = useState({ prizes: [emptyPrize()], venmo: '', paypal: '', zelle: '' });

    if (!isOpen) return null;

    const totalSteps = STEPS.length;

    // Per-step data + onChange factory
    const stepData = [
        [basics, (k, v) => setBasics(prev => ({ ...prev, [k]: v }))],
        [dates, (k, v) => setDates(prev => ({ ...prev, [k]: v }))],
        [courses, (k, v) => setCourses(prev => ({ ...prev, [k]: v }))],
        [players, (k, v) => setPlayers(prev => ({ ...prev, [k]: v }))],
        [lodging, (k, v) => setLodging(prev => ({ ...prev, [k]: v }))],
        [food, (k, v) => setFood(prev => ({ ...prev, [k]: v }))],
        [prizes, (k, v) => setPrizes(prev => ({ ...prev, [k]: v }))],
        // step 8 review — no edits
    ];

    const canNext = step === 1 ? basics.name.trim().length > 0 : true;

    const handleNext = () => {
        if (step < totalSteps) setStep(s => s + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(s => s - 1);
    };

    const handleLaunch = async () => {
        setLaunching(true);
        setLaunchError('');

        const roundDates = dates.rounds.map(r => r.date);
        const roundCourses = courses.courses;
        const filledPlayers = players.players.filter(p => p.name.trim());
        const filledLodgings = lodging.lodgings.filter(l => l.name.trim());
        const filledRestaurants = food.restaurants.filter(r => r.name.trim());
        const filledPrizes = prizes.prizes.filter(p => p.title.trim());

        try {
            // 1. Save settings
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId,
                    tournamentName: basics.name,
                    numberOfRounds: dates.rounds.length,
                    roundDates,
                    roundCourses,
                    showAccommodations: filledLodgings.length > 0,
                    showFood: filledRestaurants.length > 0,
                    showPrizes: filledPrizes.length > 0,
                    prizes: filledPrizes,
                    venmo: prizes.venmo,
                    paypal: prizes.paypal,
                    zelle: prizes.zelle,
                    roundTimeConfig: { gameFormat: basics.format },
                }),
            });

            // 2. Add courses
            const filledCourseNames = roundCourses.filter(c => c && c.trim());
            if (filledCourseNames.length > 0) {
                await fetch('/api/courses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tournamentId,
                        courses: filledCourseNames.map(name => ({ name, par: 72 })),
                    }),
                });
            }

            // 3. Add players (sequential to avoid race)
            for (const p of filledPlayers) {
                await fetch('/api/players', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tournamentId,
                        name: p.name,
                        email: p.email || null,
                        phone: p.phone || null,
                        handicapIndex: parseFloat(p.handicap) || 0,
                    }),
                });
            }

            // 4. Add lodgings
            for (const l of filledLodgings) {
                await fetch('/api/lodging', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tournamentId, ...l }),
                });
            }

            // 5. Add restaurants
            for (const r of filledRestaurants) {
                await fetch('/api/restaurants', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tournamentId, name: r.name, cuisine: r.cuisine, notes: r.notes }),
                });
            }

            // Navigate to tournament page
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error('Wizard launch error:', err);
            setLaunchError('Something went wrong. Please try again or use the admin settings page to complete your setup.');
        } finally {
            setLaunching(false);
        }
    };

    const renderStep = () => {
        const [data, onChange] = stepData[step - 1] || [null, null];
        switch (step) {
            case 1: return <StepBasics data={data} onChange={onChange} />;
            case 2: return <StepDates data={data} onChange={onChange} />;
            case 3: return <StepCourses data={data} onChange={onChange} rounds={dates.rounds} />;
            case 4: return <StepPlayers data={data} onChange={onChange} />;
            case 5: return <StepLodging data={data} onChange={onChange} />;
            case 6: return <StepFood data={data} onChange={onChange} />;
            case 7: return <StepPrizes data={data} onChange={onChange} />;
            case 8: return <StepReview data={{
                name: basics.name,
                format: basics.format,
                rounds: dates.rounds,
                courses: courses.courses,
                players: players.players,
                lodgings: lodging.lodgings,
                restaurants: food.restaurants,
                prizes: prizes.prizes,
                venmo: prizes.venmo,
                paypal: prizes.paypal,
                zelle: prizes.zelle,
            }} />;
            default: return null;
        }
    };

    const currentStepMeta = STEPS[step - 1];
    const progress = (step / totalSteps) * 100;

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
                maxWidth: '640px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
                overflow: 'hidden',
            }}>

                {/* ── Header ── */}
                <div style={{ padding: '20px 24px 0', flex: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.4rem' }}>{currentStepMeta.emoji}</span>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Step {step} of {totalSteps}
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', lineHeight: 1.2 }}>
                                    {currentStepMeta.label === 'Basics' ? 'Trip Basics' :
                                        currentStepMeta.label === 'Dates' ? 'Dates & Rounds' :
                                            currentStepMeta.label === 'Courses' ? 'Golf Courses' :
                                                currentStepMeta.label === 'Players' ? 'Players' :
                                                    currentStepMeta.label === 'Lodging' ? 'Lodging' :
                                                        currentStepMeta.label === 'Food' ? 'Food & Dining' :
                                                            currentStepMeta.label === 'Prizes' ? 'Prizes & Payment' :
                                                                'Review & Launch'}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}
                        >
                            <X size={22} />
                        </button>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden', marginBottom: '4px' }}>
                        <div style={{
                            height: '100%',
                            width: `${progress}%`,
                            background: 'linear-gradient(90deg, var(--accent), #b8962e)',
                            borderRadius: '2px',
                            transition: 'width 0.3s ease',
                        }} />
                    </div>

                    {/* Step pills */}
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        {STEPS.map(s => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => s.id < step && setStep(s.id)}
                                style={{
                                    padding: '3px 8px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    fontSize: '0.72rem',
                                    cursor: s.id < step ? 'pointer' : 'default',
                                    background: s.id === step
                                        ? 'rgba(212,175,55,0.2)'
                                        : s.id < step
                                            ? 'rgba(212,175,55,0.08)'
                                            : 'rgba(255,255,255,0.04)',
                                    color: s.id === step
                                        ? 'var(--accent)'
                                        : s.id < step
                                            ? 'rgba(212,175,55,0.6)'
                                            : 'var(--text-muted)',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                }}
                            >
                                {s.id < step && <Check size={10} />}
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Body (scrollable) ── */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }} className="custom-scrollbar">
                    {renderStep()}
                </div>

                {/* ── Footer ── */}
                <div style={{ padding: '20px 24px', borderTop: '1px solid var(--glass-border)', flex: 'none' }}>
                    {launchError && (
                        <div style={{ marginBottom: '12px', padding: '10px 14px', background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.3)', borderRadius: '8px', color: '#ff6b6b', fontSize: '0.85rem' }}>
                            {launchError}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between' }}>
                        <button
                            type="button"
                            onClick={handleBack}
                            disabled={step === 1}
                            className="btn-outline"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', opacity: step === 1 ? 0.3 : 1, cursor: step === 1 ? 'not-allowed' : 'pointer' }}
                        >
                            <ChevronLeft size={18} /> Back
                        </button>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {step < totalSteps && step > 1 && (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}
                                >
                                    Skip
                                </button>
                            )}

                            {step < totalSteps ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={!canNext}
                                    className="btn"
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 24px', opacity: !canNext ? 0.5 : 1, cursor: !canNext ? 'not-allowed' : 'pointer' }}
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
                                    {launching ? <Loader className="animate-spin" size={18} /> : <><Zap size={18} /> Launch Trip</>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
