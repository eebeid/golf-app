import React, { useState, useEffect } from 'react';

export default function GeneralSettingsTab({ tournamentId, players }) {
    const [ryderCupConfig, setRyderCupConfig] = useState({ enabled: false, team1: [], team2: [] });
    const [spotifyUrl, setSpotifyUrl] = useState('');
    const [timezone, setTimezone] = useState('America/New_York');
    
    // Visibility state
    const [showCourses, setShowCourses] = useState(true);
    const [showPlayers, setShowPlayers] = useState(true);
    const [showSchedule, setShowSchedule] = useState(true);
    const [showAccommodations, setShowAccommodations] = useState(false);
    const [showFood, setShowFood] = useState(false);
    const [showPhotos, setShowPhotos] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(true);
    const [showPrizes, setShowPrizes] = useState(true);
    const [showChat, setShowChat] = useState(true);
    const [showPlay, setShowPlay] = useState(true);
    const [showStats, setShowStats] = useState(true);
    const [showScorecards, setShowScorecards] = useState(true);

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (tournamentId) {
            fetchSettings();
        }
    }, [tournamentId]);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`/api/settings?tournamentId=${tournamentId}`);
            if (res.ok) {
                const data = await res.json();
                
                if (data.ryderCupConfig) setRyderCupConfig(data.ryderCupConfig);
                if (data.spotifyUrl) setSpotifyUrl(data.spotifyUrl);
                if (data.timezone) setTimezone(data.timezone);

                setShowCourses(data.showCourses ?? true);
                setShowPlayers(data.showPlayers ?? true);
                setShowSchedule(data.showSchedule ?? true);
                setShowAccommodations(data.showAccommodations ?? false);
                setShowFood(data.showFood ?? false);
                setShowPhotos(data.showPhotos ?? false);
                setShowLeaderboard(data.showLeaderboard ?? true);
                setShowPrizes(data.showPrizes ?? true);
                setShowChat(data.showChat ?? true);
                setShowPlay(data.showPlay ?? true);
                setShowStats(data.showStats ?? true);
                setShowScorecards(data.showScorecards ?? true);
            }
        } catch (error) {
            console.error('Error fetching general settings:', error);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId,
                    ryderCupConfig,
                    spotifyUrl,
                    timezone,
                    showCourses,
                    showPlayers,
                    showSchedule,
                    showAccommodations,
                    showFood,
                    showPhotos,
                    showLeaderboard,
                    showPrizes,
                    showChat,
                    showPlay,
                    showStats,
                    showScorecards
                })
            });

            if (res.ok) {
                setMessage('Settings saved successfully!');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('Error saving settings');
            }
        } catch (error) {
            console.error('Save error:', error);
            setMessage('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    const handleAddPlayerToGlobalTeam = (team, playerId) => {
        if (!playerId) return;
        const newTeam = [...(ryderCupConfig[team] || [])];
        if (!newTeam.includes(playerId)) {
            newTeam.push(playerId);
            setRyderCupConfig({ ...ryderCupConfig, [team]: newTeam });
        }
    };

    const handleRemovePlayerFromGlobalTeam = (team, playerId) => {
        const newTeam = (ryderCupConfig[team] || []).filter(id => id !== playerId);
        setRyderCupConfig({ ...ryderCupConfig, [team]: newTeam });
    };

    return (
        <div className="card">
            <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Tournament Configuration</h2>

            {/* Overall Tournament Format */}
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Overall Tournament Format</h3>
                <div style={{ background: 'rgba(212, 175, 55, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>Overall Ryder Cup Mode</h4>
                            <p style={{ margin: 0, marginTop: '0.2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                Enables Team 1 vs Team 2 scoring for the entire tournament. Points will accumulate across all rounds based on head-to-head performance.
                            </p>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={ryderCupConfig.enabled}
                                onChange={(e) => setRyderCupConfig({ ...ryderCupConfig, enabled: e.target.checked })}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    {ryderCupConfig.enabled && (
                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                            <h4 style={{ color: 'var(--accent)', marginBottom: '1rem', fontSize: '1rem' }}>Global Ryder Cup Teams</h4>
                            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>

                                {/* Global Team 1 */}
                                <div style={{ flex: '1 1 300px' }}>
                                    <h5 style={{ marginBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input
                                            type="text"
                                            value={ryderCupConfig.team1Name || 'Team 1'}
                                            onChange={(e) => setRyderCupConfig({ ...ryderCupConfig, team1Name: e.target.value })}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: 'inherit', fontWeight: 'inherit', width: '100%' }}
                                        />
                                    </h5>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0' }}>
                                        {(ryderCupConfig.team1 || []).map(playerId => {
                                            const player = players.find(p => p.id === playerId);
                                            return player ? (
                                                <li key={playerId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0', fontSize: '0.9rem' }}>
                                                    <span>{player.name}</span>
                                                    <button onClick={() => handleRemovePlayerFromGlobalTeam('team1', playerId)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>&times;</button>
                                                </li>
                                            ) : null;
                                        })}
                                    </ul>
                                    <select
                                        onChange={(e) => handleAddPlayerToGlobalTeam('team1', e.target.value)}
                                        value=""
                                        style={{ width: '100%', padding: '6px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '0.85rem' }}
                                    >
                                        <option value="" disabled>+ Add Player to {ryderCupConfig.team1Name || 'Team 1'}</option>
                                        {players.filter(p =>
                                            !(ryderCupConfig.team1 || []).includes(p.id) &&
                                            !(ryderCupConfig.team2 || []).includes(p.id)
                                        ).map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Global Team 2 */}
                                <div style={{ flex: '1 1 300px' }}>
                                    <h5 style={{ marginBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input
                                            type="text"
                                            value={ryderCupConfig.team2Name || 'Team 2'}
                                            onChange={(e) => setRyderCupConfig({ ...ryderCupConfig, team2Name: e.target.value })}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: 'inherit', fontWeight: 'inherit', width: '100%' }}
                                        />
                                    </h5>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0' }}>
                                        {(ryderCupConfig.team2 || []).map(playerId => {
                                            const player = players.find(p => p.id === playerId);
                                            return player ? (
                                                <li key={playerId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0', fontSize: '0.9rem' }}>
                                                    <span>{player.name}</span>
                                                    <button onClick={() => handleRemovePlayerFromGlobalTeam('team2', playerId)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>&times;</button>
                                                </li>
                                            ) : null;
                                        })}
                                    </ul>
                                    <select
                                        onChange={(e) => handleAddPlayerToGlobalTeam('team2', e.target.value)}
                                        value=""
                                        style={{ width: '100%', padding: '6px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '0.85rem' }}
                                    >
                                        <option value="" disabled>+ Add Player to {ryderCupConfig.team2Name || 'Team 2'}</option>
                                        {players.filter(p =>
                                            !(ryderCupConfig.team1 || []).includes(p.id) &&
                                            !(ryderCupConfig.team2 || []).includes(p.id)
                                        ).map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* General Links Configuration */}
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>General Links &amp; Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                            Spotify Jam Link (Optional)
                        </label>
                        <input
                            type="url"
                            placeholder="e.g. https://spotify.link/l9kRVhd380b"
                            value={spotifyUrl}
                            onChange={(e) => setSpotifyUrl(e.target.value)}
                            style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                        />
                        <p style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Provides a quick QR code link on the main page for people to join a shared music playlist.
                        </p>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                            Tournament Timezone
                        </label>
                        <select
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                        >
                            <optgroup label="US Timezones">
                                <option value="America/New_York">Eastern Time (ET)</option>
                                <option value="America/Chicago">Central Time (CT)</option>
                                <option value="America/Denver">Mountain Time (MT)</option>
                                <option value="America/Phoenix">Mountain Time - Arizona (No DST)</option>
                                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                <option value="America/Anchorage">Alaska Time (AKT)</option>
                                <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
                            </optgroup>
                            <optgroup label="Common International">
                                <option value="Europe/London">London (GMT/BST)</option>
                                <option value="Europe/Paris">Central Europe (CET/CEST)</option>
                                <option value="Asia/Tokyo">Tokyo (JST)</option>
                                <option value="Australia/Sydney">Sydney (AEST/AEDT)</option>
                            </optgroup>
                        </select>
                        <p style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Ensures accurate &quot;Add to Calendar&quot; links for players matching the tournament's actual physical location.
                        </p>
                    </div>
                </div>
            </div>

            {/* Page Visibility */}
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Page Visibility</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={showCourses} onChange={(e) => setShowCourses(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                        <span>Show Courses Page</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={showPlayers} onChange={(e) => setShowPlayers(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                        <span>Show Players Page</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={showSchedule} onChange={(e) => setShowSchedule(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                        <span>Show Schedule / Tee Times Page</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={showAccommodations} onChange={(e) => setShowAccommodations(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                        <span>Show Accommodations / Lodging Page</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={showFood} onChange={(e) => setShowFood(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                        <span>Show Restaurants / Food Page</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={showPhotos} onChange={(e) => setShowPhotos(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                        <span>Show Photos Gallery Page</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={showPrizes} onChange={(e) => setShowPrizes(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                        <span>Show Prizes &amp; Payments Page</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={showChat} onChange={(e) => setShowChat(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                        <span>Show Smack Talk / Chat Page</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={showPlay} onChange={(e) => setShowPlay(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                        <span>Show Play / Enter Scores Page</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={showLeaderboard} onChange={(e) => setShowLeaderboard(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                        <span>Show Leaderboard &amp; Teams Page</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={showStats} onChange={(e) => setShowStats(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                        <span>Show Tournament Stats Page</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={showScorecards} onChange={(e) => setShowScorecards(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                        <span>Show Scorecard Upload Page</span>
                    </label>
                </div>
            </div>

            {/* Save Button for General Settings */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={handleSave}
                    className="btn"
                    disabled={saving}
                    style={{ minWidth: '150px' }}
                >
                    {saving ? 'Saving...' : 'Save Configuration'}
                </button>
                {message && (
                    <span style={{
                        color: message.includes('Error') ? '#ff6b6b' : 'var(--accent)',
                        fontWeight: 'bold'
                    }}>
                        {message}
                    </span>
                )}
            </div>
        </div>
    );
}
