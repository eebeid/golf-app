
"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import Link from 'next/link';

export default function AdminSchedulePage() {
    const [players, setPlayers] = useState([]);
    const [rounds, setRounds] = useState([1, 2, 3]);
    const [selectedRound, setSelectedRound] = useState(1);
    const [teeTimes, setTeeTimes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState(null);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [pRes, sRes, setRes] = await Promise.all([
                    fetch('/api/players'),
                    fetch('/api/schedule'),
                    fetch('/api/settings')
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

                // Parse schedule
                // sData is array of TeeTime objects { round, time, players: [] }
                // We need to filter for selected round client-side or re-fetch

                // For simplicity, we filter by selectedRound
                // But better to store all and filter in render
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
    }, []);

    // Get current round's groups
    const currentGroups = teeTimes
        .filter(t => t.round === selectedRound)
        .sort((a, b) => a.time.localeCompare(b.time));

    // Get unassigned players
    const assignedPlayerIds = currentGroups.flatMap(g => g.players.map(p => p.id));
    const unassignedPlayers = players.filter(p => !assignedPlayerIds.includes(p.id));

    // Helper to get local state of current round for editing
    // We'll manage local state for the current round "session"
    // To make drag/drop easier, we'll convert the data structure a bit or just use buttons

    // Actually, let's keep it simple: lists with "Add to Group X" buttons

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
        // Estimate groups needed: total players / 4
        // Or just generate 10 slots? Let's generate enough for all players not yet assigned

        const unassignedCount = unassignedPlayers.length; // From parent scope... wait, unassignedPlayers depends on currentGroups which depends on teeTimes. 
        // We act on local state.

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
                // Check if full? Maybe 4 max
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
        setSaving(true);
        try {
            // Prepare data: filter out empty groups? or allow them
            const dataToSave = {
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
                const sRes = await fetch('/api/schedule');
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
                <Link href="/admin/settings" style={{ color: 'var(--text-muted)' }}>
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="section-title" style={{ margin: 0 }}>Tee Time Scheduler</h1>
            </div>

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

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
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
                                {/* Small + buttons for each group? Or drag/drop? 
                                    Simple alternative: "Add to..." dropdown or just click player then click group.
                                    Let's do: click + then show modal?
                                    Actually simplest layout: List unassigned next to groups. 
                                    Drag and drop would be best but implementing native dnd quickly is risky.
                                    Let's do: Green + button next to player name, 
                                    clicking it puts them in the first available slot? 
                                    Or: next to each group, have "Add Player" dropdown.
                                */}
                            </div>
                        ))}
                        {localUnassigned.length === 0 && <span style={{ color: 'var(--accent)' }}>All assigned!</span>}
                    </div>
                </div>

                {/* Groups Area */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <button onClick={addGroup} className="btn-outline">
                            <Plus size={18} style={{ marginRight: '8px' }} />
                            Add Group
                        </button>
                        <button onClick={generateSlots} className="btn-outline" style={{ marginLeft: '10px' }}>
                            Generate Slots
                        </button>
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
        </div>
    );
}
