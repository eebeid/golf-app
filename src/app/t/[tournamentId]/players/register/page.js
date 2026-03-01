"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { calculateCourseHandicap } from '@/lib/courseHandicap';

export default function RegisterPage({ params }) {
    const { tournamentId } = params; // slug
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [handicapIndex, setHandicapIndex] = useState('');

    // Dynamic state
    const [settings, setSettings] = useState(null);
    const [courses, setCourses] = useState([]); // All available courses for this tournament
    const [startLoading, setStartLoading] = useState(true);

    // Selections state: { [courseId]: teeName }
    const [teeSelections, setTeeSelections] = useState({});

    // Calculated handicaps: { [courseId]: handicap }
    const [courseHandicaps, setCourseHandicaps] = useState({});

    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch settings to get configured rounds
                const settingsRes = await fetch(`/api/settings?tournamentId=${tournamentId}`);
                if (!settingsRes.ok) throw new Error('Failed to fetch settings');
                const settingsData = await settingsRes.json();
                setSettings(settingsData);

                // Fetch courses to get details (tees, ratings, etc.)
                const coursesRes = await fetch(`/api/courses?tournamentId=${tournamentId}`);
                if (!coursesRes.ok) throw new Error('Failed to fetch courses');
                const coursesData = await coursesRes.json();
                setCourses(coursesData);

            } catch (error) {
                console.error('Error loading registration data:', error);
            } finally {
                setStartLoading(false);
            }
        };

        fetchData();
    }, [tournamentId]);

    // Auto-calculate course handicaps when handicap index or tee selection changes
    useEffect(() => {
        if (!handicapIndex || !courses.length) {
            setCourseHandicaps({});
            return;
        }

        const index = parseFloat(handicapIndex);
        if (isNaN(index)) return;

        const newHandicaps = {};

        // Calculate for each selected tee
        Object.entries(teeSelections).forEach(([courseId, teeName]) => {
            const course = courses.find(c => c.id === courseId);
            if (course && course.tees) {
                const tee = course.tees.find(t => t.name === teeName);
                if (tee) {
                    // Use standard formula (assuming simplistic par mapping if needed, but par is on course)
                    // If formula needs (Rating - Par), we use course.par
                    // Note: calculateCourseHandicap returns generic calc
                    // Formula: (Index * Slope / 113) + (Rating - Par)

                    // We need slope and rating from tee, par from course
                    // If tee has rating/slope
                    if (tee.slope && tee.rating) {
                        newHandicaps[courseId] = calculateCourseHandicap(
                            index,
                            tee.rating,
                            tee.slope,
                            course.par || 72
                        );
                    }
                }
            }
        });

        setCourseHandicaps(newHandicaps);
    }, [handicapIndex, teeSelections, courses]);

    const handleTeeChange = (courseId, teeName) => {
        setTeeSelections(prev => ({
            ...prev,
            [courseId]: teeName
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Map dynamic selections to legacy fields for backend compatibility
        // We do this by checking course names
        let teeRiver = 'Gold';
        let teePlantation = 'Gold';
        let teeRNK = 'Gold';
        let hcpRiver = 0;
        let hcpPlantation = 0;
        let hcpRNK = 0;
        const courseData = {};

        courses.forEach(course => {
            const selection = teeSelections[course.id];
            const handicap = courseHandicaps[course.id] || 0;

            if (selection) {
                if (course.name.toLowerCase().includes('river')) {
                    teeRiver = selection;
                    hcpRiver = handicap;
                } else if (course.name.toLowerCase().includes('plantation')) {
                    teePlantation = selection;
                    hcpPlantation = handicap;
                } else if (course.name.toLowerCase().includes('royal') || course.name.toLowerCase().includes('rnk')) {
                    teeRNK = selection;
                    hcpRNK = handicap;
                }

                // New Dynamic Method (Store in JSON by courseId)
                courseData[course.id] = { tee: selection, hcp: handicap };
            }
        });

        const payload = {
            name,
            email,
            handicapIndex: parseFloat(handicapIndex) || 0,
            teeRiver,
            teePlantation,
            teeRNK,
            hcpRiver,
            hcpPlantation,
            hcpRNK,
            courseData,
            tournamentId // slug
        };

        try {
            const res = await fetch('/api/players', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to register');
            }
            router.push(`/t/${tournamentId}/players`);
            router.refresh(); // Ensure list updates
        } catch (err) {
            console.error(err);
            alert('Error registering: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Determine unique courses from configured rounds
    const roundCourseIds = settings?.roundCourses || [];
    // Filter to get unique course objects that are actually used in rounds (deduplicate)
    const uniqueUsedCourseIds = [...new Set(roundCourseIds)];
    const usedCourses = uniqueUsedCourseIds.map(id => courses.find(c => c.id === id)).filter(Boolean);

    // Provide a fallback or filtered list. If specific rounds are set, use them.
    // If NO rounds are set, we want to hide the section as per user request.
    const roundsConfigured = roundCourseIds.length > 0;

    if (startLoading) {
        return (
            <div className="fade-in" style={{ maxWidth: '700px', margin: '4rem auto', textAlign: 'center' }}>
                <div className="card">Loading registration details...</div>
            </div>
        );
    }

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

                {/* Tee Selections - Conditionally Rendered */}
                {roundsConfigured ? (
                    <div style={{
                        marginBottom: '2rem',
                        padding: '1.5rem',
                        background: 'rgba(212, 175, 55, 0.05)',
                        borderRadius: 'var(--radius)',
                        border: '1px solid rgba(212, 175, 55, 0.2)'
                    }}>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Tee Selections</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            Select which tees you&apos;ll be playing from for each scheduled course
                        </p>

                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            {usedCourses.map(course => (
                                <div key={course.id}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                        {course.name}
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', alignItems: 'end' }}>
                                        <select
                                            value={teeSelections[course.id] || ''}
                                            onChange={(e) => handleTeeChange(course.id, e.target.value)}
                                            style={{
                                                padding: '10px',
                                                borderRadius: 'var(--radius)',
                                                border: '1px solid var(--glass-border)',
                                                background: 'var(--bg-dark)',
                                                color: 'var(--text-main)',
                                                fontSize: '1rem'
                                            }}
                                            required
                                        >
                                            <option value="">Select Tee...</option>
                                            {course.tees && Array.isArray(course.tees) && course.tees.map((tee, idx) => (
                                                <option key={idx} value={tee.name}>
                                                    {tee.name} ({tee.yardage?.toLocaleString()} yds, {tee.rating}/{tee.slope})
                                                </option>
                                            ))}
                                        </select>
                                        <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius)' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Course Hcp</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                                                {courseHandicaps[course.id] !== undefined ? courseHandicaps[course.id] : '-'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div style={{
                        marginBottom: '2rem',
                        padding: '1.5rem',
                        borderRadius: 'var(--radius)',
                        border: '1px dashed var(--glass-border)',
                        textAlign: 'center',
                        color: 'var(--text-muted)'
                    }}>
                        <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Tee Selection Unavailable</p>
                        <p style={{ fontSize: '0.9rem' }}>Please configure rounds in settings to enable tee selection.</p>
                    </div>
                )}

                <button type="submit" className="btn" style={{ width: '100%' }} disabled={loading}>
                    {loading ? 'Registering...' : 'Complete Registration'}
                </button>
            </form>
        </div>
    );
}
