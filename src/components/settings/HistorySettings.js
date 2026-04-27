import React, { useState, useEffect } from 'react';

export default function HistorySettings({ tournamentId }) {
    const [tripName, setTripName] = useState('');
    const [savingHistory, setSavingHistory] = useState(false);
    const [restoringHistory, setRestoringHistory] = useState(false);
    const [historyMessage, setHistoryMessage] = useState('');
    const [historyArchives, setHistoryArchives] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        if (tournamentId) {
            fetchHistory();
        }
    }, [tournamentId]);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await fetch('/api/history');
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                // Filter archives that belong to this tournament
                const filtered = data.filter(archive => {
                    const arcData = archive.data || {};
                    return arcData.slug === tournamentId || arcData.id === tournamentId || !arcData.id;
                });
                setHistoryArchives(filtered || []);
            }
        } catch (e) {
            console.error('Error fetching history:', e);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleSaveHistory = async () => {
        if (!tripName.trim()) {
            setHistoryMessage('Please enter a trip name');
            return;
        }

        if (!window.confirm(`Are you sure you want to archive this tournament as "${tripName}"?`)) return;

        setSavingHistory(true);
        setHistoryMessage('');

        try {
            const res = await fetch('/api/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: tripName, tournamentId })
            });

            if (res.ok) {
                setHistoryMessage('History saved successfully!');
                setTripName('');
                fetchHistory(); // Refresh the list
                setTimeout(() => setHistoryMessage(''), 3000);
            } else {
                setHistoryMessage('Error saving history');
            }
        } catch (error) {
            console.error('Error saving history:', error);
            setHistoryMessage('Error saving history');
        } finally {
            setSavingHistory(false);
        }
    };

    const handleRestoreArchive = async (archiveId, archiveName) => {
        const confirmRestore = window.confirm(
            `⚠️ WARNING: RESTORE IS DESTRUCTIVE\n\n` +
            `Restoring "${archiveName}" will DELETE all current players, scores, tee times, and settings for this tournament and replace them with the data from the archive.\n\n` +
            `Are you absolutely sure you want to proceed?`
        );

        if (!confirmRestore) return;

        setRestoringHistory(true);
        setHistoryMessage(`Restoring ${archiveName}...`);

        try {
            const res = await fetch('/api/history/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ archiveId, tournamentId })
            });

            if (res.ok) {
                setHistoryMessage(`✅ Successfully restored: ${archiveName}`);
                setTimeout(() => window.location.reload(), 1500);
            } else {
                const data = await res.json();
                setHistoryMessage(`❌ Error: ${data.error || 'Restore failed'}`);
            }
        } catch (error) {
            console.error('Error restoring history:', error);
            setHistoryMessage('❌ Error restoring archive');
        } finally {
            setRestoringHistory(false);
        }
    };

    const handleDeleteArchive = async (id) => {
        if (!window.confirm('Are you sure you want to delete this archive?')) return;
        try {
            const res = await fetch(`/api/history?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setHistoryArchives(prev => prev.filter(a => a.id !== id));
            }
        } catch (e) {
            console.error('Error deleting archive:', e);
        }
    };

    const handleCloneAsNew = async (archiveId, archiveName) => {
        window.alert(`In the future, clicking this will create a completely new tournament starting with the template from "${archiveName}", instead of overriding the current one!`);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card">
                <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Historical Archives</h2>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Trip Name / Identifier
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Williamsburg 2025"
                        value={tripName}
                        onChange={(e) => setTripName(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--glass-border)',
                            background: 'var(--bg-dark)',
                            color: 'var(--text-main)',
                            fontSize: '1rem'
                        }}
                    />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Save a complete snapshot of the current tournament (Settings, Players, Scores, Courses, Lodging, etc.) to the archives.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={handleSaveHistory}
                        className="btn"
                        disabled={savingHistory || !tripName.trim()}
                        style={{ minWidth: '150px' }}
                    >
                        {savingHistory ? 'Archiving...' : 'Save Snapshot'}
                    </button>
                    {historyMessage && (
                        <span style={{
                            color: historyMessage.includes('Error') || historyMessage.includes('Please') || historyMessage.includes('❌') ? '#ff6b6b' : 'var(--accent)',
                            fontWeight: 'bold'
                        }}>
                            {historyMessage}
                        </span>
                    )}
                </div>
            </div>

            <div className="card">
                <h3 style={{ marginBottom: '1.5rem' }}>Past Snapshots</h3>
                {loadingHistory ? (
                    <p>Loading archives...</p>
                ) : historyArchives.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No archives found for this tournament.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '1rem' }}>Name</th>
                                    <th style={{ padding: '1rem' }}>Date</th>
                                    <th style={{ padding: '1rem' }}>Players</th>
                                    <th style={{ padding: '1rem' }}>Rounds</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyArchives.map(archive => (
                                    <tr key={archive.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{archive.name}</td>
                                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                                            {new Date(archive.date).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {archive.data?.players?.length || 0}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {archive.data?.numberOfRounds || archive.data?.settings?.numberOfRounds || 0}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleCloneAsNew(archive.id, archive.name)}
                                                disabled={restoringHistory}
                                                style={{ background: 'none', border: 'none', color: '#4CAF50', cursor: 'pointer', padding: '0.5rem', fontWeight: 'bold', opacity: restoringHistory ? 0.5 : 1, marginRight: '0.5rem' }}
                                                title="Clone as New Tournament (Coming Soon)"
                                            >
                                                Clone
                                            </button>
                                            <button
                                                onClick={() => handleRestoreArchive(archive.id, archive.name)}
                                                disabled={restoringHistory}
                                                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: '0.5rem', fontWeight: 'bold', opacity: restoringHistory ? 0.5 : 1 }}
                                                title="Overwrite current tournament with this snapshot"
                                            >
                                                {restoringHistory ? '...' : 'Restore'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteArchive(archive.id)}
                                                disabled={restoringHistory}
                                                style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: '0.5rem', opacity: restoringHistory ? 0.5 : 1 }}
                                                title="Delete archive"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
