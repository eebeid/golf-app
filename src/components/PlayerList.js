"use client";

import { useState } from 'react';
import { Trash2, ArrowUp, ArrowDown, UserPlus, Edit2, Save, X } from 'lucide-react';
import Link from 'next/link';

export default function PlayerList({ initialPlayers }) {
    const [players, setPlayers] = useState(initialPlayers);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [deleting, setDeleting] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', handicapIndex: '', courseHandicap: '' });

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
            courseHandicap: player.courseHandicap
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({ name: '', handicapIndex: '', courseHandicap: '' });
    };

    const saveEdit = async (id) => {
        try {
            const res = await fetch(`/api/players/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editForm.name,
                    handicapIndex: parseFloat(editForm.handicapIndex) || 0,
                    courseHandicap: parseInt(editForm.courseHandicap) || 0
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

    // ... sort logic remains mostly same, just updating column keys if needed ...
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

    // ... getSortIcon ...
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
                            <th
                                style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}
                                onClick={() => handleSort('name')}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Name {getSortIcon('name')}
                                </div>
                            </th>
                            <th
                                style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}
                                onClick={() => handleSort('handicapIndex')}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Index {getSortIcon('handicapIndex')}
                                </div>
                            </th>
                            <th
                                style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}
                                onClick={() => handleSort('courseHandicap')}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Course Hcp {getSortIcon('courseHandicap')}
                                </div>
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {players.map((player) => (
                            <tr key={player.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                                    {editingId === player.id ? (
                                        <input
                                            value={editForm.name}
                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                            style={{ padding: '4px', width: '100%' }}
                                        />
                                    ) : player.name}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {editingId === player.id ? (
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={editForm.handicapIndex}
                                            onChange={e => setEditForm({ ...editForm, handicapIndex: e.target.value })}
                                            style={{ padding: '4px', width: '60px' }}
                                        />
                                    ) : player.handicapIndex}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {editingId === player.id ? (
                                        <input
                                            type="number"
                                            value={editForm.courseHandicap}
                                            onChange={e => setEditForm({ ...editForm, courseHandicap: e.target.value })}
                                            style={{ padding: '4px', width: '60px' }}
                                        />
                                    ) : player.courseHandicap}
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
                                            <button
                                                onClick={() => handleDelete(player.id)}
                                                className="btn-outline"
                                                style={{ padding: '6px 12px', borderColor: '#ff6b6b', color: '#ff6b6b' }}
                                                disabled={deleting === player.id}
                                            >
                                                <Trash2 size={16} />
                                            </button>
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
