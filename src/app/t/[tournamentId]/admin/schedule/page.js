"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import Link from 'next/link';

export default function AdminSchedulePage() {
    const params = useParams();
    const tournamentId = params?.tournamentId;

    const [players, setPlayers] = useState([]);
    const [rounds, setRounds] = useState([]);
    const [selectedRound, setSelectedRound] = useState(1);
    const [teeTimes, setTeeTimes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState(null);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            if (!tournamentId) return;

            try {
                const [pRes, sRes, setRes] = await Promise.all([
                    fetch(`/api/players?tournamentId=${tournamentId}`),
                    fetch(`/api/schedule?tournamentId=${tournamentId}`),
                    fetch(`/api/settings?tournamentId=${tournamentId}`)
                ]);

                const pData = await pRes.json();
                const sData = await sRes.json();
                const settingsData = await setRes.json();

                setSettings(settingsData);
                setPlayers(pData);

                // Set number of rounds from settings
                if (settingsData.numberOfRounds) {
                    setRounds(Array.from({ length: settingsData.numberOfRounds }, (_, i) => i + 1));
                }

                if (Array.isArray(sData)) {
                    setTeeTimes(sData);
                } else {
                    console.error('Expected array for schedule, got:', sData);
                    setTeeTimes([]);
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [tournamentId]);

    // Get group data for display or logic
    const currentGroups = teeTimes
        .filter(t => t.round === selectedRound)
        .sort((a, b) => a.time.localeCompare(b.time));

    const [localGroups, setLocalGroups] = useState([]);

    useEffect(() => {
        // Sync local state when round changes or initial load
        const filtered = teeTimes
            .filter(t => t.round === selectedRound)
            .map(t => ({
                id: t.id || Math.random().toString(), // temp id for new groups
                time: t.time,
                players: t.players || []
            }))
            .sort((a, b) => a.time.localeCompare(b.time));

        setLocalGroups(filtered);
    }, [selectedRound, teeTimes]);

    const addGroup = () => {
        setLocalGroups([...localGroups, { id: Math.random().toString(), time: '10:00', players: [] }]);
    };

    const generateSlots = () => {
        if (!settings?.roundTimeConfig?.[selectedRound]) {
            alert('Please configure Start Time and Interval in Settings first.');
            return;
        }

        const { startTime, interval } = settings.roundTimeConfig[selectedRound];
        if (!startTime || !interval) {
            alert('Start Time or Interval missing for this round.');
            return;
        }

        if (localGroups.length > 0 && !confirm('This will append new slots. Continue?')) {
            return;
        }

        const existingCount = localGroups.length;
        const localAssignedCount = localGroups.reduce((acc, g) => acc + g.players.length, 0);
        const playersToAssign = players.length - localAssignedCount;
        const groupsNeeded = Math.ceil(Math.max(playersToAssign, 1) / 4);

        const newGroups = [];
        let currentTime = startTime;

        // Helper to add minutes to time string "HH:MM"
        const addMinutes = (time, mins) => {
            const [h, m] = time.split(':').map(Number);
            const date = new Date(2000, 0, 1, h, m);
            date.setMinutes(date.getMinutes() + mins);
            const nh = date.getHours().toString().padStart(2, '0');
            const nm = date.getMinutes().toString().padStart(2, '0');
            return `${nh}:${nm}`;
        };

        // If appending, start after last group?
        if (existingCount > 0) {
            const lastTime = localGroups[existingCount - 1].time;
            currentTime = addMinutes(lastTime, interval);
        }

        for (let i = 0; i < groupsNeeded; i++) {
            newGroups.push({
                id: Math.random().toString(),
                time: currentTime,
                players: []
            });
            currentTime = addMinutes(currentTime, interval);
        }

        setLocalGroups([...localGroups, ...newGroups]);
    };

    const removeGroup = (groupId) => {
        if (confirm('Delete this group?')) {
            setLocalGroups(localGroups.filter(g => g.id !== groupId));
        }
    };

    const updateGroupTime = (groupId, newTime) => {
        setLocalGroups(localGroups.map(g => g.id === groupId ? { ...g, time: newTime } : g));
    };

    const addPlayerToGroup = (groupId, player) => {
        setLocalGroups(localGroups.map(g => {
            if (g.id === groupId) {
                return { ...g, players: [...g.players, { id: player.id, name: player.name }] };
            }
            return g;
        }));
    };

    const removePlayerFromGroup = (groupId, playerId) => {
        setLocalGroups(localGroups.map(g => {
            if (g.id === groupId) {
                return { ...g, players: g.players.filter(p => p.id !== playerId) };
            }
            return g;
        }));
    };

    const handleSave = async () => {
        if (!tournamentId) return;
        setSaving(true);
        try {
            const dataToSave = {
                tournamentId,
                round: selectedRound,
                groups: localGroups.map(g => ({
                    time: g.time,
                    players: g.players
                }))
            };

            const res = await fetch('/api/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave)
            });

            if (res.ok) {
                // Refetch to get real IDs
                const sRes = await fetch(`/api/schedule?tournamentId=${tournamentId}`);
                const sData = await sRes.json();
                setTeeTimes(sData);
                alert('Schedule saved!');
            } else {
                alert('Failed to save');
            }
        } catch (e) {
            console.error(e);
            alert('Error saving');
        } finally {
            setSaving(false);
        }
    };

    // Calculate unassigned based on LOCAL state
    const localAssignedIds = localGroups.flatMap(g => g.players.map(p => p.id));
    const localUnassigned = players.filter(p => !localAssignedIds.includes(p.id));

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Link href={`/t/${tournamentId}/admin/settings`} style={{ color: 'var(--text-muted)' }}>
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="section-title" style={{ margin: 0 }}>Tee Time Scheduler</h1>
            </div>

            {rounds.length === 0 && !loading && (
                <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No rounds configured yet.</p>
                    <Link href={`/t/${tournamentId}/admin/settings`} className="btn">
                        Go to Settings to Add Rounds
                    </Link>
                </div>
            )}

            {rounds.length > 0 && (
                <>
                    {/* Round Tabs */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                        {rounds.map(r => (
                            <button
                                key={r}
                                onClick={() => setSelectedRound(r)}
                                className={selectedRound === r ? 'btn' : 'btn-outline'}
                                style={{ padding: '0.5rem 1.5rem' }}
                            >
                                Round {r}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>
                        {/* Unassigned Players Sidebar */}
                        <div className="card" style={{ height: 'fit-content', maxHeight: '80vh', overflowY: 'auto' }}>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Unassigned ({localUnassigned.length})</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {localUnassigned.map(player => (
                                    <div key={player.id} style={{
                                        padding: '10px',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: 'var(--radius)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{ fontSize: '0.9rem' }}>{player.name}</span>
                                    </div>
                                ))}
                                {localUnassigned.length === 0 && <span style={{ color: 'var(--accent)' }}>All assigned!</span>}
                            </div>
                        </div>

                        {/* Groups Area */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button onClick={addGroup} className="btn-outline">
                                        <Plus size={18} style={{ marginRight: '8px' }} />
                                        Add Group
                                    </button>
                                    <button onClick={generateSlots} className="btn-outline">
                                        Generate Slots
                                    </button>
                                </div>
                                <button onClick={handleSave} className="btn" disabled={saving}>
                                    <Save size={18} style={{ marginRight: '8px' }} />
                                    {saving ? 'Saving...' : 'Save Schedule'}
                                </button>
                            </div>

                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                {localGroups.map((group, index) => (
                                    <div key={group.id} className="card" style={{ border: '1px solid var(--accent)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <span style={{ fontWeight: 'bold' }}>Group {index + 1}</span>
                                                <input
                                                    type="time"
                                                    value={group.time}
                                                    onChange={(e) => updateGroupTime(group.id, e.target.value)}
                                                    style={{
                                                        background: 'var(--bg-dark)',
                                                        border: '1px solid var(--glass-border)',
                                                        color: 'var(--text-main)',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px'
                                                    }}
                                                />
                                            </div>
                                            <button onClick={() => removeGroup(group.id)} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer' }}>
                                                <X size={18} />
                                            </button>
                                        </div>

                                        <div style={{ minHeight: '50px' }}>
                                            {group.players.map(p => (
                                                <div key={p.id} style={{
                                                    padding: '8px',
                                                    marginBottom: '8px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    borderRadius: '4px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between'
                                                }}>
                                                    {p.name}
                                                    <button onClick={() => removePlayerFromGroup(group.id, p.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14} /></button>
                                                </div>
                                            ))}

                                            {/* Add Player Dropdown */}
                                            {group.players.length < 4 && localUnassigned.length > 0 && (
                                                <select
                                                    value=""
                                                    onChange={(e) => {
                                                        const pid = e.target.value;
                                                        const p = players.find(x => x.id === pid);
                                                        if (p) addPlayerToGroup(group.id, p);
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px',
                                                        background: 'var(--bg-dark)',
                                                        border: '1px dashed var(--text-muted)',
                                                        color: 'var(--text-muted)',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <option value="">+ Add Player</option>
                                                    {localUnassigned.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
