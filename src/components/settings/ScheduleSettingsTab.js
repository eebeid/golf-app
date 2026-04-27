import React, { useState, useEffect } from 'react';

export default function ScheduleSettingsTab({ tournamentId, players, courses }) {
    const [numberOfRounds, setNumberOfRounds] = useState(1);
    const [maxHandicap, setMaxHandicap] = useState('');
    const [roundDates, setRoundDates] = useState([]);
    const [roundCourses, setRoundCourses] = useState([]);
    const [roundHandicaps, setRoundHandicaps] = useState([]);
    const [roundTimeConfig, setRoundTimeConfig] = useState({});

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
                setNumberOfRounds(data.numberOfRounds || 1);
                setRoundDates(data.roundDates || []);
                setRoundCourses(data.roundCourses || []);
                setRoundHandicaps(data.roundHandicaps || []);
                
                if (data.roundTimeConfig) {
                    setMaxHandicap(data.roundTimeConfig.maxHandicap ?? '');
                    setRoundTimeConfig(data.roundTimeConfig);
                }
            }
        } catch (error) {
            console.error('Error fetching schedule settings:', error);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');

        try {
            const configPayload = { ...roundTimeConfig };
            if (maxHandicap !== '') {
                configPayload.maxHandicap = parseInt(maxHandicap);
            }

            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId,
                    numberOfRounds,
                    roundDates,
                    roundCourses,
                    roundHandicaps,
                    maxHandicap: maxHandicap !== '' ? parseInt(maxHandicap) : null,
                    roundTimeConfig: configPayload,
                })
            });

            if (res.ok) {
                setMessage('Schedule saved successfully!');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('Error saving schedule');
            }
        } catch (error) {
            console.error('Save error:', error);
            setMessage('Error saving schedule');
        } finally {
            setSaving(false);
        }
    };

    const handleAddRound = () => {
        setNumberOfRounds(prev => prev + 1);
        setRoundDates([...roundDates, '']);
        setRoundCourses([...roundCourses, '']);
        setRoundHandicaps([...roundHandicaps, 100]);
    };

    const handleDeleteRound = (indexToDelete) => {
        if (!window.confirm(`Are you sure you want to delete Round ${indexToDelete + 1}?`)) return;
        setNumberOfRounds(prev => Math.max(1, prev - 1));
        
        setRoundDates(roundDates.filter((_, i) => i !== indexToDelete));
        setRoundCourses(roundCourses.filter((_, i) => i !== indexToDelete));
        setRoundHandicaps(roundHandicaps.filter((_, i) => i !== indexToDelete));

        const newTimeConfig = { ...roundTimeConfig };
        delete newTimeConfig[indexToDelete + 1];
        
        // Shift remaining configs down
        for (let i = indexToDelete + 2; i <= numberOfRounds + 1; i++) {
            if (newTimeConfig[i]) {
                newTimeConfig[i - 1] = newTimeConfig[i];
                delete newTimeConfig[i];
            }
        }
        setRoundTimeConfig(newTimeConfig);
    };

    const handleMoveRoundUp = (index) => {
        if (index === 0) return;
        swapRounds(index, index - 1);
    };

    const handleMoveRoundDown = (index) => {
        if (index === numberOfRounds - 1) return;
        swapRounds(index, index + 1);
    };

    const swapRounds = (idx1, idx2) => {
        const newDates = [...roundDates];
        const tempDate = newDates[idx1];
        newDates[idx1] = newDates[idx2];
        newDates[idx2] = tempDate;
        setRoundDates(newDates);

        const newCoursesArr = [...roundCourses];
        const tempCourse = newCoursesArr[idx1];
        newCoursesArr[idx1] = newCoursesArr[idx2];
        newCoursesArr[idx2] = tempCourse;
        setRoundCourses(newCoursesArr);

        const newHandicaps = [...roundHandicaps];
        const tempHcp = newHandicaps[idx1];
        newHandicaps[idx1] = newHandicaps[idx2];
        newHandicaps[idx2] = tempHcp;
        setRoundHandicaps(newHandicaps);

        const newConfig = { ...roundTimeConfig };
        const tempConfig1 = newConfig[idx1 + 1];
        const tempConfig2 = newConfig[idx2 + 1];

        if (tempConfig2) newConfig[idx1 + 1] = tempConfig2;
        else delete newConfig[idx1 + 1];

        if (tempConfig1) newConfig[idx2 + 1] = tempConfig1;
        else delete newConfig[idx2 + 1];

        setRoundTimeConfig(newConfig);
    };

    const handleDateChange = (index, value) => {
        const newDates = [...roundDates];
        newDates[index] = value;
        setRoundDates(newDates);
    };

    const handleCourseChange = (index, value) => {
        const newCoursesArr = [...roundCourses];
        newCoursesArr[index] = value;
        setRoundCourses(newCoursesArr);
    };

    const handleHandicapChange = (index, value) => {
        const newHandicaps = [...roundHandicaps];
        newHandicaps[index] = value;
        setRoundHandicaps(newHandicaps);
    };

    const handleClearRoundScores = async (roundNum) => {
        if (!window.confirm(`Are you absolutely sure you want to clear ALL scores for Round ${roundNum}? This cannot be undone.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/scores?tournamentId=${tournamentId}&round=${roundNum}`, { method: 'DELETE' });
            if (res.ok) {
                alert(`Scores for Round ${roundNum} have been cleared.`);
            } else {
                alert('Failed to clear scores.');
            }
        } catch (error) {
            console.error('Error clearing scores:', error);
            alert('An error occurred while clearing scores.');
        }
    };

    const handleAddPlayerToTeam = (roundIndex, teamKey, playerId) => {
        if (!playerId) return;
        const newConfig = { ...roundTimeConfig };
        if (!newConfig[roundIndex]) newConfig[roundIndex] = {};
        if (!newConfig[roundIndex][teamKey]) newConfig[roundIndex][teamKey] = [];
        
        if (!newConfig[roundIndex][teamKey].includes(playerId)) {
            newConfig[roundIndex][teamKey].push(playerId);
            setRoundTimeConfig(newConfig);
        }
    };

    const handleRemovePlayerFromTeam = (roundIndex, teamKey, playerId) => {
        const newConfig = { ...roundTimeConfig };
        if (newConfig[roundIndex] && newConfig[roundIndex][teamKey]) {
            newConfig[roundIndex][teamKey] = newConfig[roundIndex][teamKey].filter(id => id !== playerId);
            setRoundTimeConfig(newConfig);
        }
    };

    return (
        <div className="card">
            <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Schedule &amp; Round Details</h2>
            
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--accent)' }}>Round Details</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>Global Max Handicap:</label>
                        <input
                            type="number"
                            min="0"
                            max="54"
                            value={maxHandicap}
                            onChange={(e) => setMaxHandicap(e.target.value)}
                            placeholder="None"
                            style={{
                                width: '80px',
                                padding: '8px',
                                borderRadius: 'var(--radius)',
                                border: '1px solid var(--glass-border)',
                                background: 'var(--bg-dark)',
                                color: 'var(--text-main)',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>
                </div>
                
                {Array.from({ length: numberOfRounds }).map((_, index) => (
                    <div
                        key={index}
                        style={{
                            padding: '1rem',
                            marginBottom: '1rem',
                            background: 'rgba(212, 175, 55, 0.05)',
                            borderRadius: 'var(--radius)',
                            border: '1px solid rgba(212, 175, 55, 0.2)',
                            position: 'relative'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <h4 style={{ margin: 0 }}>Round {index + 1}</h4>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => handleMoveRoundUp(index)}
                                    disabled={index === 0}
                                    className="btn-outline"
                                    style={{
                                        padding: '4px 8px',
                                        fontSize: '0.8rem',
                                        opacity: index === 0 ? 0.4 : 1,
                                        cursor: index === 0 ? 'not-allowed' : 'pointer'
                                    }}
                                    title="Move Round Up"
                                >
                                    ↑
                                </button>
                                <button
                                    onClick={() => handleMoveRoundDown(index)}
                                    disabled={index === numberOfRounds - 1}
                                    className="btn-outline"
                                    style={{
                                        padding: '4px 8px',
                                        fontSize: '0.8rem',
                                        opacity: index === numberOfRounds - 1 ? 0.4 : 1,
                                        cursor: index === numberOfRounds - 1 ? 'not-allowed' : 'pointer'
                                    }}
                                    title="Move Round Down"
                                >
                                    ↓
                                </button>
                                <button
                                    onClick={() => handleDeleteRound(index)}
                                    className="btn-outline"
                                    style={{
                                        borderColor: '#ff6b6b',
                                        color: '#ff6b6b',
                                        padding: '4px 8px',
                                        fontSize: '0.8rem'
                                    }}
                                    title="Delete Round"
                                >
                                    ✖
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Date</label>
                                <input
                                    type="date"
                                    value={roundDates[index] || ''}
                                    onChange={(e) => handleDateChange(index, e.target.value)}
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
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Course</label>
                                <select
                                    value={roundCourses[index] || ''}
                                    onChange={(e) => handleCourseChange(index, e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: 'var(--radius)',
                                        border: '1px solid var(--glass-border)',
                                        background: 'var(--bg-dark)',
                                        color: 'var(--text-main)',
                                        fontSize: '1rem'
                                    }}
                                >
                                    <option value="" disabled>Select a course...</option>
                                    {courses.map(course => (
                                        <option key={course.id} value={course.id}>
                                            {course.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Handicap %</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={roundHandicaps[index] || ''}
                                        placeholder="100"
                                        onChange={(e) => handleHandicapChange(index, e.target.value)}
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
                                    <span style={{ color: 'var(--text-muted)' }}>%</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ flex: '1 1 120px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Start Time</label>
                                <input
                                    type="time"
                                    value={roundTimeConfig[index + 1]?.startTime || ''}
                                    onChange={(e) => {
                                        const newConfig = { ...roundTimeConfig };
                                        if (!newConfig[index + 1]) newConfig[index + 1] = {};
                                        newConfig[index + 1].startTime = e.target.value;
                                        setRoundTimeConfig(newConfig);
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        background: 'var(--bg-dark)',
                                        border: '1px solid var(--glass-border)',
                                        color: 'var(--text-main)',
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>
                            <div style={{ flex: '1 1 120px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Interval (mins)</label>
                                <input
                                    type="number"
                                    value={roundTimeConfig[index + 1]?.interval || ''}
                                    onChange={(e) => {
                                        const newConfig = { ...roundTimeConfig };
                                        if (!newConfig[index + 1]) newConfig[index + 1] = {};
                                        newConfig[index + 1].interval = parseInt(e.target.value) || 0;
                                        setRoundTimeConfig(newConfig);
                                    }}
                                    placeholder="e.g. 10"
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        background: 'var(--bg-dark)',
                                        border: '1px solid var(--glass-border)',
                                        color: 'var(--text-main)',
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>
                            <div style={{ flex: '1 1 200px' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Game Format</label>
                                <select
                                    value={roundTimeConfig[index + 1]?.format || 'Individual'}
                                    onChange={(e) => {
                                        const newConfig = { ...roundTimeConfig };
                                        if (!newConfig[index + 1]) newConfig[index + 1] = {};
                                        newConfig[index + 1].format = e.target.value;
                                        setRoundTimeConfig(newConfig);
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        background: 'var(--bg-dark)',
                                        border: '1px solid var(--glass-border)',
                                        color: 'var(--text-main)',
                                        borderRadius: '4px'
                                    }}
                                >
                                    <option value="Individual">Individual Stroke Play</option>
                                    <option value="Stableford">Individual Stableford</option>
                                    <option value="Scramble">Scramble (Team)</option>
                                    <option value="BestBall">Best Ball (Fourball)</option>
                                    <option value="MatchPlay">Match Play</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => handleClearRoundScores(index + 1)}
                                style={{
                                    padding: '4px 12px',
                                    fontSize: '0.75rem',
                                    background: 'transparent',
                                    border: '1px solid #ff4d4d',
                                    color: '#ff4d4d',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Clear Round Scores
                            </button>
                        </div>

                        {/* Ryder Cup Teams UI */}
                        {(roundTimeConfig[index + 1]?.format === 'RyderCup' || roundTimeConfig[index + 1]?.format === 'MatchPlay') && (
                            <div style={{ marginTop: '1rem', background: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                <h4 style={{ color: 'var(--accent)', marginBottom: '1rem', fontSize: '1rem' }}>Match Play Teams</h4>
                                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>

                                    {/* Team 1 */}
                                    <div style={{ flex: '1 1 300px' }}>
                                        <h5 style={{ marginBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.25rem' }}>Team 1</h5>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0' }}>
                                            {(roundTimeConfig[index + 1]?.team1 || []).map(playerId => {
                                                const player = players.find(p => p.id === playerId);
                                                return player ? (
                                                    <li key={playerId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0', fontSize: '0.9rem' }}>
                                                        <span>{player.name}</span>
                                                        <button onClick={() => handleRemovePlayerFromTeam(index + 1, 'team1', playerId)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>&times;</button>
                                                    </li>
                                                ) : null;
                                            })}
                                        </ul>
                                        <select
                                            onChange={(e) => handleAddPlayerToTeam(index + 1, 'team1', e.target.value)}
                                            value=""
                                            style={{ width: '100%', padding: '6px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '0.85rem' }}
                                        >
                                            <option value="" disabled>+ Add Player to Team 1</option>
                                            {players.filter(p =>
                                                !(roundTimeConfig[index + 1]?.team1 || []).includes(p.id) &&
                                                !(roundTimeConfig[index + 1]?.team2 || []).includes(p.id)
                                            ).map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Team 2 */}
                                    <div style={{ flex: '1 1 300px' }}>
                                        <h5 style={{ marginBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.25rem' }}>Team 2</h5>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0' }}>
                                            {(roundTimeConfig[index + 1]?.team2 || []).map(playerId => {
                                                const player = players.find(p => p.id === playerId);
                                                return player ? (
                                                    <li key={playerId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0', fontSize: '0.9rem' }}>
                                                        <span>{player.name}</span>
                                                        <button onClick={() => handleRemovePlayerFromTeam(index + 1, 'team2', playerId)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>&times;</button>
                                                    </li>
                                                ) : null;
                                            })}
                                        </ul>
                                        <select
                                            onChange={(e) => handleAddPlayerToTeam(index + 1, 'team2', e.target.value)}
                                            value=""
                                            style={{ width: '100%', padding: '6px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '0.85rem' }}
                                        >
                                            <option value="" disabled>+ Add Player to Team 2</option>
                                            {players.filter(p =>
                                                !(roundTimeConfig[index + 1]?.team1 || []).includes(p.id) &&
                                                !(roundTimeConfig[index + 1]?.team2 || []).includes(p.id)
                                            ).map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                </div>
                            </div>
                        )}
                    </div>
                ))}

                <button
                    onClick={handleAddRound}
                    className="btn-outline"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                    + Add Round
                </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={handleSave}
                    className="btn"
                    disabled={saving}
                    style={{ minWidth: '150px' }}
                >
                    {saving ? 'Saving...' : 'Save Schedule'}
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
