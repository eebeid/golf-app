"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Save } from 'lucide-react';

export default function ImportPlayersPage() {
    const [text, setText] = useState('');
    const [preview, setPreview] = useState([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleTextChange = (e) => {
        const val = e.target.value;
        setText(val);

        // Simple CSV parser: Name, Handicap
        const lines = val.split('\n');
        const parsed = lines
            .map(line => {
                const [name, handicap] = line.split(',');
                if (name && name.trim()) {
                    return { name: name.trim(), handicap: parseInt(handicap) || 0 };
                }
                return null;
            })
            .filter(Boolean);

        setPreview(parsed);
    };

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

    return (
        <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 className="section-title">Import Players</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                Paste player data below. Format: <strong>Name, Handicap</strong> (one per line).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                    <textarea
                        value={text}
                        onChange={handleTextChange}
                        placeholder="Tiger Woods, 0&#10;John Smith, 15&#10;Alice Doe, 22"
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
                                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span>{p.name}</span>
                                        <span style={{ color: 'var(--accent)' }}>{p.handicap}</span>
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
