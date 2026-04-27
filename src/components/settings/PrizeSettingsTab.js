import React, { useState, useEffect } from 'react';

export default function PrizeSettingsTab({ tournamentId, courses }) {
    const [prizesTitle, setPrizesTitle] = useState('Tournament Prizes');
    const [prizes, setPrizes] = useState([]);
    const [prizeForm, setPrizeForm] = useState({ title: '', description: '', value: '' });
    const [savingPrizes, setSavingPrizes] = useState(false);
    const [prizesMessage, setPrizesMessage] = useState('');
    const [editingPrizeId, setEditingPrizeId] = useState(null);
    const [editPrizeForm, setEditPrizeForm] = useState({ title: '', description: '', value: '' });

    // Special Prizes
    const [closestToPin, setClosestToPin] = useState([]);
    const [longDrive, setLongDrive] = useState([]);

    useEffect(() => {
        if (tournamentId) {
            fetchPrizeSettings();
        }
    }, [tournamentId]);

    const fetchPrizeSettings = async () => {
        try {
            const res = await fetch(`/api/settings?tournamentId=${tournamentId}`);
            if (res.ok) {
                const data = await res.json();
                setPrizesTitle(data.prizesTitle || 'Tournament Prizes');
                setPrizes(Array.isArray(data.prizes) ? data.prizes : []);
                setClosestToPin(Array.isArray(data.closestToPin) ? data.closestToPin : []);
                setLongDrive(Array.isArray(data.longDrive) ? data.longDrive : []);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSavePrizes = async () => {
        setSavingPrizes(true);
        setPrizesMessage('');

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId,
                    prizesTitle,
                    prizes,
                    closestToPin,
                    longDrive
                })
            });

            if (res.ok) {
                setPrizesMessage('Prizes saved!');
                setTimeout(() => setPrizesMessage(''), 3000);
            } else {
                setPrizesMessage('Error saving prizes');
            }
        } catch (error) {
            console.error(error);
            setPrizesMessage('Error saving prizes');
        } finally {
            setSavingPrizes(false);
        }
    };

    const handleAddPrize = (e) => {
        e.preventDefault();
        if (!prizeForm.title) return;
        setPrizes([...(prizes || []), { ...prizeForm, id: Math.random().toString() }]);
        setPrizeForm({ title: '', description: '', value: '' });
    };

    const handleDeletePrize = (id) => {
        setPrizes((prizes || []).filter(p => p.id !== id));
    };

    const handleEditPrizeClick = (prize) => {
        setEditingPrizeId(prize.id);
        setEditPrizeForm({ title: prize.title || '', description: prize.description || '', value: prize.value || '' });
    };

    const handleCancelEditPrize = () => {
        setEditingPrizeId(null);
        setEditPrizeForm({ title: '', description: '', value: '' });
    };

    const handleSavePrizeEdit = (id) => {
        if (!editPrizeForm.title) return;
        setPrizes((prizes || []).map(p => p.id === id ? { ...p, ...editPrizeForm } : p));
        setEditingPrizeId(null);
        setEditPrizeForm({ title: '', description: '', value: '' });
    };

    return (
        <div className="card">
            <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Tournament Prizes</h2>

            <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Settings Section Title</label>
                <input
                    type="text"
                    value={prizesTitle}
                    onChange={(e) => setPrizesTitle(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--glass-border)',
                        background: 'var(--bg-dark)',
                        color: 'var(--text-main)'
                    }}
                />
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Prizes List</h3>
                {(!prizes || prizes.length === 0) ? <p style={{ color: 'var(--text-muted)' }}>No prizes added yet.</p> : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {prizes.map((prize, idx) => (
                            <div key={prize.id || idx} style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: `1px solid ${editingPrizeId === prize.id ? 'var(--accent)' : 'var(--glass-border)'}` }}>
                                {editingPrizeId === prize.id ? (
                                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                                        <input
                                            value={editPrizeForm.title}
                                            onChange={e => setEditPrizeForm({ ...editPrizeForm, title: e.target.value })}
                                            placeholder="Prize Title"
                                            style={{ padding: '8px 10px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                        />
                                        <textarea
                                            value={editPrizeForm.description}
                                            onChange={e => setEditPrizeForm({ ...editPrizeForm, description: e.target.value })}
                                            placeholder="Description"
                                            style={{ padding: '8px 10px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', minHeight: '70px', resize: 'vertical' }}
                                        />
                                        <input
                                            value={editPrizeForm.value}
                                            onChange={e => setEditPrizeForm({ ...editPrizeForm, value: e.target.value })}
                                            placeholder="Value (e.g. $100)"
                                            style={{ padding: '8px 10px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                        />
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => handleSavePrizeEdit(prize.id)} className="btn" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>Save</button>
                                            <button onClick={handleCancelEditPrize} className="btn-outline" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: 0, color: 'var(--accent)' }}>{prize.title}</h4>
                                            <p style={{ margin: '0.2rem 0', fontSize: '0.9rem' }}>{prize.description}</p>
                                            {prize.value && <p style={{ margin: 0, fontSize: '0.85rem', color: '#4ade80' }}>Value: {prize.value}</p>}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => handleEditPrizeClick(prize)} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>Edit</button>
                                            <button onClick={() => handleDeletePrize(prize.id)} className="btn-outline" style={{ borderColor: '#ff6b6b', color: '#ff6b6b', padding: '4px 10px', fontSize: '0.8rem' }}>Delete</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Closest to Pin */}
            {(() => {
                const enabled = closestToPin.length > 0;
                const inputStyle = { padding: '8px 10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' };
                return (
                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>📍 Closest to Pin</h3>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                <input type="checkbox" checked={enabled} onChange={e => setClosestToPin(e.target.checked ? [{ courseId: courses[0]?.id || '', hole: 1 }] : [])} style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }} />
                                {enabled ? 'Enabled' : 'Disabled'}
                            </label>
                        </div>
                        {enabled && (
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {closestToPin.map((entry, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <select value={entry.courseId} onChange={e => setClosestToPin(closestToPin.map((c, ci) => ci === i ? { ...c, courseId: e.target.value } : c))} style={{ ...inputStyle, flex: 2, minWidth: '140px' }}>
                                            <option value="">Select Course</option>
                                            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Hole</span>
                                        <input type="number" min={1} max={18} value={entry.hole} onChange={e => setClosestToPin(closestToPin.map((c, ci) => ci === i ? { ...c, hole: parseInt(e.target.value) || 1 } : c))} style={{ ...inputStyle, width: '70px' }} />
                                        <button onClick={() => setClosestToPin(closestToPin.filter((_, ci) => ci !== i))} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
                                    </div>
                                ))}
                                <button onClick={() => setClosestToPin([...closestToPin, { courseId: courses[0]?.id || '', hole: 1 }])} className="btn-outline" style={{ width: 'fit-content', padding: '5px 12px', fontSize: '0.85rem' }}>+ Add Hole</button>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Long Drive */}
            {(() => {
                const enabled = longDrive.length > 0;
                const inputStyle = { padding: '8px 10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' };
                return (
                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>💥 Long Drive</h3>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                <input type="checkbox" checked={enabled} onChange={e => setLongDrive(e.target.checked ? [{ courseId: courses[0]?.id || '', hole: 1 }] : [])} style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }} />
                                {enabled ? 'Enabled' : 'Disabled'}
                            </label>
                        </div>
                        {enabled && (
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {longDrive.map((entry, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <select value={entry.courseId} onChange={e => setLongDrive(longDrive.map((c, ci) => ci === i ? { ...c, courseId: e.target.value } : c))} style={{ ...inputStyle, flex: 2, minWidth: '140px' }}>
                                            <option value="">Select Course</option>
                                            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Hole</span>
                                        <input type="number" min={1} max={18} value={entry.hole} onChange={e => setLongDrive(longDrive.map((c, ci) => ci === i ? { ...c, hole: parseInt(e.target.value) || 1 } : c))} style={{ ...inputStyle, width: '70px' }} />
                                        <button onClick={() => setLongDrive(longDrive.filter((_, ci) => ci !== i))} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
                                    </div>
                                ))}
                                <button onClick={() => setLongDrive([...longDrive, { courseId: courses[0]?.id || '', hole: 1 }])} className="btn-outline" style={{ width: 'fit-content', padding: '5px 12px', fontSize: '0.85rem' }}>+ Add Hole</button>
                            </div>
                        )}
                    </div>
                );
            })()}

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '2rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Add New Prize</h3>
                <form onSubmit={handleAddPrize}>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <input
                            placeholder="Prize Title (e.g. 1st Place)"
                            value={prizeForm.title}
                            onChange={e => setPrizeForm({ ...prizeForm, title: e.target.value })}
                            style={{ padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                            required
                        />
                        <textarea
                            placeholder="Description (e.g. $100 Gift Card)"
                            value={prizeForm.description}
                            onChange={e => setPrizeForm({ ...prizeForm, description: e.target.value })}
                            style={{ padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', minHeight: '80px' }}
                            required
                        />
                        <input
                            placeholder="Value (Optional, e.g. $100)"
                            value={prizeForm.value}
                            onChange={e => setPrizeForm({ ...prizeForm, value: e.target.value })}
                            style={{ padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                        />
                        <button type="submit" className="btn-outline" style={{ width: 'fit-content' }}>Add to List</button>
                    </div>
                </form>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={handleSavePrizes}
                    className="btn"
                    disabled={savingPrizes}
                    style={{ minWidth: '150px' }}
                >
                    {savingPrizes ? 'Saving...' : 'Save Prizes'}
                </button>
                {prizesMessage && (
                    <span style={{
                        color: prizesMessage.includes('Error') ? '#ff6b6b' : 'var(--accent)',
                        fontWeight: 'bold'
                    }}>
                        {prizesMessage}
                    </span>
                )}
            </div>
        </div>
    );
}
