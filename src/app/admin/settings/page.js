"use client";

import { useState, useEffect } from 'react';
import coursesData from '@/../../data/courses.json';

export default function AdminSettingsPage() {
    const [numberOfRounds, setNumberOfRounds] = useState(3);
    const [roundDates, setRoundDates] = useState([]);
    const [roundCourses, setRoundCourses] = useState([]);
    const [totalPlayers, setTotalPlayers] = useState(0);
    const [showAccommodations, setShowAccommodations] = useState(true);
    const [showFood, setShowFood] = useState(true);
    const [showPhotos, setShowPhotos] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState(1);
    const [selectedTeeIndex, setSelectedTeeIndex] = useState(0);
    const [savingCourses, setSavingCourses] = useState(false);
    const [courseMessage, setCourseMessage] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === '2626') {
            setIsAuthenticated(true);
        } else {
            alert('Incorrect password');
        }
    };

    useEffect(() => {
        fetchSettings();
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await fetch('/api/courses');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setCourses(data);
                } else {
                    console.error('Invalid courses data format:', data);
                    setCourses([]);
                }
            } else {
                console.error('Failed to fetch courses:', res.status);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const selectedCourse = Array.isArray(courses) ? courses.find(c => c.id === selectedCourseId) : null;

    const handleCourseUpdate = (field, value) => {
        const updatedCourses = courses.map(c => {
            if (c.id === selectedCourseId) {
                return { ...c, [field]: value };
            }
            return c;
        });
        setCourses(updatedCourses);
    };

    const handleTeeUpdate = (teeIndex, field, value) => {
        const updatedCourses = courses.map(c => {
            if (c.id === selectedCourseId) {
                const newTees = [...c.tees];
                newTees[teeIndex] = { ...newTees[teeIndex], [field]: value };
                return { ...c, tees: newTees };
            }
            return c;
        });
        setCourses(updatedCourses);
    };

    const handleHoleUpdate = (holeIndex, field, value) => {
        const updatedCourses = courses.map(c => {
            if (c.id === selectedCourseId) {
                const newHoles = c.holes ? [...c.holes] : [];
                if (newHoles[holeIndex]) {
                    newHoles[holeIndex] = { ...newHoles[holeIndex], [field]: value };
                    return { ...c, holes: newHoles };
                }
            }
            return c;
        });
        setCourses(updatedCourses);
    };

    const handleSaveCourses = async () => {
        setSavingCourses(true);
        setCourseMessage('');

        try {
            const res = await fetch('/api/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(courses)
            });

            if (res.ok) {
                setCourseMessage('Course data saved successfully!');
                setTimeout(() => setCourseMessage(''), 3000);
            } else {
                setCourseMessage('Error saving course data');
            }
        } catch (error) {
            console.error('Error saving courses:', error);
            setCourseMessage('Error saving course data');
        } finally {
            setSavingCourses(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();

                setNumberOfRounds(data.numberOfRounds || 3);
                setRoundDates(data.roundDates || []);
                // Ensure course IDs are valid numbers, default to 1 if null
                setRoundCourses((data.roundCourses || []).map(id => id || 1));
                setTotalPlayers(data.totalPlayers || 0);
                setShowAccommodations(!!data.showAccommodations);
                setShowFood(data.showFood !== false); // Default to true if undefined
                setShowPhotos(!!data.showPhotos);     // Default to false if undefined
            } else {
                console.error('Failed to fetch settings:', res.status);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNumberOfRoundsChange = (value) => {
        const num = parseInt(value) || 0;
        setNumberOfRounds(num);

        // Adjust arrays to match new number of rounds
        const newDates = [...roundDates];
        const newCourses = [...roundCourses];

        while (newDates.length < num) newDates.push('');
        while (newCourses.length < num) newCourses.push(1);

        setRoundDates(newDates.slice(0, num));
        setRoundCourses(newCourses.slice(0, num));
    };

    const handleDateChange = (index, value) => {
        const newDates = [...roundDates];
        newDates[index] = value;
        setRoundDates(newDates);
    };

    const handleCourseChange = (index, value) => {
        const newCourses = [...roundCourses];
        newCourses[index] = parseInt(value);
        setRoundCourses(newCourses);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    numberOfRounds,
                    roundDates,
                    roundCourses,
                    totalPlayers,
                    showAccommodations,
                    showFood,
                    showPhotos
                })
            });

            if (res.ok) {
                setMessage('Settings saved successfully!');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('Error saving settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="fade-in" style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
                <h1 className="section-title">Admin Access</h1>
                <form onSubmit={handleLogin} className="card">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter Password"
                        style={{
                            width: '100%',
                            padding: '10px',
                            marginBottom: '1rem',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--glass-border)',
                            background: 'var(--bg-dark)',
                            color: 'var(--text-main)',
                            fontSize: '1rem'
                        }}
                    />
                    <button type="submit" className="btn" style={{ width: '100%' }}>Login</button>
                </form>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
                <h1 className="section-title">Tournament Settings</h1>
                <div className="card">Loading...</div>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h1 className="section-title">Tournament Settings</h1>

            <div className="card" style={{ marginBottom: '2rem' }}>
                {/* Tournament Configuration */}
                <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Tournament Configuration</h2>

                {/* Number of Rounds */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Number of Rounds
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="10"
                        value={numberOfRounds}
                        onChange={(e) => handleNumberOfRoundsChange(e.target.value)}
                        style={{
                            width: '150px',
                            padding: '10px',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--glass-border)',
                            background: 'var(--bg-dark)',
                            color: 'var(--text-main)',
                            fontSize: '1rem'
                        }}
                    />
                </div>

                {/* Round Details */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Round Details</h3>
                    {Array.from({ length: numberOfRounds }).map((_, index) => (
                        <div
                            key={index}
                            style={{
                                padding: '1rem',
                                marginBottom: '1rem',
                                background: 'rgba(212, 175, 55, 0.05)',
                                borderRadius: 'var(--radius)',
                                border: '1px solid rgba(212, 175, 55, 0.2)'
                            }}
                        >
                            <h4 style={{ marginBottom: '1rem' }}>Round {index + 1}</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                        Date
                                    </label>
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
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                        Course
                                    </label>
                                    <select
                                        value={roundCourses[index] || 1}
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
                                        {coursesData.map(course => (
                                            <option key={course.id} value={course.id}>
                                                {course.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Total Players */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Total Number of Players
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={totalPlayers}
                        onChange={(e) => setTotalPlayers(parseInt(e.target.value) || 0)}
                        style={{
                            width: '150px',
                            padding: '10px',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--glass-border)',
                            background: 'var(--bg-dark)',
                            color: 'var(--text-main)',
                            fontSize: '1rem'
                        }}
                    />
                </div>

                {/* Page Visibility */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Page Visibility</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={showAccommodations}
                                onChange={(e) => setShowAccommodations(e.target.checked)}
                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                            />
                            <span>Show Accommodations Page</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={showFood}
                                onChange={(e) => setShowFood(e.target.checked)}
                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                            />
                            <span>Show Food Page</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={showPhotos}
                                onChange={(e) => setShowPhotos(e.target.checked)}
                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                            />
                            <span>Show Photos Page</span>
                        </label>
                    </div>
                </div>

                {/* Save Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={handleSave}
                        className="btn"
                        disabled={saving}
                        style={{ minWidth: '150px' }}
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
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
            {/* Course Management Section */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Course Management</h2>

                {/* Course Selector */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Select Course to Edit
                    </label>
                    <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(parseInt(e.target.value))}
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
                        {Array.isArray(courses) && courses.map(course => (
                            <option key={course.id} value={course.id}>
                                {course.name}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedCourse && (
                    <>
                        {/* Tee Selection and Editing */}
                        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius)' }}>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Tee Box Settings</h3>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Select Tee to Edit</label>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    {selectedCourse.tees && selectedCourse.tees.map((tee, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedTeeIndex(index)}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: 'var(--radius)',
                                                border: `1px solid ${selectedTeeIndex === index ? 'var(--accent)' : 'var(--glass-border)'}`,
                                                background: selectedTeeIndex === index ? 'var(--accent)' : 'transparent',
                                                color: selectedTeeIndex === index ? '#000' : 'var(--text-main)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {tee.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {selectedTeeIndex !== null && selectedCourse.tees && selectedCourse.tees[selectedTeeIndex] && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Name</label>
                                        <input
                                            type="text"
                                            value={selectedCourse.tees[selectedTeeIndex].name}
                                            onChange={(e) => handleTeeUpdate(selectedTeeIndex, 'name', e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                borderRadius: 'var(--radius)',
                                                border: '1px solid var(--glass-border)',
                                                background: 'var(--bg-dark)',
                                                color: 'var(--text-main)'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Yardage</label>
                                        <input
                                            type="number"
                                            value={selectedCourse.tees[selectedTeeIndex].yardage}
                                            onChange={(e) => handleTeeUpdate(selectedTeeIndex, 'yardage', parseInt(e.target.value))}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                borderRadius: 'var(--radius)',
                                                border: '1px solid var(--glass-border)',
                                                background: 'var(--bg-dark)',
                                                color: 'var(--text-main)'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Course Rating</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={selectedCourse.tees[selectedTeeIndex].rating}
                                            onChange={(e) => handleTeeUpdate(selectedTeeIndex, 'rating', parseFloat(e.target.value))}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                borderRadius: 'var(--radius)',
                                                border: '1px solid var(--glass-border)',
                                                background: 'var(--bg-dark)',
                                                color: 'var(--text-main)'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Slope Rating</label>
                                        <input
                                            type="number"
                                            value={selectedCourse.tees[selectedTeeIndex].slope}
                                            onChange={(e) => handleTeeUpdate(selectedTeeIndex, 'slope', parseInt(e.target.value))}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                borderRadius: 'var(--radius)',
                                                border: '1px solid var(--glass-border)',
                                                background: 'var(--bg-dark)',
                                                color: 'var(--text-main)'
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Hole Handicaps</h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                            gap: '1rem',
                            marginBottom: '2rem'
                        }}>
                            {selectedCourse.holes.map((hole, index) => (
                                <div key={hole.number} style={{ textAlign: 'center' }}>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                                        Hole {hole.number}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="18"
                                        value={hole.handicapIndex || ''}
                                        onChange={(e) => handleHoleUpdate(index, 'handicapIndex', parseInt(e.target.value))}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            textAlign: 'center',
                                            borderRadius: 'var(--radius)',
                                            border: '1px solid var(--glass-border)',
                                            background: 'var(--bg-dark)',
                                            color: 'var(--text-main)'
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                onClick={handleSaveCourses}
                                className="btn"
                                disabled={savingCourses}
                                style={{ minWidth: '150px' }}
                            >
                                {savingCourses ? 'Saving Types...' : 'Save Course Data'}
                            </button>
                            {courseMessage && (
                                <span style={{
                                    color: courseMessage.includes('Error') ? '#ff6b6b' : 'var(--accent)',
                                    fontWeight: 'bold'
                                }}>
                                    {courseMessage}
                                </span>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
