'use client';
import React, { useState, useEffect, useCallback } from 'react';

const CATEGORIES = ['Golf', 'Lodging', 'Food', 'Activities', 'Transport', 'Other'];

const CATEGORY_ICONS = {
    Golf: '⛳',
    Lodging: '🏠',
    Food: '🍽️',
    Activities: '🎉',
    Transport: '🚗',
    Other: '📋'
};

const EMPTY_FORM = {
    category: 'Golf',
    label: '',
    estimatedCost: '',
    actualCost: '',
    perPlayer: false,
    notes: ''
};

function fmt(n) {
    if (n == null || n === '' || isNaN(n)) return '—';
    return `$${parseFloat(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatusBadge({ item, playerCount }) {
    if (item.actualCost != null && item.paidAt) {
        return <span style={badge('var(--accent)', '#000')}>✅ Paid</span>;
    }
    if (item.actualCost != null) {
        return <span style={badge('#f59e0b', '#000')}>💳 Logged</span>;
    }
    return <span style={badge('#334', 'var(--text-muted)')}>⏳ Pending</span>;
}

function badge(bg, color) {
    return {
        background: bg,
        color,
        padding: '2px 8px',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        whiteSpace: 'nowrap'
    };
}

export default function BudgetSettingsTab({ tournamentId, players }) {
    const [lineItems, setLineItems] = useState([]);
    const [contributions, setContributions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [showForm, setShowForm] = useState(false);
    const [activeSection, setActiveSection] = useState('expenses'); // 'expenses' | 'players'
    const [toast, setToast] = useState(null);
    const [perPlayerTarget, setPerPlayerTarget] = useState('');

    const playerCount = players?.length || 0;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/budget?tournamentId=${tournamentId}`);
            if (res.ok) {
                const data = await res.json();
                setLineItems(data.lineItems || []);
                setContributions(data.contributions || []);
            }
        } catch (e) {
            console.error('Error fetching budget data:', e);
        } finally {
            setLoading(false);
        }
    }, [tournamentId]);

    useEffect(() => {
        if (tournamentId) fetchData();
    }, [tournamentId, fetchData]);

    function showToast(msg, type = 'success') {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    }

    // ─── Computed Totals ──────────────────────────────────────────────────────
    const totalEstimated = lineItems.reduce((sum, item) => {
        const base = parseFloat(item.estimatedCost) || 0;
        return sum + (item.perPlayer ? base * playerCount : base);
    }, 0);

    const totalActual = lineItems.reduce((sum, item) => {
        const base = parseFloat(item.actualCost) || 0;
        return sum + (item.perPlayer ? base * playerCount : base);
    }, 0);

    const totalCollected = contributions.reduce((sum, c) => sum + (parseFloat(c.amountPaid) || 0), 0);
    const totalDue = contributions.reduce((sum, c) => sum + (parseFloat(c.amountDue) || 0), 0);
    const surplus = totalCollected - totalActual;
    const paidCount = contributions.filter(c => parseFloat(c.amountPaid) >= parseFloat(c.amountDue) && parseFloat(c.amountDue) > 0).length;

    // ─── Line Item CRUD ───────────────────────────────────────────────────────
    function startNew() {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setShowForm(true);
    }

    function startEdit(item) {
        setEditingId(item.id);
        setForm({
            category: item.category,
            label: item.label,
            estimatedCost: item.estimatedCost ?? '',
            actualCost: item.actualCost ?? '',
            perPlayer: item.perPlayer,
            notes: item.notes ?? ''
        });
        setShowForm(true);
    }

    async function handleSaveItem(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                estimatedCost: form.estimatedCost !== '' ? parseFloat(form.estimatedCost) : null,
                actualCost: form.actualCost !== '' ? parseFloat(form.actualCost) : null,
                paidAt: form.actualCost !== '' ? new Date().toISOString() : null,
                tournamentId
            };

            if (editingId) {
                await fetch('/api/budget', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingId, ...payload })
                });
                showToast('Line item updated');
            } else {
                await fetch('/api/budget', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                showToast('Line item added');
            }
            setShowForm(false);
            setEditingId(null);
            fetchData();
        } catch (err) {
            console.error(err);
            showToast('Save failed', 'error');
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteItem(id) {
        if (!confirm('Delete this line item?')) return;
        try {
            await fetch(`/api/budget?id=${id}`, { method: 'DELETE' });
            showToast('Deleted');
            fetchData();
        } catch {
            showToast('Delete failed', 'error');
        }
    }

    // ─── Player Contributions ─────────────────────────────────────────────────
    async function handleRecalculate() {
        const due = parseFloat(perPlayerTarget);
        if (isNaN(due) || due < 0) return showToast('Enter a valid amount per player', 'error');
        setSaving(true);
        try {
            await fetch('/api/budget/contributions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId, amountDue: due })
            });
            showToast('Dues recalculated for all players');
            fetchData();
        } catch {
            showToast('Recalculation failed', 'error');
        } finally {
            setSaving(false);
        }
    }

    async function handleMarkPaid(contribution, paid) {
        try {
            await fetch('/api/budget/contributions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: contribution.id,
                    amountPaid: paid ? contribution.amountDue : 0,
                    paidAt: paid ? new Date().toISOString() : null
                })
            });
            showToast(paid ? `${contribution.player.name} marked as paid` : `${contribution.player.name} payment cleared`);
            fetchData();
        } catch {
            showToast('Update failed', 'error');
        }
    }

    async function handleUpdateContribution(id, field, value) {
        const contribution = contributions.find(c => c.id === id);
        if (!contribution) return;
        try {
            await fetch('/api/budget/contributions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    amountDue: field === 'amountDue' ? parseFloat(value) : contribution.amountDue,
                    amountPaid: field === 'amountPaid' ? parseFloat(value) : contribution.amountPaid
                })
            });
            fetchData();
        } catch {
            showToast('Update failed', 'error');
        }
    }

    // ─── Export ───────────────────────────────────────────────────────────────
    function copyBudgetSummary() {
        const lines = [
            `TOURNAMENT BUDGET SUMMARY`,
            `========================`,
            ``,
            `EXPENSE BREAKDOWN`,
            ...lineItems.map(item => {
                const est = item.estimatedCost != null ? `$${(item.estimatedCost * (item.perPlayer ? playerCount : 1)).toFixed(2)}` : 'TBD';
                const actual = item.actualCost != null ? `$${(item.actualCost * (item.perPlayer ? playerCount : 1)).toFixed(2)}` : '—';
                return `  ${item.category} | ${item.label}${item.perPlayer ? ` (×${playerCount})` : ''} | Est: ${est} | Actual: ${actual}`;
            }),
            ``,
            `TOTALS`,
            `  Estimated:  ${fmt(totalEstimated)}`,
            `  Actual:     ${fmt(totalActual)}`,
            `  Collected:  ${fmt(totalCollected)}`,
            `  Surplus:    ${surplus >= 0 ? '+' : ''}${fmt(surplus)}`,
            ``,
            `PLAYER PAYMENTS (${paidCount}/${contributions.length} paid)`,
            ...contributions.map(c => {
                const status = parseFloat(c.amountPaid) >= parseFloat(c.amountDue) && parseFloat(c.amountDue) > 0 ? '✅' : '⏳';
                return `  ${status} ${c.player.name} — Due: ${fmt(c.amountDue)} | Paid: ${fmt(c.amountPaid)}`;
            })
        ].join('\n');

        navigator.clipboard.writeText(lines).then(() => showToast('Budget summary copied to clipboard'));
    }

    // ─── Render ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                Loading budget data...
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
                    background: toast.type === 'error' ? '#dc2626' : 'var(--accent)',
                    color: toast.type === 'error' ? '#fff' : '#000',
                    padding: '0.75rem 1.25rem', borderRadius: 'var(--radius)',
                    fontWeight: 600, boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                    animation: 'fadeIn 0.2s ease'
                }}>
                    {toast.msg}
                </div>
            )}

            {/* ── Summary Bar ── */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    💰 Budget Overview
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                    {[
                        { label: 'Total Estimated', value: fmt(totalEstimated), color: 'var(--text-muted)' },
                        { label: 'Total Actual', value: fmt(totalActual), color: '#f59e0b' },
                        { label: 'Collected', value: fmt(totalCollected), color: 'var(--accent)' },
                        {
                            label: surplus >= 0 ? '🟢 Surplus' : '🔴 Shortfall',
                            value: `${surplus >= 0 ? '+' : ''}${fmt(Math.abs(surplus))}`,
                            color: surplus >= 0 ? 'var(--accent)' : '#ef4444'
                        }
                    ].map(stat => (
                        <div key={stat.label} style={{ background: 'var(--glass)', borderRadius: 'var(--radius)', padding: '1rem', border: '1px solid var(--glass-border)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>{stat.label}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                        </div>
                    ))}
                </div>
                {playerCount > 0 && totalEstimated > 0 && (
                    <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        📊 <strong style={{ color: 'var(--text-main)' }}>{fmt(totalEstimated / playerCount)}</strong> estimated per player across <strong style={{ color: 'var(--text-main)' }}>{playerCount}</strong> players
                    </div>
                )}
            </div>

            {/* ── Section Toggle ── */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[{ id: 'expenses', label: '📋 Expenses' }, { id: 'players', label: '👥 Player Dues' }].map(s => (
                    <button
                        key={s.id}
                        onClick={() => setActiveSection(s.id)}
                        className={activeSection === s.id ? 'btn' : 'btn-outline'}
                        style={{ fontSize: '0.9rem' }}
                    >
                        {s.label}
                    </button>
                ))}
                <button onClick={copyBudgetSummary} className="btn-outline" style={{ marginLeft: 'auto', fontSize: '0.85rem' }}>
                    📋 Copy Summary
                </button>
            </div>

            {/* ────────────────────────── EXPENSES SECTION ────────────────────────── */}
            {activeSection === 'expenses' && (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <h3 style={{ margin: 0, fontWeight: 700 }}>📋 Expense Planner</h3>
                        <button onClick={startNew} className="btn" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
                            + Add Line Item
                        </button>
                    </div>

                    {/* Add / Edit Form */}
                    {showForm && (
                        <form onSubmit={handleSaveItem} style={{
                            background: 'var(--glass)', borderRadius: 'var(--radius)', padding: '1.25rem',
                            border: '1px solid var(--accent)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem'
                        }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={labelStyle}>Category</label>
                                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                                        {CATEGORIES.map(c => <option key={c}>{CATEGORY_ICONS[c]} {c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Label *</label>
                                    <input required value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} style={inputStyle} placeholder="e.g. River Course Greens Fees" />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={labelStyle}>Estimated Cost ($)</label>
                                    <input type="number" min="0" step="0.01" value={form.estimatedCost} onChange={e => setForm(f => ({ ...f, estimatedCost: e.target.value }))} style={inputStyle} placeholder="0.00" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Actual Cost ($)</label>
                                    <input type="number" min="0" step="0.01" value={form.actualCost} onChange={e => setForm(f => ({ ...f, actualCost: e.target.value }))} style={inputStyle} placeholder="Leave blank if not yet paid" />
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="checkbox" id="perPlayer" checked={form.perPlayer} onChange={e => setForm(f => ({ ...f, perPlayer: e.target.checked }))} style={{ width: 16, height: 16 }} />
                                <label htmlFor="perPlayer" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer' }}>
                                    Per player cost (multiplied by {playerCount} players)
                                </label>
                            </div>
                            <div>
                                <label style={labelStyle}>Notes</label>
                                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={inputStyle} placeholder="Optional notes" />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowForm(false)} className="btn-outline" style={{ fontSize: '0.85rem' }}>Cancel</button>
                                <button type="submit" disabled={saving} className="btn" style={{ fontSize: '0.85rem' }}>
                                    {saving ? 'Saving...' : editingId ? 'Update Item' : 'Add Item'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Line Items Table */}
                    {lineItems.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📋</div>
                            <p>No expenses added yet.</p>
                            <p style={{ fontSize: '0.9rem' }}>Add line items to track greens fees, lodging, meals, and more.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                                        <th style={th}>Category</th>
                                        <th style={th}>Label</th>
                                        <th style={{ ...th, textAlign: 'right' }}>Estimated</th>
                                        <th style={{ ...th, textAlign: 'right' }}>Actual</th>
                                        <th style={{ ...th, textAlign: 'center' }}>Status</th>
                                        <th style={{ ...th, textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lineItems.map(item => {
                                        const estTotal = item.estimatedCost != null ? item.estimatedCost * (item.perPlayer ? playerCount : 1) : null;
                                        const actTotal = item.actualCost != null ? item.actualCost * (item.perPlayer ? playerCount : 1) : null;
                                        return (
                                            <tr key={item.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                <td style={td}><span style={{ fontSize: '1.2rem' }}>{CATEGORY_ICONS[item.category] || '📋'}</span> {item.category}</td>
                                                <td style={td}>
                                                    <div style={{ fontWeight: 500 }}>{item.label}</div>
                                                    {item.perPlayer && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>×{playerCount} players</div>}
                                                    {item.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.notes}</div>}
                                                </td>
                                                <td style={{ ...td, textAlign: 'right', color: 'var(--text-muted)' }}>{fmt(estTotal)}</td>
                                                <td style={{ ...td, textAlign: 'right', color: '#f59e0b', fontWeight: actTotal != null ? 600 : 400 }}>{fmt(actTotal)}</td>
                                                <td style={{ ...td, textAlign: 'center' }}><StatusBadge item={item} playerCount={playerCount} /></td>
                                                <td style={{ ...td, textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                        <button onClick={() => startEdit(item)} style={iconBtn}>✏️</button>
                                                        <button onClick={() => handleDeleteItem(item.id)} style={{ ...iconBtn, color: '#ef4444' }}>🗑️</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr style={{ borderTop: '2px solid var(--glass-border)', fontWeight: 700 }}>
                                        <td colSpan={2} style={{ ...td, color: 'var(--text-muted)' }}>TOTAL</td>
                                        <td style={{ ...td, textAlign: 'right', color: 'var(--text-muted)' }}>{fmt(totalEstimated)}</td>
                                        <td style={{ ...td, textAlign: 'right', color: '#f59e0b' }}>{fmt(totalActual)}</td>
                                        <td colSpan={2} />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ────────────────────────── PLAYER DUES SECTION ────────────────────────── */}
            {activeSection === 'players' && (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <h3 style={{ margin: 0, fontWeight: 700 }}>👥 Player Dues</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={perPlayerTarget}
                                    onChange={e => setPerPlayerTarget(e.target.value)}
                                    placeholder={totalEstimated && playerCount ? (totalEstimated / playerCount).toFixed(2) : 'Amount per player'}
                                    style={{ ...inputStyle, width: '180px' }}
                                />
                                <button onClick={handleRecalculate} disabled={saving} className="btn" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                    🔁 Set for All
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    {totalDue > 0 && (
                        <div style={{ marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                                <span>{paidCount} of {contributions.length} players paid</span>
                                <span>{fmt(totalCollected)} / {fmt(totalDue)} collected</span>
                            </div>
                            <div style={{ height: '8px', background: 'var(--glass)', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${Math.min(100, (totalCollected / totalDue) * 100)}%`,
                                    background: 'var(--accent)',
                                    borderRadius: '999px',
                                    transition: 'width 0.5s ease'
                                }} />
                            </div>
                        </div>
                    )}

                    {contributions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>👥</div>
                            <p>No player contributions yet.</p>
                            {playerCount === 0
                                ? <p style={{ fontSize: '0.9rem' }}>Add players to your tournament first.</p>
                                : <p style={{ fontSize: '0.9rem' }}>Enter an amount above and click "Set for All" to initialize dues for all {playerCount} players.</p>
                            }
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                                        <th style={th}>Player</th>
                                        <th style={{ ...th, textAlign: 'right' }}>Amount Due</th>
                                        <th style={{ ...th, textAlign: 'right' }}>Amount Paid</th>
                                        <th style={{ ...th, textAlign: 'center' }}>Status</th>
                                        <th style={{ ...th, textAlign: 'center' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contributions.map(c => {
                                        const isPaid = parseFloat(c.amountPaid) >= parseFloat(c.amountDue) && parseFloat(c.amountDue) > 0;
                                        return (
                                            <tr key={c.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                <td style={{ ...td, fontWeight: 500 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        {c.player.imageUrl
                                                            ? <img src={c.player.imageUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                                                            : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)' }}>
                                                                {c.player.name?.charAt(0).toUpperCase()}
                                                            </div>
                                                        }
                                                        {c.player.name}
                                                    </div>
                                                </td>
                                                <td style={{ ...td, textAlign: 'right' }}>
                                                    <input
                                                        type="number"
                                                        defaultValue={c.amountDue}
                                                        min="0"
                                                        step="0.01"
                                                        onBlur={e => handleUpdateContribution(c.id, 'amountDue', e.target.value)}
                                                        style={{ ...inputStyle, width: '100px', textAlign: 'right', padding: '4px 8px', fontSize: '0.85rem' }}
                                                    />
                                                </td>
                                                <td style={{ ...td, textAlign: 'right', color: isPaid ? 'var(--accent)' : 'var(--text-muted)', fontWeight: isPaid ? 700 : 400 }}>
                                                    {fmt(c.amountPaid)}
                                                </td>
                                                <td style={{ ...td, textAlign: 'center' }}>
                                                    {isPaid
                                                        ? <span style={badge('var(--accent)', '#000')}>✅ Paid</span>
                                                        : parseFloat(c.amountPaid) > 0
                                                            ? <span style={badge('#f59e0b', '#000')}>⚠️ Partial</span>
                                                            : <span style={badge('#334', 'var(--text-muted)')}>⏳ Pending</span>
                                                    }
                                                </td>
                                                <td style={{ ...td, textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => handleMarkPaid(c, !isPaid)}
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            padding: '4px 10px',
                                                            borderRadius: 'var(--radius)',
                                                            border: '1px solid var(--glass-border)',
                                                            background: isPaid ? 'var(--glass)' : 'var(--accent)',
                                                            color: isPaid ? 'var(--text-muted)' : '#000',
                                                            cursor: 'pointer',
                                                            fontWeight: 600,
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        {isPaid ? 'Clear' : '✓ Mark Paid'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────
const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
};

const inputStyle = {
    width: '100%',
    background: 'var(--glass)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text-main)',
    padding: '8px 12px',
    fontSize: '0.9rem',
    boxSizing: 'border-box',
    outline: 'none'
};

const th = {
    padding: '8px 12px',
    fontSize: '0.8rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
};

const td = {
    padding: '10px 12px',
    verticalAlign: 'middle'
};

const iconBtn = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '4px 6px',
    borderRadius: 'var(--radius)',
    transition: 'background 0.2s'
};
