import React, { useState } from 'react';
import Link from 'next/link';

export default function PlayerSettingsTab({ 
    tournamentId, 
    players, 
    setPlayers, 
    fetchPlayers, 
    courses, 
    allowPlayerEdits, 
    handleTogglePlayerEdits, 
    tournamentName = 'Tournament'
}) {
    const [newPlayerName, setNewPlayerName] = useState('');
    const [newPlayerEmail, setNewPlayerEmail] = useState('');
    const [newPlayerPhone, setNewPlayerPhone] = useState('');
    const [newPlayerHandicap, setNewPlayerHandicap] = useState('');
    const [newPlayerRoomNumber, setNewPlayerRoomNumber] = useState('');
    const [newPlayerHouseNumber, setNewPlayerHouseNumber] = useState('');
    const [addingPlayer, setAddingPlayer] = useState(false);

    // Edit Player State
    const [editingPlayerId, setEditingPlayerId] = useState(null);
    const [editPlayerForm, setEditPlayerForm] = useState({
        name: '',
        email: '',
        phone: '',
        handicapIndex: '',
        isManager: false,
        roomNumber: '',
        houseNumber: ''
    });

    // Import Players State
    const [showImport, setShowImport] = useState(false);
    const [importText, setImportText] = useState('');
    const [importPreview, setImportPreview] = useState([]);
    const [importingPlayers, setImportingPlayers] = useState(false);
    const [importMessage, setImportMessage] = useState('');

    const parseImportText = (text) => {
        const rows = text.trim().split('\n').filter(l => l.trim());
        return rows.map(row => {
            const parts = row.includes('\t') ? row.split('\t') : row.split(',');
            const clean = parts.map(p => p.trim().replace(/^"|"$/g, ''));
            return {
                name: clean[0] || '',
                email: clean[1] || '',
                phone: clean[2] || '',
                handicapIndex: clean[3] || '0'
            };
        }).filter(r => r.name);
    };

    const handleImportTextChange = (text) => {
        setImportText(text);
        setImportPreview(parseImportText(text));
        setImportMessage('');
    };

    const handleImportFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => handleImportTextChange(ev.target.result);
        reader.readAsText(file);
    };

    const handleImportPlayers = async () => {
        if (importPreview.length === 0) return;
        setImportingPlayers(true);
        setImportMessage('');
        let added = 0, failed = 0;
        for (const player of importPreview) {
            try {
                const res = await fetch('/api/players', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: player.name,
                        email: player.email || null,
                        phone: player.phone || null,
                        handicapIndex: parseFloat(player.handicapIndex) || 0,
                        tournamentId
                    })
                });
                if (res.ok) added++; else failed++;
            } catch { failed++; }
        }
        await fetchPlayers();
        setImportMessage(`✅ Imported ${added} player(s)${failed > 0 ? `, ${failed} failed` : ''}.`);
        setImportText('');
        setImportPreview([]);
        setImportingPlayers(false);
    };

    const handleAddPlayer = async (e) => {
        e.preventDefault();
        setAddingPlayer(true);

        try {
            const res = await fetch('/api/players', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newPlayerName,
                    email: newPlayerEmail,
                    phone: newPlayerPhone,
                    handicapIndex: parseFloat(newPlayerHandicap) || 0,
                    roomNumber: newPlayerRoomNumber,
                    houseNumber: newPlayerHouseNumber,
                    tournamentId
                })
            });

            if (res.ok) {
                const added = await res.json();
                setPlayers([...players, added]);
                setNewPlayerName('');
                setNewPlayerEmail('');
                setNewPlayerPhone('');
                setNewPlayerHandicap('');
                setNewPlayerRoomNumber('');
                setNewPlayerHouseNumber('');
                alert('Player added successfully');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to add player');
            }
        } catch (err) {
            console.error(err);
            alert('Error adding player');
        } finally {
            setAddingPlayer(false);
        }
    };

    const handleEditPlayerClick = (player) => {
        setEditingPlayerId(player.id);
        const rawCourseData = player.courseData || {};

        const defaultedCourseData = { ...rawCourseData };
        courses.forEach(course => {
            if (!defaultedCourseData[course.id]?.tee && Array.isArray(course.tees) && course.tees.length > 0) {
                const longestTee = [...course.tees].sort((a, b) => (b.yardage || 0) - (a.yardage || 0))[0];
                defaultedCourseData[course.id] = {
                    ...defaultedCourseData[course.id],
                    tee: longestTee.name
                };
            }
        });

        setEditPlayerForm({
            name: player.name || '',
            email: player.email || '',
            phone: player.phone || '',
            handicapIndex: player.handicapIndex !== null && player.handicapIndex !== undefined ? String(player.handicapIndex) : '',
            courseData: defaultedCourseData,
            isManager: !!player.isManager,
            roomNumber: player.roomNumber || '',
            houseNumber: player.houseNumber || ''
        });
    };

    const handleCancelEditPlayer = () => {
        setEditingPlayerId(null);
        setEditPlayerForm({ name: '', email: '', phone: '', handicapIndex: '', courseData: {}, roomNumber: '', houseNumber: '' });
    };

    const handleSavePlayerEdit = async (playerId) => {
        try {
            const hcp = parseFloat(editPlayerForm.handicapIndex);
            if (isNaN(hcp)) {
                alert('Please enter a valid handicap index');
                return;
            }

            const payload = {
                name: editPlayerForm.name,
                email: editPlayerForm.email || null,
                phone: editPlayerForm.phone || null,
                handicapIndex: hcp,
                courseData: editPlayerForm.courseData || {},
                isManager: editPlayerForm.isManager,
                roomNumber: editPlayerForm.roomNumber || null,
                houseNumber: editPlayerForm.houseNumber || null
            };

            const res = await fetch(`/api/players/${playerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                await fetchPlayers();
                handleCancelEditPlayer();
            } else {
                alert('Failed to update player');
            }
        } catch (error) {
            console.error('Error updating player:', error);
            alert('Failed to update player');
        }
    };

    const handleDeletePlayer = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) return;

        try {
            const res = await fetch(`/api/players/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setPlayers(players.filter(p => p.id !== id));
                alert('Player deleted successfully');
            } else {
                alert('Failed to delete player');
            }
        } catch (e) {
            console.error(e);
            alert('Error deleting player');
        }
    };

    const handleClearAllScores = async () => {
        if (window.confirm('Are you SUPER SURE? This will delete ALL scores for the entire tournament. This cannot be undone.')) {
            try {
                const res = await fetch('/api/scores', { method: 'DELETE' });
                if (res.ok) {
                    alert('All scores cleared!');
                    // Optionally refresh data
                } else {
                    const errorData = await res.json();
                    const msg = errorData.details ? `${errorData.error}: ${errorData.details}` : (errorData.error || 'Unknown error');
                    alert(`Failed to clear scores: ${msg}`);
                }
            } catch (err) {
                console.error('Error clearing scores', err);
            }
        }
    };

    return (
                        <div className="card">
                            <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Player Information</h2>

                            {/* Allow Player Edits toggle */}
                            <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', marginBottom: '0.2rem' }}>Allow Players to Edit Their Info</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>When enabled, players can update their name, contact info, and tee box on the Players page.</div>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', flexShrink: 0 }}>
                                    <input
                                        type="checkbox"
                                        checked={allowPlayerEdits}
                                        onChange={e => handleTogglePlayerEdits(e.target.checked)}
                                        style={{ accentColor: 'var(--accent)', width: '18px', height: '18px' }}
                                    />
                                    <span style={{ fontSize: '0.9rem', color: allowPlayerEdits ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 'bold' }}>
                                        {allowPlayerEdits ? 'Enabled' : 'Disabled'}
                                    </span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>

                                <Link href={`/t/${tournamentId}/admin/schedule`} className="btn" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                    Manage Schedule
                                </Link>
                                {(() => {
                                    const emailList = players.filter(p => p.email).map(p => p.email);
                                    const withoutEmail = players.filter(p => !p.email);
                                    const href = emailList.length > 0
                                        ? `mailto:?bcc=${encodeURIComponent(emailList.join(','))}&subject=${encodeURIComponent(tournamentName)}`
                                        : null;
                                    return (
                                        <a
                                            href={href || undefined}
                                            onClick={!href ? (e) => { e.preventDefault(); alert('No players have email addresses on file.'); } : undefined}
                                            className="btn-outline"
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', cursor: 'pointer' }}
                                            title={withoutEmail.length > 0 ? `${withoutEmail.length} player(s) have no email and will be skipped` : 'Email all players'}
                                        >
                                            ✉️ Email All Players
                                            {emailList.length > 0 && (
                                                <span style={{ fontSize: '0.75rem', background: 'var(--accent)', color: '#000', borderRadius: '999px', padding: '1px 7px', fontWeight: 'bold' }}>
                                                    {emailList.length}
                                                </span>
                                            )}
                                        </a>
                                    );
                                })()}
                                <button
                                    onClick={handleClearAllScores}
                                    className="btn-outline"
                                    style={{ borderColor: '#ff6b6b', color: '#ff6b6b' }}
                                >
                                    Clear Scores
                                </button>
                            </div>

                            <div style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)' }}>
                                <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Add New Player</h3>
                                <form onSubmit={handleAddPlayer}>
                                    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Name</label>
                                            <input
                                                value={newPlayerName}
                                                onChange={e => setNewPlayerName(e.target.value)}
                                                placeholder="Player Name"
                                                required
                                                style={{ width: '100%', padding: '8px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Email (Optional)</label>
                                            <input
                                                type="email"
                                                value={newPlayerEmail}
                                                onChange={e => setNewPlayerEmail(e.target.value)}
                                                placeholder="player@example.com"
                                                style={{ width: '100%', padding: '8px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Phone (Optional)</label>
                                            <input
                                                type="tel"
                                                value={newPlayerPhone}
                                                onChange={e => setNewPlayerPhone(e.target.value)}
                                                placeholder="e.g. 123-456-7890"
                                                style={{ width: '100%', padding: '8px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Handicap Index</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={newPlayerHandicap}
                                                onChange={e => setNewPlayerHandicap(e.target.value)}
                                                placeholder="e.g. 12.4"
                                                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Room # (Optional)</label>
                                            <input
                                                value={newPlayerRoomNumber}
                                                onChange={e => setNewPlayerRoomNumber(e.target.value)}
                                                placeholder="Room Number"
                                                style={{ width: '100%', padding: '8px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>House # (Optional)</label>
                                            <input
                                                value={newPlayerHouseNumber}
                                                onChange={e => setNewPlayerHouseNumber(e.target.value)}
                                                placeholder="House Number"
                                                style={{ width: '100%', padding: '8px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                            />
                                        </div>
                                    </div>



                                    <button
                                        type="submit"
                                        className="btn"
                                        disabled={addingPlayer}
                                        style={{ marginTop: '1rem' }}
                                    >
                                        {addingPlayer ? 'Adding...' : 'Add Player'}
                                    </button>
                                </form>
                            </div>

                            {/* Import Players */}
                            <div style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => { setShowImport(v => !v); setImportMessage(''); }}>
                                    <h3 style={{ margin: 0, color: 'var(--accent)' }}>⬆️ Import Players (CSV)</h3>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>{showImport ? '▲' : '▼'}</span>
                                </div>

                                {showImport && (
                                    <div style={{ marginTop: '1.25rem' }}>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                            Paste or upload a CSV/TSV file with columns in this order: <strong>Name, Email, Phone, Handicap Index</strong>. Email, phone and handicap are optional.
                                        </p>
                                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                                            <label className="btn-outline" style={{ padding: '6px 14px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                                📂 Upload file
                                                <input type="file" accept=".csv,.tsv,.txt" onChange={handleImportFile} style={{ display: 'none' }} />
                                            </label>
                                        </div>
                                        <textarea
                                            rows={5}
                                            placeholder={`John Smith, john@example.com, 555-1234, 12.4\nJane Doe, , , 5.1`}
                                            value={importText}
                                            onChange={e => handleImportTextChange(e.target.value)}
                                            style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }}
                                        />

                                        {importPreview.length > 0 && (
                                            <div style={{ marginTop: '1rem' }}>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{importPreview.length} player(s) ready to import:</div>
                                                <div style={{ overflowX: 'auto' }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                                        <thead>
                                                            <tr style={{ color: 'var(--accent)', borderBottom: '1px solid var(--glass-border)' }}>
                                                                <th style={{ padding: '6px 8px', textAlign: 'left' }}>Name</th>
                                                                <th style={{ padding: '6px 8px', textAlign: 'left' }}>Email</th>
                                                                <th style={{ padding: '6px 8px', textAlign: 'left' }}>Phone</th>
                                                                <th style={{ padding: '6px 8px', textAlign: 'left' }}>HCP</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {importPreview.map((p, i) => (
                                                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                                    <td style={{ padding: '5px 8px' }}>{p.name}</td>
                                                                    <td style={{ padding: '5px 8px', color: 'var(--text-muted)' }}>{p.email || '—'}</td>
                                                                    <td style={{ padding: '5px 8px', color: 'var(--text-muted)' }}>{p.phone || '—'}</td>
                                                                    <td style={{ padding: '5px 8px' }}>{p.handicapIndex || '0'}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <button
                                                    onClick={handleImportPlayers}
                                                    disabled={importingPlayers}
                                                    className="btn"
                                                    style={{ marginTop: '1rem' }}
                                                >
                                                    {importingPlayers ? 'Importing...' : `Import ${importPreview.length} Player(s)`}
                                                </button>
                                            </div>
                                        )}
                                        {importMessage && <p style={{ marginTop: '0.75rem', color: importMessage.includes('✅') ? 'var(--accent)' : '#ff6b6b', fontWeight: 'bold' }}>{importMessage}</p>}
                                    </div>
                                )}
                            </div>

                            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                                <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Manage Players</h3>
                                {players.length === 0 ? (
                                    <div style={{ color: 'var(--text-muted)' }}>No players found.</div>
                                ) : (
                                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                                        {players.map(player => (
                                            <div key={player.id} style={{
                                                padding: '10px',
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: 'var(--radius)'
                                            }}>
                                                {editingPlayerId === player.id ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>Name</label>
                                                                <input
                                                                    value={editPlayerForm.name}
                                                                    onChange={e => setEditPlayerForm({ ...editPlayerForm, name: e.target.value })}
                                                                    style={{ width: '100%', padding: '6px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '0.9rem' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>Email</label>
                                                                <input
                                                                    type="email"
                                                                    value={editPlayerForm.email}
                                                                    onChange={e => setEditPlayerForm({ ...editPlayerForm, email: e.target.value })}
                                                                    placeholder="Optional"
                                                                    style={{ width: '100%', padding: '6px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '0.9rem' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>Phone</label>
                                                                <input
                                                                    type="tel"
                                                                    value={editPlayerForm.phone}
                                                                    onChange={e => setEditPlayerForm({ ...editPlayerForm, phone: e.target.value })}
                                                                    placeholder="Optional"
                                                                    style={{ width: '100%', padding: '6px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '0.9rem' }}
                                                                />
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>Handicap Index</label>
                                                                <input
                                                                    type="number"
                                                                    step="0.1"
                                                                    value={editPlayerForm.handicapIndex}
                                                                    onChange={e => setEditPlayerForm({ ...editPlayerForm, handicapIndex: e.target.value })}
                                                                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>Room #</label>
                                                                <input
                                                                    value={editPlayerForm.roomNumber}
                                                                    onChange={e => setEditPlayerForm({ ...editPlayerForm, roomNumber: e.target.value })}
                                                                    placeholder="Optional"
                                                                    style={{ width: '100%', padding: '6px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '0.9rem' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>House #</label>
                                                                <input
                                                                    value={editPlayerForm.houseNumber}
                                                                    onChange={e => setEditPlayerForm({ ...editPlayerForm, houseNumber: e.target.value })}
                                                                    placeholder="Optional"
                                                                    style={{ width: '100%', padding: '6px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '0.9rem' }}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.2rem' }}>
                                                            <input
                                                                type="checkbox"
                                                                id={`manager-${player.id}`}
                                                                checked={editPlayerForm.isManager}
                                                                onChange={e => setEditPlayerForm({ ...editPlayerForm, isManager: e.target.checked })}
                                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                            />
                                                            <label htmlFor={`manager-${player.id}`} style={{ fontSize: '0.9rem', color: 'var(--accent)', cursor: 'pointer', fontWeight: 'bold' }}>Tournament Manager</label>
                                                        </div>

                                                        {/* Per-course tee selectors */}
                                                        {courses.length > 0 && (
                                                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Tee Boxes</label>
                                                                {courses.map(course => {
                                                                    const cd = editPlayerForm.courseData?.[course.id] || {};
                                                                    const selectedTee = cd.tee || '';
                                                                    const teeOptions = Array.isArray(course.tees) ? course.tees : [];
                                                                    const teeInfo = teeOptions.find(t => t.name === selectedTee);
                                                                    const yardage = teeInfo?.yardage;
                                                                    return (
                                                                        <div key={course.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: '90px', flexShrink: 0 }}>{course.name}</span>
                                                                            <select
                                                                                value={selectedTee}
                                                                                onChange={e => setEditPlayerForm(prev => ({
                                                                                    ...prev,
                                                                                    courseData: { ...prev.courseData, [course.id]: { ...cd, tee: e.target.value } }
                                                                                }))}
                                                                                style={{ flex: 1, padding: '5px 8px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '0.85rem' }}
                                                                            >
                                                                                <option value="">Select tee</option>
                                                                                {teeOptions.map(t => (
                                                                                    <option key={t.name} value={t.name}>{t.name}</option>
                                                                                ))}
                                                                            </select>
                                                                            {yardage && (
                                                                                <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                                                                    {yardage.toLocaleString()} yds
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                            <button onClick={handleCancelEditPlayer} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Cancel</button>
                                                            <button onClick={() => handleSavePlayerEdit(player.id)} className="btn" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>Save</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <div style={{ fontWeight: '500', color: 'var(--accent)' }}>{player.name}</div>
                                                                {player.isManager && (
                                                                    <span style={{
                                                                        background: 'var(--accent)',
                                                                        color: '#000',
                                                                        fontSize: '0.65rem',
                                                                        padding: '2px 6px',
                                                                        borderRadius: '10px',
                                                                        fontWeight: 'bold',
                                                                        textTransform: 'uppercase'
                                                                    }}>
                                                                        Manager
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', marginTop: '0.2rem' }}>
                                                                <span>HCP: {player.handicapIndex}</span>
                                                                {player.email && <span>📧 {player.email}</span>}
                                                                {player.phone && <span>📞 {player.phone}</span>}
                                                                {player.roomNumber && <span>🚪 Room: {player.roomNumber}</span>}
                                                                {player.houseNumber && <span>🏠 House: {player.houseNumber}</span>}
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button
                                                                onClick={() => handleEditPlayerClick(player)}
                                                                className="btn-outline"
                                                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeletePlayer(player.id, player.name)}
                                                                className="btn-outline"
                                                                style={{ borderColor: '#ff6b6b', color: '#ff6b6b', padding: '4px 10px', fontSize: '0.8rem' }}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
    );
}
