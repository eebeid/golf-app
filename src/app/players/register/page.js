"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import coursesData from '@/../../data/courses.json';
import { calculateAllCourseHandicaps } from '@/lib/courseHandicap';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [handicapIndex, setHandicapIndex] = useState('');

    // Tee selections
    const [teeRiver, setTeeRiver] = useState('Blue');
    const [teePlantation, setTeePlantation] = useState('Gold');
    const [teeRNK, setTeeRNK] = useState('Gold');

    // Calculated course handicaps
    const [hcpRiver, setHcpRiver] = useState(0);
    const [hcpPlantation, setHcpPlantation] = useState(0);
    const [hcpRNK, setHcpRNK] = useState(0);

    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Auto-calculate course handicaps when handicap index or tee selection changes
    useEffect(() => {
        if (handicapIndex) {
            const handicaps = calculateAllCourseHandicaps(
                parseFloat(handicapIndex),
                coursesData,
                {
                    river: teeRiver,
                    plantation: teePlantation,
                    rnk: teeRNK
                }
            );

            setHcpRiver(handicaps.hcpRiver);
            setHcpPlantation(handicaps.hcpPlantation);
            setHcpRNK(handicaps.hcpRNK);
        } else {
            setHcpRiver(0);
            setHcpPlantation(0);
            setHcpRNK(0);
        }
    }, [handicapIndex, teeRiver, teePlantation, teeRNK]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/players', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    handicapIndex: parseFloat(handicapIndex) || 0,
                    teeRiver,
                    teePlantation,
                    teeRNK,
                    hcpRiver,
                    hcpPlantation,
                    hcpRNK
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to register');
            }
            router.push('/players');
            router.refresh();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Get tee options for each course
    const riverCourse = coursesData.find(c => c.id === 2);
    const plantationCourse = coursesData.find(c => c.id === 1);
    const rnkCourse = coursesData.find(c => c.id === 3);

    return (
        <div className="fade-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h1 className="section-title">New Player Registration</h1>
            <form onSubmit={handleSubmit} className="card">
                {/* Player Name */}
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

                {/* Email Address */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Email Address (Optional)</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="For auto-login features"
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

                {/* Handicap Index */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                        Handicap Index
                        <span style={{ fontSize: '0.85rem', marginLeft: '0.5rem', opacity: 0.7 }}>
                            (Course handicaps will be calculated automatically)
                        </span>
                    </label>
                    <input
                        type="number"
                        step="0.1"
                        value={handicapIndex}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || /^\d*\.?\d{0,1}$/.test(val)) {
                                setHandicapIndex(val);
                            }
                        }}
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

                {/* Tee Selections */}
                <div style={{
                    marginBottom: '2rem',
                    padding: '1.5rem',
                    background: 'rgba(212, 175, 55, 0.05)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid rgba(212, 175, 55, 0.2)'
                }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Tee Selections</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        Select which tees you&apos;ll be playing from for each course
                    </p>

                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        {/* Plantation Course */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                {plantationCourse?.name}
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', alignItems: 'end' }}>
                                <select
                                    value={teePlantation}
                                    onChange={(e) => setTeePlantation(e.target.value)}
                                    style={{
                                        padding: '10px',
                                        borderRadius: 'var(--radius)',
                                        border: '1px solid var(--glass-border)',
                                        background: 'var(--bg-dark)',
                                        color: 'var(--text-main)',
                                        fontSize: '1rem'
                                    }}
                                >
                                    {plantationCourse?.tees.map(tee => (
                                        <option key={tee.name} value={tee.name}>
                                            {tee.name} ({tee.yardage.toLocaleString()} yds, {tee.rating}/{tee.slope})
                                        </option>
                                    ))}
                                </select>
                                <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Course Hcp</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>{hcpPlantation}</div>
                                </div>
                            </div>
                        </div>

                        {/* River Course */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                {riverCourse?.name}
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', alignItems: 'end' }}>
                                <select
                                    value={teeRiver}
                                    onChange={(e) => setTeeRiver(e.target.value)}
                                    style={{
                                        padding: '10px',
                                        borderRadius: 'var(--radius)',
                                        border: '1px solid var(--glass-border)',
                                        background: 'var(--bg-dark)',
                                        color: 'var(--text-main)',
                                        fontSize: '1rem'
                                    }}
                                >
                                    {riverCourse?.tees.map(tee => (
                                        <option key={tee.name} value={tee.name}>
                                            {tee.name} ({tee.yardage.toLocaleString()} yds, {tee.rating}/{tee.slope})
                                        </option>
                                    ))}
                                </select>
                                <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Course Hcp</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>{hcpRiver}</div>
                                </div>
                            </div>
                        </div>

                        {/* Royal New Kent */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                {rnkCourse?.name}
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', alignItems: 'end' }}>
                                <select
                                    value={teeRNK}
                                    onChange={(e) => setTeeRNK(e.target.value)}
                                    style={{
                                        padding: '10px',
                                        borderRadius: 'var(--radius)',
                                        border: '1px solid var(--glass-border)',
                                        background: 'var(--bg-dark)',
                                        color: 'var(--text-main)',
                                        fontSize: '1rem'
                                    }}
                                >
                                    {rnkCourse?.tees.map(tee => (
                                        <option key={tee.name} value={tee.name}>
                                            {tee.name} ({tee.yardage.toLocaleString()} yds, {tee.rating}/{tee.slope})
                                        </option>
                                    ))}
                                </select>
                                <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Course Hcp</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>{hcpRNK}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <button type="submit" className="btn" style={{ width: '100%' }} disabled={loading}>
                    {loading ? 'Registering...' : 'Complete Registration'}
                </button>
            </form>
        </div>
    );
}
