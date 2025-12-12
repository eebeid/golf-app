"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Save } from 'lucide-react';
import coursesData from '@/../../data/courses.json';

export default function ImportPlayersPage() {
    const [text, setText] = useState('');
    const [preview, setPreview] = useState([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleTextChange = (e) => {
        setText(e.target.value);
    };

    const [courseOrder, setCourseOrder] = useState([]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data.roundCourses) {
                        setCourseOrder(data.roundCourses);
                    }
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        // CSV parser: Name, Handicap, Tee1, Tee2, Tee3...
        const lines = text.split('\n');
        const parsed = lines
            .map(line => {
                const parts = line.split(',').map(s => s.trim());
                if (parts.length >= 2 && parts[0]) {
                    const player = {
                        name: parts[0],
                        handicap: parseFloat(parts[1]) || 0,
                        teeRiver: 'Gold',     // Default
                        teePlantation: 'Gold', // Default
                        teeRNK: 'Gold'         // Default
                    };

                    // Map columns 2, 3, 4... to the correct tee field
                    // based on courseOrder
                    courseOrder.forEach((courseId, index) => {
                        const teeValue = parts[index + 2];
                        if (teeValue) {
                            if (courseId === 1) player.teePlantation = teeValue;
                            else if (courseId === 2) player.teeRiver = teeValue;
                            else if (courseId === 3) player.teeRNK = teeValue;
                        }
                    });

                    return player;
                }
                return null;
            })
            .filter(Boolean);

        setPreview(parsed);
    }, [text, courseOrder]);

    const handleImport = async () => {
        if (preview.length === 0) return;
        setLoading(true);

        try {
            const res = await fetch('/api/players/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ players: preview })
            });

            if (res.ok) {
                router.push('/players');
                router.refresh();
            } else {
                alert("Import failed.");
            }
        } catch (e) {
            console.error(e);
            alert("Error importing players.");
        } finally {
            setLoading(false);
        }
    };

    // Helper to get course name key
    const getCourseKey = (id) => {
        if (id === 1) return 'Plantation Tee';
        if (id === 2) return 'River Tee';
        if (id === 3) return 'RNK Tee';
        return 'Tee';
    };

    const headerText = ['Name', 'Handicap', ...courseOrder.map(id => getCourseKey(id))].join(', ');
    const placeholderExample = `Tiger Woods, 0, Gold, Gold, Invicta
John Smith, 15, Blue, Blue, Member
Alice Doe, 22, Red, Red, Green`; // Keep example generic or try to match? Generic is safer for now but header is key.

    return (
        <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 className="section-title">Import Players</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                Paste player data below. Format: <strong>{headerText}</strong> (one per line).
            </p>

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
                            fontSize: '1rem',
                            resize: 'none'
                        }}
                    />
                </div>

                <div>
                    <div className="card" style={{ height: '400px', overflowY: 'auto' }}>
                        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                            Preview ({preview.length})
                        </h3>
                        {preview.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>No valid data detected.</p>
                        ) : (
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {preview.map((p, i) => (
                                    <li key={i} style={{ display: 'flex', flexDirection: 'column', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{p.name}</span>
                                            <span style={{ color: 'var(--accent)' }}>{p.handicap}</span>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                            <span>R: {p.teeRiver}</span>
                                            <span>P: {p.teePlantation}</span>
                                            <span>N: {p.teeRNK}</span>
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
                </div>
            </div>
        </div>
    );
}
