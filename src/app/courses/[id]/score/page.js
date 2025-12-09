"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CourseScorePage({ params }) {
    const courseId = params.id;
    const router = useRouter();

    const [players, setPlayers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedPlayer, setSelectedPlayer] = useState('');
    const [scoreData, setScoreData] = useState({}); // { hole: score }
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch players and course info
        const fetchData = async () => {
            const [pRes, cRes] = await Promise.all([
                fetch('/api/players').then(r => r.json()),
                fetch('/lib/data').then(() => []) // Placeholder, read below
            ]);
            setPlayers(pRes);
            // Note: We don't have a Courses API, we should make one or just read the JSON via server component?
            // For client component simplicity, let's hardcode names or pass props. But params is here.
        };
        fetchData();
    }, []);

    // Simplified: 18 holes grid
    const holes = Array.from({ length: 18 }, (_, i) => i + 1);

    const handleScoreChange = (hole, val) => {
        setScoreData(prev => ({ ...prev, [hole]: val }));
    };

    const submitScores = async () => {
        if (!selectedPlayer) return alert("Select a player!");
        setLoading(true);

        try {
            const promises = Object.entries(scoreData).map(([hole, score]) => {
                if (!score) return null;
                return fetch('/api/scores', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        playerId: selectedPlayer,
                        hole,
                        score,
                        courseId
                    })
                });
            }).filter(Boolean);

            await Promise.all(promises);
            alert("Scores saved!");
            router.refresh();
            setScoreData({});
        } catch (e) {
            console.error(e);
            alert("Error saving scores");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in">
            <h1 className="section-title">Enter Scores</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Course ID: {courseId}</p>

            <div className="card">
                <div style={{ marginBottom: '2rem' }}>
                    <label>Select Player:</label>
                    <select
                        value={selectedPlayer}
                        onChange={e => setSelectedPlayer(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            marginTop: '10px',
                            borderRadius: 'var(--radius)',
                            background: 'var(--bg-dark)',
                            color: 'var(--text-main)',
                            border: '1px solid var(--glass-border)'
                        }}
                    >
                        <option value="">-- Choose Player --</option>
                        {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '1rem' }}>
                    {holes.map(h => (
                        <div key={h} style={{ textAlign: 'center' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hole {h}</label>
                            <input
                                type="number"
                                min="1"
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    textAlign: 'center',
                                    borderRadius: '4px',
                                    border: '1px solid var(--glass-border)'
                                }}
                                value={scoreData[h] || ''}
                                onChange={e => handleScoreChange(h, e.target.value)}
                            />
                        </div>
                    ))}
                </div>

                <button
                    onClick={submitScores}
                    className="btn"
                    style={{ width: '100%', marginTop: '2rem' }}
                    disabled={loading}
                >
                    {loading ? 'Saving...' : 'Save Round'}
                </button>
            </div>
        </div>
    );
}
