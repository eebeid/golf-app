"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save } from 'lucide-react';

export default function ImportPlayersPage() {
    const params = useParams();
    const tournamentId = params?.tournamentId;
    const [text, setText] = useState('');
    const [preview, setPreview] = useState([]);
    const [loading, setLoading] = useState(false);
    const [courses, setCourses] = useState([]);
    const router = useRouter();

    useEffect(() => {
        const fetchCourses = async () => {
            if (!tournamentId) return;
            try {
                const res = await fetch(`/api/courses?tournamentId=${tournamentId}`);
                if (res.ok) {
                    const data = await res.json();
                    setCourses(data || []);
                }
            } catch (error) {
                console.error('Error fetching courses:', error);
            }
        };
        fetchCourses();
    }, [tournamentId]);

    const handleTextChange = (e) => {
        setText(e.target.value);
    };

    useEffect(() => {
        // CSV parser: Name, Email, Handicap, Tee1, Tee2, Tee3...
        // Tees correspond to the courses in the order they are returned/displayed
        if (!text) {
            setPreview([]);
            return;
        }

        const lines = text.split('\n');
        const parsed = lines
            .map(line => {
                const parts = line.split(',').map(s => s.trim());
                if (parts.length >= 1 && parts[0]) {
                    const player = {
                        name: parts[0],
                        email: parts[1] || null,
                        handicapIndex: parseFloat(parts[2]) || 0,
                        tees: {}
                    };

                    // Map columns 3, 4, 5... to the correct tee field for each course
                    // We assume the CSV columns Match the order of 'courses' fetched
                    courses.forEach((course, index) => {
                        const teeValue = parts[index + 3]; // Column 4 is index 3
                        if (teeValue) {
                            player.tees[course.id] = teeValue;
                        } else {
                            // Default to first tee if available, or 'Standard'
                            player.tees[course.id] = course.tees?.[0]?.name || 'Standard';
                        }
                    });

                    return player;
                }
                return null;
            })
            .filter(Boolean);

        setPreview(parsed);
    }, [text, courses]);

    const handleImport = async () => {
        if (preview.length === 0) return;
        setLoading(true);

        try {
            const res = await fetch('/api/players/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId,
                    players: preview
                })
            });

            if (res.ok) {
                alert("Players imported successfully!");
                router.push(`/t/${tournamentId}/admin/settings`);
                router.refresh();
            } else {
                const err = await res.json();
                alert(`Import failed: ${err.error || 'Unknown error'}`);
            }
        } catch (e) {
            console.error(e);
            alert("Error importing players.");
        } finally {
            setLoading(false);
        }
    };

    // Helper to get course name
    const courseNames = courses.map(c => c.name).join(', ');
    const headerText = `Name, Email, Handicap, ${courses.map(c => `${c.name} Tee`).join(', ')}`;
    const placeholderExample = `Tiger Woods, tiger@example.com, 0, Gold, Black
John Smith, john@example.com, 15, Blue, White`;

    return (
        <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <h1 className="section-title">Import Players</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Paste player data below. One player per line.
            </p>
            <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius)', fontSize: '0.9rem' }}>
                <strong>Format:</strong> {headerText}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                    <textarea
                        value={text}
                        onChange={handleTextChange}
                        placeholder={placeholderExample}
                        style={{
                            width: '100%',
                            height: '400px',
                            padding: '1rem',
                            borderRadius: 'var(--radius)',
                            background: 'var(--bg-card)',
                            color: 'var(--text-main)',
                            border: '1px solid var(--glass-border)',
                            fontFamily: 'monospace',
                            fontSize: '0.9rem',
                            resize: 'none'
                        }}
                    />
                </div>

                <div>
                    <div className="card" style={{ height: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                            Preview ({preview.length})
                        </h3>
                        {preview.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>No valid data detected.</p>
                        ) : (
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {preview.map((p, i) => (
                                    <li key={i} style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: 'bold' }}>{p.name}</span>
                                            <span style={{ color: 'var(--accent)' }}>{p.handicapIndex}</span>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.email || 'No Email'}</div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.2rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                            {courses.map(c => (
                                                <span key={c.id}>{c.name.substring(0, 3)}: {p.tees[c.id]}</span>
                                            ))}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <button
                        onClick={handleImport}
                        className="btn"
                        style={{ width: '100%', marginTop: '1rem' }}
                        disabled={loading || preview.length === 0}
                    >
                        <Save size={18} style={{ marginRight: '8px' }} />
                        {loading ? 'Importing...' : 'Import Players'}
                    </button>

                    <button
                        onClick={() => router.back()}
                        className="btn-outline"
                        style={{ width: '100%', marginTop: '0.5rem' }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
