"use client";

import { useState } from 'react';
import { Trash2, ArrowUp, ArrowDown, UserPlus, Edit2, Save, X } from 'lucide-react';
import Link from 'next/link';

export default function PlayerList({ initialPlayers }) {
    const [players, setPlayers] = useState(initialPlayers);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [deleting, setDeleting] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({
        name: '',
        handicapIndex: '',
        hcpRiver: '',
        hcpPlantation: '',
        hcpRNK: ''
    });

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this player?')) return;
        setDeleting(id);
        try {
            await fetch(`/api/players/${id}`, { method: 'DELETE' });
            setPlayers(players.filter(p => p.id !== id));
        } catch (e) {
            console.error(e);
            alert('Failed to delete player');
        } finally {
            setDeleting(null);
        }
    };

    const startEdit = (player) => {
        setEditingId(player.id);
        setEditForm({
            name: player.name,
            handicapIndex: player.handicapIndex,
            hcpRiver: player.hcpRiver,
            hcpPlantation: player.hcpPlantation,
            hcpRNK: player.hcpRNK
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({ name: '', handicapIndex: '', hcpRiver: '', hcpPlantation: '', hcpRNK: '' });
    };

    const saveEdit = async (id) => {
        try {
            const res = await fetch(`/api/players/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editForm.name,
                    handicapIndex: parseFloat(editForm.handicapIndex) || 0,
                    hcpRiver: parseInt(editForm.hcpRiver) || 0,
                    hcpPlantation: parseInt(editForm.hcpPlantation) || 0,
                    hcpRNK: parseInt(editForm.hcpRNK) || 0
                })
            });

            if (res.ok) {
                const updated = await res.json();
                setPlayers(players.map(p => p.id === id ? updated : p));
                setEditingId(null);
            } else {
                alert('Failed to update player');
            }
        } catch (e) {
            console.error(e);
            alert('Error updating player');
        }
    };

    // ... sort logic ...
    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });

        const sorted = [...players].sort((a, b) => {
            if (a[key] < b[key]) return direction === 'ascending' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'ascending' ? 1 : -1;
            return 0;
        });

        setPlayers(sorted);
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
    };

    return (
        <div>
            {/* Header ... */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="section-title" style={{ marginBottom: 0 }}>Players</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={async () => {
                            if (confirm('Are you SUPER SURE? This will delete ALL scores for the entire tournament. This cannot be undone.')) {
                                try {
                                    await fetch('/api/scores', { method: 'DELETE' });
                                    alert('All scores cleared!');
                                } catch (e) {
                                    console.error(e);
                                    alert('Failed to clear scores');
                                }
                            }
                        }}
                        className="btn-outline"
                        style={{ borderColor: '#ff6b6b', color: '#ff6b6b' }}
                    >
                        Clear Scores
                    </button>
                    <Link href="/players/import" className="btn-outline">
                        Import
                    </Link>
                    <Link href="/players/register" className="btn">
                        <UserPlus size={20} style={{ marginRight: '8px' }} />
                        Register
                    </Link>
                </div>
            </div>

            <div className="card" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('name')}>Name {getSortIcon('name')}</th>
                            <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('handicapIndex')}>Index {getSortIcon('handicapIndex')}</th>
                            <th style={{ padding: '1rem' }}>River</th>
                            <th style={{ padding: '1rem' }}>Plantation</th>
                            <th style={{ padding: '1rem' }}>RNK</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {players.map((player) => (
                            <tr key={player.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                                    {editingId === player.id ? (
                                        <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ padding: '4px', width: '100%' }} />
                                    ) : player.name}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {editingId === player.id ? (
                                        <input type="number" step="0.1" value={editForm.handicapIndex} onChange={e => setEditForm({ ...editForm, handicapIndex: e.target.value })} style={{ padding: '4px', width: '50px' }} />
                                    ) : player.handicapIndex}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {editingId === player.id ? (
                                        <input type="number" value={editForm.hcpRiver} onChange={e => setEditForm({ ...editForm, hcpRiver: e.target.value })} style={{ padding: '4px', width: '40px' }} />
                                    ) : player.hcpRiver}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {editingId === player.id ? (
                                        <input type="number" value={editForm.hcpPlantation} onChange={e => setEditForm({ ...editForm, hcpPlantation: e.target.value })} style={{ padding: '4px', width: '40px' }} />
                                    ) : player.hcpPlantation}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {editingId === player.id ? (
                                        <input type="number" value={editForm.hcpRNK} onChange={e => setEditForm({ ...editForm, hcpRNK: e.target.value })} style={{ padding: '4px', width: '40px' }} />
                                    ) : player.hcpRNK}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                    {editingId === player.id ? (
                                        <>
                                            <button onClick={() => saveEdit(player.id)} className="btn" style={{ padding: '6px' }}><Save size={16} /></button>
                                            <button onClick={cancelEdit} className="btn-outline" style={{ padding: '6px' }}><X size={16} /></button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => startEdit(player)} className="btn-outline" style={{ padding: '6px' }}><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(player.id)} className="btn-outline" style={{ padding: '6px 12px', borderColor: '#ff6b6b', color: '#ff6b6b' }} disabled={deleting === player.id}><Trash2 size={16} /></button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {players.length === 0 && (
                            <tr>
                                <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No players registered yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
