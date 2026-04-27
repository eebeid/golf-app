import React, { useState, useEffect } from 'react';

export default function CourseSettingsTab({ tournamentId, courses, setCourses, fetchCourses }) {
    const [selectedCourseId, setSelectedCourseId] = useState(1);
    const [selectedTeeIndex, setSelectedTeeIndex] = useState(0);
    const [fetchingNcrdb, setFetchingNcrdb] = useState(false);
    const [scorecardUrl, setScorecardUrl] = useState('');
    const [fetchingHandicaps, setFetchingHandicaps] = useState(false);
    const [savingCourses, setSavingCourses] = useState(false);
    const [courseMessage, setCourseMessage] = useState('');
    const [newCourseName, setNewCourseName] = useState('');
    const [newCoursePar, setNewCoursePar] = useState(72);
    const [addingCourse, setAddingCourse] = useState(false);
    const [addCourseStep, setAddCourseStep] = useState('idle'); // 'idle' | 'saving' | 'done'
    const [confirmDeleteCourseId, setConfirmDeleteCourseId] = useState(null);
    const [courseSearch, setCourseSearch] = useState('');
    const [coursePlaceResults, setCoursePlaceResults] = useState([]);
    const [searchingCoursePlaces, setSearchingCoursePlaces] = useState(false);
    const [newCourseAddress, setNewCourseAddress] = useState('');
    const [newCourseLat, setNewCourseLat] = useState(null);
    const [newCourseLng, setNewCourseLng] = useState(null);

    useEffect(() => {
        if (courses.length > 0 && selectedCourseId === 1) {
            setSelectedCourseId(courses[0].id);
        }
    }, [courses, selectedCourseId]);

    const selectedCourse = Array.isArray(courses) ? courses.find(c => c.id === selectedCourseId) : null;

    const handleDeleteCourse = async (courseId) => {
        setSavingCourses(true);
        setConfirmDeleteCourseId(null);
        try {
            const res = await fetch(`/api/courses/${courseId}`, { method: 'DELETE' });
            if (res.ok) {
                const newCourses = courses.filter(c => c.id !== courseId);
                setCourses(newCourses);
                setSelectedCourseId(newCourses.length > 0 ? newCourses[0].id : null);
            } else {
                console.error('Failed to delete course');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSavingCourses(false);
        }
    };

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
                const currentTees = Array.isArray(c.tees) ? c.tees : [];
                const newTees = [...currentTees];
                if (newTees[teeIndex]) {
                    newTees[teeIndex] = { ...newTees[teeIndex], [field]: value };
                    return { ...c, tees: newTees };
                }
            }
            return c;
        });
        setCourses(updatedCourses);
    };

    const handleFetchNcrdbTees = async () => {
        if (!selectedCourseId) return;
        const course = courses.find(c => c.id === selectedCourseId);
        if (!course) return;

        setFetchingNcrdb(true);
        try {
            let state = '';
            if (course.address) {
                const parts = course.address.split(',');
                if (parts.length >= 2) {
                    const stateZip = parts[parts.length - 2].trim().split(' ');
                    if (stateZip.length > 0) state = `US-${stateZip[0]}`;
                }
            }

            const res = await fetch(`/api/ncrdb?name=${encodeURIComponent(course.name)}&state=${encodeURIComponent(state)}`);
            const data = await res.json();
            
            if (res.ok && data.tees && data.tees.length > 0) {
                if (course.tees && course.tees.length > 0) {
                    const confirm = window.confirm(`Found ${data.tees.length} tees on NCRDB. Replace existing tees?`);
                    if (!confirm) {
                        setFetchingNcrdb(false);
                        return;
                    }
                }
                handleCourseUpdate('tees', data.tees);
                setSelectedTeeIndex(0);
                alert(`Successfully imported ${data.tees.length} tees from USGA NCRDB.`);
            } else {
                alert('No tees found on NCRDB for this course name.');
            }
        } catch (e) {
            console.error(e);
            alert('Error fetching from NCRDB');
        } finally {
            setFetchingNcrdb(false);
        }
    };

    const handleFetchHandicaps = async () => {
        if (!selectedCourseId || !scorecardUrl) return;
        const course = courses.find(c => c.id === selectedCourseId);
        if (!course) return;

        setFetchingHandicaps(true);
        try {
            const res = await fetch('/api/handicap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: scorecardUrl })
            });

            const data = await res.json();
            
            if (res.ok && data.holes && data.holes.length > 0) {
                const existingHoles = course.holes ? [...course.holes] : [];
                if (existingHoles.length === 0) {
                    for (let i = 1; i <= 18; i++) {
                        existingHoles.push({ number: i, par: 4, handicapIndex: '' });
                    }
                }

                if (selectedTeeIndex !== null) {
                    const currentTees = [...selectedCourse.tees];
                    const tee = { ...currentTees[selectedTeeIndex] };
                    const handicaps = Array.isArray(tee.handicaps) ? [...tee.handicaps] : [];

                    if (handicaps.length === 0) {
                        for (let i = 1; i <= 18; i++) handicaps.push({ hole: i, index: '' });
                    }

                    data.holes.forEach(h => {
                        const hIndex = handicaps.findIndex(hole => hole.hole === h.hole);
                        if (hIndex > -1) {
                            handicaps[hIndex].index = h.handicap;
                        }
                    });

                    handleTeeUpdate(selectedTeeIndex, 'handicaps', handicaps);
                    alert(`Successfully extracted ${data.holes.length} handicaps for ${tee.name}!`);
                } else {
                    data.holes.forEach(h => {
                        const holeIndex = h.hole - 1;
                        if (existingHoles[holeIndex]) {
                            existingHoles[holeIndex].handicapIndex = h.handicap;
                        }
                    });

                    handleCourseUpdate('holes', existingHoles);
                    alert(`Successfully extracted ${data.holes.length} handicaps with ${data.confidence} confidence!`);
                }
                setScorecardUrl(''); 
            } else {
                alert('No proper handicaps found in the provided URL/PDF.');
            }
        } catch (e) {
            console.error(e);
            alert('Error running scraper');
        } finally {
            setFetchingHandicaps(false);
        }
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

    const handleAddTee = () => {
        const updatedCourses = courses.map(c => {
            if (c.id === selectedCourseId) {
                const currentTees = Array.isArray(c.tees) ? c.tees : [];
                const newTee = { 
                    name: 'New Tee', 
                    yardage: 6000, 
                    rating: 70, 
                    slope: 113,
                    handicaps: Array(18).fill(null).map((_, i) => ({ hole: i + 1, index: '' }))
                };
                return { ...c, tees: [...currentTees, newTee] };
            }
            return c;
        });
        setCourses(updatedCourses);
        const course = courses.find(c => c.id === selectedCourseId);
        if (course) {
            setSelectedTeeIndex((course.tees || []).length);
        }
    };

    const handleDeleteTee = (teeIndex) => {
        if (!window.confirm("Are you sure you want to delete this tee box?")) return;
        const updatedCourses = courses.map(c => {
            if (c.id === selectedCourseId) {
                const currentTees = Array.isArray(c.tees) ? c.tees : [];
                const newTees = currentTees.filter((_, i) => i !== teeIndex);
                return { ...c, tees: newTees };
            }
            return c;
        });
        setCourses(updatedCourses);
        if (selectedTeeIndex >= (updatedCourses.find(c => c.id === selectedCourseId)?.tees?.length || 0)) {
            setSelectedTeeIndex(0);
        }
    };

    const handleSearchCoursePlaces = async (searchQuery) => {
        if (!searchQuery || !searchQuery.trim()) {
            setCoursePlaceResults([]);
            return;
        }
        setSearchingCoursePlaces(true);
        try {
            const enhancedQuery = searchQuery.toLowerCase().includes('golf') ? searchQuery : `${searchQuery} golf course`;
            const res = await fetch(`/api/places?query=${encodeURIComponent(enhancedQuery)}`);
            const data = await res.json();
            if (res.ok) {
                setCoursePlaceResults(data || []);
            } else {
                console.error('Failed to search places: ' + (data.error || 'Unknown error'));
            }
        } catch (e) {
            console.error('Error searching places', e);
        } finally {
            setSearchingCoursePlaces(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (courseSearch.trim().length > 2) {
                handleSearchCoursePlaces(courseSearch);
            } else {
                setCoursePlaceResults([]);
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [courseSearch]);

    const handleSelectCoursePlace = async (placeId) => {
        setSearchingCoursePlaces(true);
        try {
            const res = await fetch(`/api/places?placeId=${placeId}`);
            const data = await res.json();
            if (res.ok) {
                setNewCourseName(data.name || '');
                setNewCourseAddress(data.formatted_address || '');
                if (data.geometry?.location) {
                    setNewCourseLat(data.geometry.location.lat);
                    setNewCourseLng(data.geometry.location.lng);
                }
                setCoursePlaceResults([]);
                setCourseSearch('');
            } else {
                alert('Failed to get place details: ' + (data.error || 'Unknown error'));
            }
        } catch (e) {
            console.error(e);
            alert('Error fetching place details');
        } finally {
            setSearchingCoursePlaces(false);
        }
    };

    const handleAddCourse = async (e) => {
        e.preventDefault();
        if (!newCourseName.trim()) return;
        const courseName = newCourseName.trim();
        setAddingCourse(true);
        setAddCourseStep('saving');
        try {
            const res = await fetch('/api/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId,
                    courses: [{
                        name: courseName,
                        par: parseInt(newCoursePar),
                        address: newCourseAddress,
                        lat: newCourseLat,
                        lng: newCourseLng,
                        tees: []
                    }]
                })
            });

            if (!res.ok) { alert('Failed to add course'); return; }

            const addedData = await res.json();
            const newCourseId = Array.isArray(addedData)
                ? addedData[addedData.length - 1]?.id
                : addedData?.id;

            setNewCourseName('');
            setNewCourseAddress('');
            setNewCourseLat(null);
            setNewCourseLng(null);
            setNewCoursePar(72);
            await fetchCourses();
            if (newCourseId) setSelectedCourseId(newCourseId);

            setAddCourseStep('done');
            setTimeout(() => setAddCourseStep('idle'), 3000);
        } catch (err) {
            console.error(err);
            alert('Error adding course');
            setAddCourseStep('idle');
        } finally {
            setAddingCourse(false);
        }
    };

    const handleSaveCourses = async () => {
        setSavingCourses(true);
        setCourseMessage('');
        try {
            const res = await fetch('/api/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournamentId, courses })
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

    return (
        <div className="card">
            <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Course Management</h2>

            <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--accent)', fontSize: '1.1rem' }}>Add New Course</h3>

                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(212, 175, 55, 0.05)', borderRadius: 'var(--radius)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                    <h4 style={{ color: 'var(--accent)', marginBottom: '0.5rem', margin: 0 }}>🔍 Search via Google Places</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Auto-fill the form by searching for a golf course.</p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <input
                                value={courseSearch}
                                onChange={e => setCourseSearch(e.target.value)}
                                placeholder="Start typing a golf course name..."
                                style={{ width: '100%', padding: '10px 10px 10px 35px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                            />
                            <span style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}>🔍</span>
                            {searchingCoursePlaces && (
                                <span style={{ position: 'absolute', right: '10px', top: '10px', color: 'var(--accent)', fontSize: '0.8rem' }}>Loading...</span>
                            )}
                        </div>
                    </div>

                    {coursePlaceResults.length > 0 && (
                        <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                            {coursePlaceResults.map(p => (
                                <div
                                    key={p.place_id}
                                    onClick={() => handleSelectCoursePlace(p.place_id)}
                                    style={{ padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s', ':hover': { borderColor: 'var(--accent)' } }}
                                >
                                    <div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{p.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.formatted_address}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <form onSubmit={handleAddCourse} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Course Name</label>
                        <input
                            value={newCourseName}
                            onChange={e => setNewCourseName(e.target.value)}
                            placeholder="e.g. Ocean Course"
                            style={{ width: '100%', padding: '8px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                            required
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Address</label>
                        <input
                            value={newCourseAddress}
                            onChange={e => setNewCourseAddress(e.target.value)}
                            placeholder="Course Address"
                            style={{ width: '100%', padding: '8px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                        />
                    </div>
                    <div style={{ width: '80px' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Par</label>
                        <input
                            type="number"
                            value={newCoursePar}
                            onChange={e => setNewCoursePar(e.target.value)}
                            style={{ width: '100%', padding: '8px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                        />
                    </div>
                    <button type="submit" className="btn" disabled={addingCourse}
                        style={{ minWidth: 130, whiteSpace: 'nowrap' }}>
                        {addCourseStep === 'saving' && 'Saving...'}
                        {addCourseStep === 'done' && '✓ Done'}
                        {addCourseStep === 'idle' && 'Add'}
                    </button>
                </form>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Select Course to Edit
                </label>
                <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
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
                <div>
                    <div className="fade-in" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-card)', borderRadius: 'var(--radius)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--accent)', paddingBottom: '0.5rem' }}>
                            <h3 style={{ margin: 0, color: 'var(--accent)' }}>
                                Editing: {selectedCourse.name}
                            </h3>
                            {confirmDeleteCourseId === selectedCourse.id ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Delete this course?</span>
                                    <button
                                        onClick={(e) => { e.preventDefault(); handleDeleteCourse(selectedCourse.id); }}
                                        className="btn-outline"
                                        style={{ borderColor: '#ff6b6b', color: '#ff6b6b', padding: '4px 12px', fontSize: '0.82rem' }}
                                    >
                                        Yes, Delete
                                    </button>
                                    <button
                                        onClick={(e) => { e.preventDefault(); setConfirmDeleteCourseId(null); }}
                                        className="btn-outline"
                                        style={{ padding: '4px 12px', fontSize: '0.82rem' }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={(e) => { e.preventDefault(); setConfirmDeleteCourseId(selectedCourse.id); }}
                                    className="btn-outline"
                                    style={{ borderColor: '#ff6b6b', color: '#ff6b6b', padding: '4px 8px', fontSize: '0.9rem' }}
                                >
                                    Delete Course
                                </button>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Name</label>
                                <input
                                    value={selectedCourse.name || ''}
                                    onChange={(e) => handleCourseUpdate('name', e.target.value)}
                                    style={{ width: '100%', padding: '8px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Address</label>
                                <input
                                    value={selectedCourse.address || ''}
                                    onChange={(e) => handleCourseUpdate('address', e.target.value)}
                                    style={{ width: '100%', padding: '8px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Par</label>
                                <input
                                    type="number"
                                    value={selectedCourse.par || 72}
                                    onChange={(e) => handleCourseUpdate('par', parseInt(e.target.value) || 72)}
                                    style={{ width: '100%', padding: '8px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius)' }}>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Tee Box Settings</h3>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Select Tee to Edit</label>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                {Array.isArray(selectedCourse.tees) && selectedCourse.tees.map((tee, index) => (
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
                                <button
                                    onClick={handleAddTee}
                                    className="btn-outline"
                                    style={{ padding: '8px 12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                >
                                    + Add Tee
                                </button>

                                <button
                                    onClick={handleFetchNcrdbTees}
                                    disabled={fetchingNcrdb}
                                    className="btn-primary"
                                    style={{ padding: '8px 12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginLeft: 'auto' }}
                                >
                                    {fetchingNcrdb ? 'Fetching...' : '⛳ Import from NCRDB'}
                                </button>
                            </div>
                        </div>
                        {selectedTeeIndex !== null && Array.isArray(selectedCourse.tees) && selectedCourse.tees[selectedTeeIndex] && (
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
                                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    <button
                                        onClick={(e) => { e.preventDefault(); handleDeleteTee(selectedTeeIndex); }}
                                        className="btn-outline"
                                        style={{
                                            borderColor: '#ff6b6b',
                                            color: '#ff6b6b',
                                            padding: '10px',
                                            width: '100%',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        Delete Tee
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Hole Data (Par & {selectedTeeIndex !== null ? `Handicap for ${selectedCourse.tees[selectedTeeIndex]?.name}` : 'Handicap'})</h3>
                    
                    <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input 
                            type="url"
                            placeholder="Scorecard URL (PDF or HTML) to auto-fill Handicaps"
                            value={scorecardUrl}
                            onChange={(e) => setScorecardUrl(e.target.value)}
                            style={{
                                flex: 1,
                                minWidth: '250px',
                                padding: '8px 12px',
                                borderRadius: 'var(--radius)',
                                border: '1px solid var(--glass-border)',
                                background: 'var(--bg-dark)',
                                color: 'white'
                            }}
                        />
                        <button 
                            onClick={handleFetchHandicaps}
                            disabled={fetchingHandicaps || !scorecardUrl}
                            className="btn-primary"
                            style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}
                        >
                            {fetchingHandicaps ? 'Scanning...' : 'Extract Handicaps'}
                        </button>
                    </div>
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
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    <input
                                        placeholder="Par"
                                        type="number"
                                        value={hole.par || ''}
                                        onChange={(e) => handleHoleUpdate(index, 'par', parseInt(e.target.value))}
                                        style={{
                                            width: '100%',
                                            padding: '4px',
                                            textAlign: 'center',
                                            borderRadius: '4px',
                                            border: '1px solid var(--glass-border)',
                                            background: 'rgba(255,255,255,0.05)',
                                            color: 'var(--text-main)',
                                            fontSize: '0.8rem'
                                        }}
                                        title="Par"
                                    />
                                    <input
                                        placeholder="HCP"
                                        type="number"
                                        min="1"
                                        max="18"
                                        value={(selectedTeeIndex !== null && selectedCourse.tees[selectedTeeIndex]?.handicaps?.find(h => h.hole === hole.number)?.index) || hole.handicapIndex || ''}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            if (selectedTeeIndex !== null) {
                                                const currentTees = [...selectedCourse.tees];
                                                const tee = { ...currentTees[selectedTeeIndex] };
                                                const handicaps = Array.isArray(tee.handicaps) ? [...tee.handicaps] : [];
                                                
                                                if (handicaps.length === 0) {
                                                    for(let i=1; i<=18; i++) handicaps.push({ hole: i, index: '' });
                                                }

                                                const hIndex = handicaps.findIndex(h => h.hole === hole.number);
                                                if (hIndex > -1) {
                                                    handicaps[hIndex] = { ...handicaps[hIndex], index: val };
                                                } else {
                                                    handicaps.push({ hole: hole.number, index: val });
                                                }
                                                
                                                handleTeeUpdate(selectedTeeIndex, 'handicaps', handicaps);
                                            } else {
                                                handleHoleUpdate(index, 'handicapIndex', val);
                                            }
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '4px',
                                            textAlign: 'center',
                                            borderRadius: '4px',
                                            border: '1px solid var(--glass-border)',
                                            background: selectedTeeIndex !== null ? 'rgba(212, 175, 55, 0.1)' : 'var(--bg-dark)',
                                            color: 'var(--text-main)',
                                            fontSize: '0.8rem'
                                        }}
                                        title={selectedTeeIndex !== null ? `Handicap for ${selectedCourse.tees[selectedTeeIndex].name}` : "Global Handicap"}
                                    />
                                </div>
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
                </div>
            )}
        </div>
    );
}
