"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [handicapIndex, setHandicapIndex] = useState('');
    const [hcpRiver, setHcpRiver] = useState('');
    const [hcpPlantation, setHcpPlantation] = useState('');
    const [hcpRNK, setHcpRNK] = useState('');

    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await fetch('/api/players', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    handicapIndex: parseFloat(handicapIndex) || 0,
                    hcpRiver: parseInt(hcpRiver) || 0,
                    hcpPlantation: parseInt(hcpPlantation) || 0,
                    hcpRNK: parseInt(hcpRNK) || 0
                })
            });
            router.push('/players');
            router.refresh();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h1 className="section-title">New Player Registration</h1>
            <form onSubmit={handleSubmit} className="card">
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Full Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--glass-border)',
                            background: 'var(--bg-dark)',
                            color: 'var(--text-main)',
                            fontSize: '1rem'
                        }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Handicap Index</label>
                        <input
                            type="number"
                            step="0.1"
                            value={handicapIndex}
                            onChange={(e) => setHandicapIndex(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: 'var(--radius)',
                                border: '1px solid var(--glass-border)',
                                background: 'var(--bg-dark)',
                                color: 'var(--text-main)',
                                fontSize: '1rem'
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>River Hcp</label>
                        <input
                            type="number"
                            value={hcpRiver}
                            onChange={(e) => setHcpRiver(e.target.value)}
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
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Plantation Hcp</label>
                        <input
                            type="number"
                            value={hcpPlantation}
                            onChange={(e) => setHcpPlantation(e.target.value)}
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
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>RNK Hcp</label>
                        <input
                            type="number"
                            value={hcpRNK}
                            onChange={(e) => setHcpRNK(e.target.value)}
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
                </div>

                <button type="submit" className="btn" style={{ width: '100%' }} disabled={loading}>
                    {loading ? 'Registering...' : 'Complete Registration'}
                </button>
            </form>
        </div>
    );
}
