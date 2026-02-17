"use client";

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';


export default function AdminSettingsPage() {
    const params = useParams();
    const tournamentId = params?.tournamentId;

    const [numberOfRounds, setNumberOfRounds] = useState(0);
    const [activeTab, setActiveTab] = useState('general');
    const [roundDates, setRoundDates] = useState([]);
    const [roundCourses, setRoundCourses] = useState([]);
    const [showAccommodations, setShowAccommodations] = useState(true);
    const [showFood, setShowFood] = useState(true);
    const [roundTimeConfig, setRoundTimeConfig] = useState({});
    const [showPhotos, setShowPhotos] = useState(false);
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    // const [isAuthenticated, setIsAuthenticated] = useState(false); // Removed hardcoded auth
    // const [password, setPassword] = useState(''); // Removed hardcoded auth
    const [courses, setCourses] = useState([]);
    const [availableCourses, setAvailableCourses] = useState([]); // All global courses
    const [selectedCourseId, setSelectedCourseId] = useState(1);
    const [selectedTeeIndex, setSelectedTeeIndex] = useState(0);
    const [savingCourses, setSavingCourses] = useState(false);
    const [courseMessage, setCourseMessage] = useState('');
    const [newCourseName, setNewCourseName] = useState('');
    const [newCoursePar, setNewCoursePar] = useState(72);
    const [addingCourse, setAddingCourse] = useState(false);
    const [tripName, setTripName] = useState('');
    const [savingHistory, setSavingHistory] = useState(false);
    const [historyMessage, setHistoryMessage] = useState('');

    const [players, setPlayers] = useState([]);
    const [loadingPlayers, setLoadingPlayers] = useState(true);

    const [newPlayerName, setNewPlayerName] = useState('');
    const [newPlayerEmail, setNewPlayerEmail] = useState('');
    const [newPlayerHandicap, setNewPlayerHandicap] = useState('');
    const [addingPlayer, setAddingPlayer] = useState(false);

    const handleAddPlayer = async (e) => {
        e.preventDefault();
        setAddingPlayer(true);

        try {
            const res = await fetch('/api/players', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newPlayerName,
                    email: newPlayerEmail,
                    handicapIndex: parseFloat(newPlayerHandicap) || 0,
                    tournamentId
                })
            });

            if (res.ok) {
                const added = await res.json();
                setPlayers([...players, added]);
                // Reset form
                setNewPlayerName('');
                setNewPlayerEmail('');
                setNewPlayerHandicap('');
                alert('Player added successfully');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to add player');
            }
        } catch (err) {
            console.error(err);
            alert('Error adding player');
        } finally {
            setAddingPlayer(false);
        }
    };

    // Branding
    const [tournamentName, setTournamentName] = useState('Golf Tournament');
    const [logoUrl, setLogoUrl] = useState('');
    const [logoPreview, setLogoPreview] = useState(null);
    const [savingBranding, setSavingBranding] = useState(false);
    const [brandingMessage, setBrandingMessage] = useState('');
    // Branding


    // Lodging
    const [lodgings, setLodgings] = useState([]);
    const [lodgingForm, setLodgingForm] = useState({ name: '', address: '', url: '', notes: '', image: '' });
    const [savingLodging, setSavingLodging] = useState(false);

    // Restaurants
    const [restaurants, setRestaurants] = useState([]);
    const [restaurantForm, setRestaurantForm] = useState({ name: '', address: '', cuisine: '', url: '', notes: '' });
    const [savingRestaurant, setSavingRestaurant] = useState(false);
    const [editingRestaurantId, setEditingRestaurantId] = useState(null);

    // Prizes
    const [prizesTitle, setPrizesTitle] = useState('Tournament Prizes');
    const [prizes, setPrizes] = useState([]);
    const [prizeForm, setPrizeForm] = useState({ title: '', description: '', value: '' });
    const [savingPrizes, setSavingPrizes] = useState(false);
    const [prizesMessage, setPrizesMessage] = useState('');

    // const handleLogin = (e) => { ... } // Removed hardcoded auth logic

    useEffect(() => {
        fetchSettings();
        fetchCourses();
        fetchAvailableCourses(); // Fetch global library
        fetchPlayers();
        fetchLodgings();
        fetchRestaurants();
    }, []);

    const fetchLodgings = async () => {
        try {
            const res = await fetch(`/api/lodging?tournamentId=${tournamentId}`);
            if (res.ok) setLodgings(await res.json());
        } catch (error) { console.error(error); }
    };

    const fetchRestaurants = async () => {
        try {
            const res = await fetch(`/api/restaurants?tournamentId=${tournamentId}`);
            if (res.ok) setRestaurants(await res.json());
        } catch (error) { console.error(error); }
    };

    const fetchPlayers = async () => {
        try {
            const res = await fetch(`/api/players?tournamentId=${tournamentId}`);
            if (res.ok) {
                const data = await res.json();
                setPlayers(data);
            }
        } catch (error) {
            console.error('Error fetching players:', error);
        } finally {
            setLoadingPlayers(false);
        }
    };

    const fetchCourses = async () => {
        try {
            console.log('Fetching courses for tournament:', tournamentId);
            const res = await fetch(`/api/courses?tournamentId=${tournamentId}`);
            if (res.ok) {
                const data = await res.json();
                console.log('Courses fetched:', data.length);
                if (Array.isArray(data)) {
                    setCourses(data);
                    // Default to first course if none selected
                    if (data.length > 0 && selectedCourseId === 1) {
                        setSelectedCourseId(data[0].id);
                    }
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

    const fetchAvailableCourses = async () => {
        try {
            const res = await fetch('/api/courses?scope=global');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setAvailableCourses(data);
                }
            }
        } catch (error) {
            console.error('Error fetching global courses:', error);
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
                // Ensure tees array exists
                const currentTees = Array.isArray(c.tees) ? c.tees : [];
                const newTees = [...currentTees];

                // If the tee at this index causes issues, we can't update it.
                // But typically it should exist if rendered.
                if (newTees[teeIndex]) {
                    newTees[teeIndex] = { ...newTees[teeIndex], [field]: value };
                    return { ...c, tees: newTees };
                }
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

    const handleAddTee = () => {
        const updatedCourses = courses.map(c => {
            if (c.id === selectedCourseId) {
                const currentTees = Array.isArray(c.tees) ? c.tees : [];
                const newTee = { name: 'New Tee', yardage: 6000, rating: 70, slope: 113 };
                return { ...c, tees: [...currentTees, newTee] };
            }
            return c;
        });
        setCourses(updatedCourses);
        // Select the new tee (last index)
        const course = courses.find(c => c.id === selectedCourseId);
        if (course) {
            setSelectedTeeIndex((course.tees || []).length);
        }
    };

    const handleAddCourse = async (e) => {
        e.preventDefault();
        if (!newCourseName.trim()) return;
        setAddingCourse(true);
        try {
            const res = await fetch('/api/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId,
                    courses: [{ name: newCourseName, par: parseInt(newCoursePar) }]
                })
            });
            if (res.ok) {
                const addedData = await res.json();
                setNewCourseName('');
                setNewCoursePar(72);
                await fetchCourses(); // Refresh list

                // Select the new course for editing
                // The API might return the list or the single added course. 
                // Assuming standard REST, it returns the created object.
                // If it returns { courses: [...] }, we need to find it.
                // Based on previous code, let's try to find it in the refreshed list or use the response.
                if (addedData && addedData.id) {
                    setSelectedCourseId(addedData.id);
                } else if (Array.isArray(addedData)) {
                    // specific for this app's API pattern
                    const last = addedData[addedData.length - 1];
                    if (last) setSelectedCourseId(last.id);
                }

                alert('Course added! You can now configure tees and holes below.');
            } else {
                alert('Failed to add course');
            }
        } catch (e) {
            console.error(e);
            alert('Error adding course');
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

    const fetchSettings = async () => {
        try {
            const res = await fetch(`/api/settings?tournamentId=${tournamentId}`);
            if (res.ok) {
                const data = await res.json();

                setNumberOfRounds(data.numberOfRounds || 0);
                setRoundDates(data.roundDates || []);
                // Ensure course IDs are valid numbers, default to 1 if null
                setRoundCourses(data.roundCourses || []);
                setRoundTimeConfig(data.roundTimeConfig || {});
                setShowAccommodations(!!data.showAccommodations);
                setShowFood(data.showFood !== false); // Default to true if undefined
                setShowPhotos(!!data.showPhotos);     // Default to false if undefined
                setTournamentName(data.tournamentName || 'Golf Tournament');
                setLogoUrl(data.logoUrl || '');
                setPrizesTitle(data.prizesTitle || 'Tournament Prizes');
                setPrizes(Array.isArray(data.prizes) ? data.prizes : []);
            } else {
                console.error('Failed to fetch settings:', res.status);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddRound = () => {
        setNumberOfRounds(prev => prev + 1);
        setRoundDates([...roundDates, '']);
        setRoundCourses([...roundCourses, '']);
        // roundTimeConfig handles new keys lazily or we can init if needed
    };

    const handleDeleteRound = (indexToDelete) => {
        if (!confirm("Are you sure you want to delete this round?")) return;

        setNumberOfRounds(prev => prev - 1);
        setRoundDates(roundDates.filter((_, i) => i !== indexToDelete));
        setRoundCourses(roundCourses.filter((_, i) => i !== indexToDelete));

        // Update time config keys - this is trickier because keys are 1-based indices (Round 1, Round 2)
        // We need to shift all subsequent round configs down by 1
        const newTimeConfig = {};
        Object.keys(roundTimeConfig).forEach(key => {
            const roundNum = parseInt(key);
            if (roundNum < indexToDelete + 1) {
                newTimeConfig[roundNum] = roundTimeConfig[roundNum];
            } else if (roundNum > indexToDelete + 1) {
                newTimeConfig[roundNum - 1] = roundTimeConfig[roundNum];
            }
        });
        setRoundTimeConfig(newTimeConfig);
    };

    const handleDateChange = (index, value) => {
        const newDates = [...roundDates];
        newDates[index] = value;
        setRoundDates(newDates);
    };

    const handleCourseChange = async (index, value) => {
        // value is the course ID from the dropdown (could be global or local)
        let finalCourseId = value;

        // Find the selected course in available (global) or local courses
        // We look in availableCourses first as the dropdown is dominated by it?
        // Actually, we should probably update the dropdown to show availableCourses.
        const selectedGlobal = availableCourses.find(c => c.id === value);

        if (selectedGlobal) {
            // Check if we already have this course imported (by name)
            const existingLocal = courses.find(c => c.name === selectedGlobal.name);
            if (existingLocal) {
                finalCourseId = existingLocal.id;
            } else {
                // Must import (clone) the course
                try {
                    const res = await fetch('/api/courses', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            tournamentId,
                            courses: [{
                                name: selectedGlobal.name,
                                par: selectedGlobal.par,
                                address: selectedGlobal.address,
                                tees: selectedGlobal.tees,
                                holes: selectedGlobal.holes
                            }]
                        })
                    });
                    if (res.ok) {
                        const newCourses = await res.json();
                        if (newCourses && newCourses.length > 0) {
                            finalCourseId = newCourses[0].id;
                            // Refresh local courses
                            await fetchCourses();
                        }
                    } else {
                        alert('Failed to import course');
                        return;
                    }
                } catch (e) {
                    console.error('Error importing course:', e);
                    return;
                }
            }
        }

        const newCourses = [...roundCourses];
        newCourses[index] = finalCourseId;
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
                    tournamentId,
                    numberOfRounds,
                    roundDates,
                    roundCourses: roundCourses,
                    roundTimeConfig: roundTimeConfig,
                    totalPlayers: 0, // Deprecated in UI, setting to 0
                    showAccommodations,
                    showFood,
                    showPhotos,
                    tournamentName,
                    logoUrl,
                    prizesTitle,
                    prizes
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

    const handleSaveHistory = async () => {
        if (!tripName.trim()) {
            setHistoryMessage('Please enter a trip name');
            return;
        }

        if (!confirm(`Are you sure you want to archive this tournament as "${tripName}"?`)) return;

        setSavingHistory(true);
        setHistoryMessage('');

        try {
            const res = await fetch('/api/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: tripName })
            });

            if (res.ok) {
                setHistoryMessage('History saved successfully!');
                setTripName('');
                setTimeout(() => setHistoryMessage(''), 3000);
            } else {
                setHistoryMessage('Error saving history');
            }
        } catch (error) {
            console.error('Error saving history:', error);
            setHistoryMessage('Error saving history');
        } finally {
            setSavingHistory(false);
        }
    };


    const handleSaveBranding = async () => {
        setSavingBranding(true);
        setBrandingMessage('');

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId,
                    numberOfRounds,
                    roundDates,
                    roundCourses: roundCourses,
                    roundTimeConfig: roundTimeConfig,
                    totalPlayers: 0, // Deprecated in UI, setting to 0
                    showAccommodations,
                    showFood,
                    showPhotos,
                    tournamentName,
                    logoUrl,
                    prizesTitle,
                    prizes
                })
            });

            if (res.ok) {
                setBrandingMessage('Branding saved!');
                setTimeout(() => setBrandingMessage(''), 3000);
            } else {
                setBrandingMessage('Error saving branding');
            }
        } finally {
            setSavingBranding(false);
        }
    };

    const handleSaveLodging = async (e) => {
        e.preventDefault();
        setSavingLodging(true);
        try {
            const res = await fetch('/api/lodging', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...lodgingForm, tournamentId })
            });
            if (res.ok) {
                const newItem = await res.json();
                setLodgings([...lodgings, newItem]);
                setLodgingForm({ name: '', address: '', url: '', notes: '', image: '' });
            } else {
                alert('Failed to save lodging');
            }
        } catch (e) {
            console.error(e);
            alert('Error saving lodging');
        } finally {
            setSavingLodging(false);
        }
    };

    const handleDeleteLodging = async (id) => {
        if (!confirm('Are you sure?')) return;
        try {
            await fetch(`/api/lodging/${id}`, { method: 'DELETE' });
            setLodgings(lodgings.filter(l => l.id !== id));
        } catch (e) { console.error(e); }
    };

    const handleSaveRestaurant = async (e) => {
        e.preventDefault();
        setSavingRestaurant(true);
        try {
            if (editingRestaurantId) {
                const res = await fetch(`/api/restaurants/${editingRestaurantId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...restaurantForm, tournamentId })
                });
                if (res.ok) {
                    const updatedItem = await res.json();
                    setRestaurants(restaurants.map(r => r.id === editingRestaurantId ? updatedItem : r));
                    setRestaurantForm({ name: '', address: '', cuisine: '', url: '', notes: '' });
                    setEditingRestaurantId(null);
                } else {
                    alert('Failed to update restaurant');
                }
            } else {
                const res = await fetch('/api/restaurants', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...restaurantForm, tournamentId })
                });
                if (res.ok) {
                    const newItem = await res.json();
                    setRestaurants([...restaurants, newItem]);
                    setRestaurantForm({ name: '', address: '', cuisine: '', url: '', notes: '' });
                } else {
                    alert('Failed to save restaurant');
                }
            }
        } catch (e) {
            console.error(e);
            alert('Error saving restaurant');
        } finally {
            setSavingRestaurant(false);
        }
    };

    const handleEditRestaurant = (restaurant) => {
        setRestaurantForm({
            name: restaurant.name || '',
            address: restaurant.address || '',
            cuisine: restaurant.cuisine || '',
            url: restaurant.url || '',
            notes: restaurant.notes || ''
        });
        setEditingRestaurantId(restaurant.id);
    };

    const handleCancelEditRestaurant = () => {
        setRestaurantForm({ name: '', address: '', cuisine: '', url: '', notes: '' });
        setEditingRestaurantId(null);
    };

    const handleDeleteRestaurant = async (id) => {
        if (!confirm('Are you sure?')) return;
        try {
            await fetch(`/api/restaurants/${id}`, { method: 'DELETE' });
            setRestaurants(restaurants.filter(r => r.id !== id));
        } catch (e) { console.error(e); }
    };

    const processImage = (file, callback) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxSize = 600; // Larger for lodging images
                if (width > height) {
                    if (width > maxSize) {
                        height = Math.round((height * maxSize) / width);
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width = Math.round((width * maxSize) / height);
                        height = maxSize;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                callback(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleDeletePlayer = async (id, name) => {
        if (!confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) return;

        try {
            const res = await fetch(`/api/players/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setPlayers(players.filter(p => p.id !== id));
                alert('Player deleted successfully');
            } else {
                alert('Failed to delete player');
            }
        } catch (e) {
            console.error(e);
            alert('Error deleting player');
        }
    };

    const handleClearScores = async () => {
        if (confirm('Are you SUPER SURE? This will delete ALL scores for the entire tournament. This cannot be undone.')) {
            try {
                const res = await fetch('/api/scores', { method: 'DELETE' });
                if (res.ok) {
                    alert('All scores cleared!');
                } else {
                    alert('Failed to clear scores');
                }
            } catch (e) {
                console.error(e);
                alert('Failed to clear scores');
            }
        }
    };

    const handleSavePrizes = async () => {
        setSavingPrizes(true);
        setPrizesMessage('');

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId,
                    numberOfRounds,
                    roundDates,
                    roundCourses,
                    roundTimeConfig,
                    totalPlayers: 0,
                    showAccommodations,
                    showFood,
                    showPhotos,
                    tournamentName,
                    logoUrl,
                    prizesTitle,
                    prizes
                })
            });

            if (res.ok) {
                setPrizesMessage('Prizes saved!');
                setTimeout(() => setPrizesMessage(''), 3000);
            } else {
                setPrizesMessage('Error saving prizes');
            }
        } finally {
            setSavingPrizes(false);
        }
    };

    const handleAddPrize = (e) => {
        e.preventDefault();
        if (!prizeForm.title) return;
        setPrizes([...(prizes || []), { ...prizeForm, id: Math.random().toString() }]);
        setPrizeForm({ title: '', description: '', value: '' });
    };

    const handleDeletePrize = (id) => {
        setPrizes((prizes || []).filter(p => p.id !== id));
    };

    if (status === 'loading') {
        return (
            <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', padding: '4rem' }}>
                <div className="card">Loading session...</div>
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

    const tabs = [
        { id: 'general', label: 'General' },
        { id: 'players', label: 'Players' },
        { id: 'courses', label: 'Courses' },
        { id: 'accommodations', label: 'Accommodations' },
        { id: 'restaurants', label: 'Restaurants' },
        { id: 'prizes', label: 'Prizes' },
        { id: 'branding', label: 'Branding' },
        { id: 'history', label: 'History' },
    ];

    return (
        <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="section-title" style={{ margin: 0 }}>Tournament Settings</h1>
                <button
                    onClick={() => signOut()}
                    className="btn-outline"
                    style={{ fontSize: '0.9rem', padding: '6px 12px' }}
                >
                    Sign Out ({session?.user?.name || session?.user?.email || 'Dev Mode'})
                </button>
            </div>

            <div className="settings-container">
                {/* Vertical Toolbar Sidebar */}
                <div className="glass-panel settings-sidebar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                textAlign: 'left',
                                padding: '12px 16px',
                                background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                                color: activeTab === tab.id ? '#000' : 'var(--text-main)',
                                border: 'none',
                                borderRadius: 'var(--radius)',
                                cursor: 'pointer',
                                fontWeight: activeTab === tab.id ? '600' : '400',
                                transition: 'all 0.2s',
                                fontSize: '1rem'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, minWidth: '300px' }}>

                    {/* General / Tournament Config Tab */}
                    {activeTab === 'general' && (
                        <div className="card">
                            <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Tournament Configuration</h2>

                            {/* Round Details */}
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
                                            border: '1px solid rgba(212, 175, 55, 0.2)',
                                            position: 'relative'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <h4 style={{ margin: 0 }}>Round {index + 1}</h4>
                                            <button
                                                onClick={() => handleDeleteRound(index)}
                                                className="btn-outline"
                                                style={{
                                                    borderColor: '#ff6b6b',
                                                    color: '#ff6b6b',
                                                    padding: '4px 8px',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                Delete Round
                                            </button>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                                                    {/* Default option */}
                                                    <option value="" disabled>Select a course...</option>
                                                    {availableCourses.map(course => {
                                                        const localMatch = courses.find(c => c.name === course.name);
                                                        const valueId = localMatch ? localMatch.id : course.id;
                                                        return (
                                                            <option key={valueId} value={valueId}>
                                                                {course.name}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem' }}>
                                            <div style={{ flex: 1 }}>
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
                                            <div style={{ flex: 1 }}>
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
                                            <div style={{ flex: 1.5 }}>
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
                                                    <option value="AlternateShot">Alternate Shot (Foursomes)</option>
                                                    <option value="Shamble">Shamble</option>
                                                </select>
                                            </div>
                                        </div>
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

                            {/* Save Button for General Settings */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button
                                    onClick={handleSave}
                                    className="btn"
                                    disabled={saving}
                                    style={{ minWidth: '150px' }}
                                >
                                    {saving ? 'Saving...' : 'Save Configuration'}
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
                    )}

                    {/* Accommodations Tab */}
                    {activeTab === 'accommodations' && (
                        <div className="card">
                            <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Accommodations</h2>

                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Existing Locations</h3>
                                {lodgings.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No accommodations added yet.</p> : (
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        {lodgings.map(l => (
                                            <div key={l.id} style={{ display: 'flex', gap: '1rem', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                                {l.image && <img src={l.image} alt={l.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />}
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ margin: 0, color: 'var(--accent)' }}>{l.name}</h4>
                                                    <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{l.address}</p>
                                                    {l.url && <a href={l.url} target="_blank" style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>Website</a>}
                                                </div>
                                                <button onClick={() => handleDeleteLodging(l.id)} className="btn-outline" style={{ height: 'fit-content', borderColor: '#ff6b6b', color: '#ff6b6b' }}>Delete</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Add New Location</h3>
                                <form onSubmit={handleSaveLodging}>
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        <input
                                            placeholder="Name (e.g. Hilton Resort)"
                                            value={lodgingForm.name}
                                            onChange={e => setLodgingForm({ ...lodgingForm, name: e.target.value })}
                                            style={{ padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                            required
                                        />
                                        <input
                                            placeholder="Address"
                                            value={lodgingForm.address}
                                            onChange={e => setLodgingForm({ ...lodgingForm, address: e.target.value })}
                                            style={{ padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                        />
                                        <input
                                            placeholder="Website URL"
                                            value={lodgingForm.url}
                                            onChange={e => setLodgingForm({ ...lodgingForm, url: e.target.value })}
                                            style={{ padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                        />
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Image</label>
                                            <input type="file" accept="image/*" onChange={e => processImage(e.target.files[0], (data) => setLodgingForm({ ...lodgingForm, image: data }))} />
                                            {lodgingForm.image && <img src={lodgingForm.image} alt="Preview" style={{ height: '60px', marginTop: '0.5rem', borderRadius: '4px' }} />}
                                        </div>
                                        <button type="submit" className="btn" disabled={savingLodging}>{savingLodging ? 'Adding...' : 'Add Location'}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Restaurants Tab */}
                    {activeTab === 'restaurants' && (
                        <div className="card">
                            <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Restaurants</h2>

                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Existing Restaurants</h3>
                                {restaurants.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No restaurants added yet.</p> : (
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        {restaurants.map(r => (
                                            <div key={r.id} style={{ display: 'flex', gap: '1rem', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ margin: 0, color: 'var(--accent)' }}>{r.name}</h4>
                                                    <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{r.cuisine} • {r.address}</p>
                                                    {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>Website</a>}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    <button onClick={() => handleEditRestaurant(r)} className="btn-outline" style={{ height: 'fit-content', fontSize: '0.8rem' }}>Edit</button>
                                                    <button onClick={() => handleDeleteRestaurant(r.id)} className="btn-outline" style={{ height: 'fit-content', borderColor: '#ff6b6b', color: '#ff6b6b', fontSize: '0.8rem' }}>Delete</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{editingRestaurantId ? 'Edit Restaurant' : 'Add New Restaurant'}</h3>
                                <form onSubmit={handleSaveRestaurant}>
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        <input
                                            placeholder="Name"
                                            value={restaurantForm.name}
                                            onChange={e => setRestaurantForm({ ...restaurantForm, name: e.target.value })}
                                            style={{ padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                            required
                                        />
                                        <input
                                            placeholder="Cuisine Type"
                                            value={restaurantForm.cuisine}
                                            onChange={e => setRestaurantForm({ ...restaurantForm, cuisine: e.target.value })}
                                            style={{ padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                        />
                                        <input
                                            placeholder="Address"
                                            value={restaurantForm.address}
                                            onChange={e => setRestaurantForm({ ...restaurantForm, address: e.target.value })}
                                            style={{ padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                        />
                                        <input
                                            placeholder="Weblink / Menu URL"
                                            value={restaurantForm.url}
                                            onChange={e => setRestaurantForm({ ...restaurantForm, url: e.target.value })}
                                            style={{ padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                        />
                                        <textarea
                                            placeholder="Notes / Description"
                                            value={restaurantForm.notes}
                                            onChange={e => setRestaurantForm({ ...restaurantForm, notes: e.target.value })}
                                            style={{ padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', minHeight: '80px', fontFamily: 'inherit' }}
                                        />
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <button type="submit" className="btn" disabled={savingRestaurant}>
                                                {savingRestaurant ? 'Saving...' : (editingRestaurantId ? 'Update Restaurant' : 'Add Restaurant')}
                                            </button>
                                            {editingRestaurantId && (
                                                <button type="button" onClick={handleCancelEditRestaurant} className="btn-outline" style={{ borderColor: 'var(--text-muted)', color: 'var(--text-muted)' }}>
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Players Tab */}
                    {activeTab === 'players' && (
                        <div className="card">
                            <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Player Information</h2>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                                <Link href="/players/import" className="btn" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                    Import Players
                                </Link>
                                <Link href={`/t/${tournamentId}/admin/schedule`} className="btn" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                    Manage Schedule
                                </Link>
                                <button
                                    onClick={handleClearScores}
                                    className="btn-outline"
                                    style={{ borderColor: '#ff6b6b', color: '#ff6b6b' }}
                                >
                                    Clear Scores
                                </button>
                            </div>

                            <div style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)' }}>
                                <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Add New Player</h3>
                                <form onSubmit={handleAddPlayer}>
                                    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Name</label>
                                            <input
                                                value={newPlayerName}
                                                onChange={e => setNewPlayerName(e.target.value)}
                                                placeholder="Player Name"
                                                required
                                                style={{ width: '100%', padding: '8px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Email (Optional)</label>
                                            <input
                                                type="email"
                                                value={newPlayerEmail}
                                                onChange={e => setNewPlayerEmail(e.target.value)}
                                                placeholder="player@example.com"
                                                style={{ width: '100%', padding: '8px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Handicap Index</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={newPlayerHandicap}
                                                onChange={e => setNewPlayerHandicap(e.target.value)}
                                                placeholder="e.g. 15.4"
                                                style={{ width: '100%', padding: '8px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                            />
                                        </div>
                                    </div>



                                    <button
                                        type="submit"
                                        className="btn"
                                        disabled={addingPlayer}
                                        style={{ marginTop: '1rem' }}
                                    >
                                        {addingPlayer ? 'Adding...' : 'Add Player'}
                                    </button>
                                </form>
                            </div>

                            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                                <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Manage Players</h3>
                                {loadingPlayers ? (
                                    <div>Loading players...</div>
                                ) : players.length === 0 ? (
                                    <div style={{ color: 'var(--text-muted)' }}>No players found.</div>
                                ) : (
                                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                                        {players.map(player => (
                                            <div key={player.id} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '10px',
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: 'var(--radius)'
                                            }}>
                                                <span>{player.name}</span>
                                                <button
                                                    onClick={() => handleDeletePlayer(player.id, player.name)}
                                                    className="btn-outline"
                                                    style={{
                                                        borderColor: '#ff6b6b',
                                                        color: '#ff6b6b',
                                                        padding: '4px 10px',
                                                        fontSize: '0.8rem'
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Branding Tab */}
                    {activeTab === 'branding' && (
                        <div className="card">
                            <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Branding</h2>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Tournament Name</label>
                                <input
                                    type="text"
                                    value={tournamentName}
                                    onChange={(e) => setTournamentName(e.target.value)}
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
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Logo</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {logoPreview && (
                                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent)' }}>
                                            <img src={logoPreview} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;

                                            // Compress image
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                                const img = new Image();
                                                img.onload = () => {
                                                    const canvas = document.createElement('canvas');
                                                    let width = img.width;
                                                    let height = img.height;
                                                    const maxSize = 200;

                                                    // Resize
                                                    if (width > height) {
                                                        if (width > maxSize) {
                                                            height = Math.round((height * maxSize) / width);
                                                            width = maxSize;
                                                        }
                                                    } else {
                                                        if (height > maxSize) {
                                                            width = Math.round((width * maxSize) / height);
                                                            height = maxSize;
                                                        }
                                                    }

                                                    canvas.width = width;
                                                    canvas.height = height;
                                                    const ctx = canvas.getContext('2d');
                                                    ctx.drawImage(img, 0, 0, width, height);

                                                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                                                    setLogoUrl(dataUrl);
                                                    setLogoPreview(dataUrl);
                                                };
                                                img.src = event.target.result;
                                            };
                                            reader.readAsDataURL(file);
                                        }}
                                        style={{ color: 'var(--text-muted)' }}
                                    />
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                    Logo will be resized and compressed automatically.
                                </p>
                            </div>

                            <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button
                                    onClick={handleSaveBranding}
                                    className="btn"
                                    disabled={savingBranding}
                                    style={{ minWidth: '150px' }}
                                >
                                    {savingBranding ? 'Saving...' : 'Save Branding'}
                                </button>
                                {brandingMessage && (
                                    <span style={{
                                        color: brandingMessage.includes('Error') ? '#ff6b6b' : 'var(--accent)',
                                        fontWeight: 'bold'
                                    }}>
                                        {brandingMessage}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* History Tab */}
                    {activeTab === 'history' && (
                        <div className="card">
                            <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Historical Archives</h2>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                    Trip Name / Identifier
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Williamsburg 2025"
                                    value={tripName}
                                    onChange={(e) => setTripName(e.target.value)}
                                    style={{
                                        width: '100%',
                                        maxWidth: '400px',
                                        padding: '10px',
                                        borderRadius: 'var(--radius)',
                                        border: '1px solid var(--glass-border)',
                                        background: 'var(--bg-dark)',
                                        color: 'var(--text-main)',
                                        fontSize: '1rem'
                                    }}
                                />
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                    Save a snapshot of the current tournament (Scores, Players, Courses) to the archives.
                                </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button
                                    onClick={handleSaveHistory}
                                    className="btn"
                                    disabled={savingHistory || !tripName.trim()}
                                    style={{ minWidth: '150px' }}
                                >
                                    {savingHistory ? 'Archiving...' : 'Save to History'}
                                </button>
                                {historyMessage && (
                                    <span style={{
                                        color: historyMessage.includes('Error') || historyMessage.includes('Please') ? '#ff6b6b' : 'var(--accent)',
                                        fontWeight: 'bold'
                                    }}>
                                        {historyMessage}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Prizes Tab */}
                    {activeTab === 'prizes' && (
                        <div className="card">
                            <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Tournament Prizes</h2>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Settings Section Title</label>
                                <input
                                    type="text"
                                    value={prizesTitle}
                                    onChange={(e) => setPrizesTitle(e.target.value)}
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

                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Prizes List</h3>
                                {(!prizes || prizes.length === 0) ? <p style={{ color: 'var(--text-muted)' }}>No prizes added yet.</p> : (
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        {prizes.map((prize, idx) => (
                                            <div key={prize.id || idx} style={{ display: 'flex', gap: '1rem', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', alignItems: 'center' }}>
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ margin: 0, color: 'var(--accent)' }}>{prize.title}</h4>
                                                    <p style={{ margin: '0.2rem 0', fontSize: '0.9rem' }}>{prize.description}</p>
                                                    {prize.value && <p style={{ margin: 0, fontSize: '0.85rem', color: '#4ade80' }}>Value: {prize.value}</p>}
                                                </div>
                                                <button onClick={() => handleDeletePrize(prize.id)} className="btn-outline" style={{ height: 'fit-content', borderColor: '#ff6b6b', color: '#ff6b6b', padding: '4px 8px', fontSize: '0.8rem' }}>Delete</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '2rem', marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Add New Prize</h3>
                                <form onSubmit={handleAddPrize}>
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        <input
                                            placeholder="Prize Title (e.g. 1st Place)"
                                            value={prizeForm.title}
                                            onChange={e => setPrizeForm({ ...prizeForm, title: e.target.value })}
                                            style={{ padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                            required
                                        />
                                        <textarea
                                            placeholder="Description (e.g. $100 Gift Card)"
                                            value={prizeForm.description}
                                            onChange={e => setPrizeForm({ ...prizeForm, description: e.target.value })}
                                            style={{ padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', minHeight: '80px' }}
                                            required
                                        />
                                        <input
                                            placeholder="Value (Optional, e.g. $100)"
                                            value={prizeForm.value}
                                            onChange={e => setPrizeForm({ ...prizeForm, value: e.target.value })}
                                            style={{ padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                        />
                                        <button type="submit" className="btn-outline" style={{ width: 'fit-content' }}>Add to List</button>
                                    </div>
                                </form>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button
                                    onClick={handleSavePrizes}
                                    className="btn"
                                    disabled={savingPrizes}
                                    style={{ minWidth: '150px' }}
                                >
                                    {savingPrizes ? 'Saving...' : 'Save Prizes'}
                                </button>
                                {prizesMessage && (
                                    <span style={{
                                        color: prizesMessage.includes('Error') ? '#ff6b6b' : 'var(--accent)',
                                        fontWeight: 'bold'
                                    }}>
                                        {prizesMessage}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Courses Tab */}
                    {activeTab === 'courses' && (
                        <div className="card">
                            <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Course Management</h2>

                            <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)' }}>
                                <h3 style={{ marginBottom: '1rem', color: 'var(--accent)', fontSize: '1.1rem' }}>Add New Course</h3>
                                <form onSubmit={handleAddCourse} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
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
                                    <div style={{ width: '80px' }}>
                                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Par</label>
                                        <input
                                            type="number"
                                            value={newCoursePar}
                                            onChange={e => setNewCoursePar(e.target.value)}
                                            style={{ width: '100%', padding: '8px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <button type="submit" className="btn" disabled={addingCourse}>
                                        {addingCourse ? 'Adding...' : 'Add'}
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
                                <>
                                    <div className="fade-in" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-card)', borderRadius: 'var(--radius)' }}>
                                        <h3 style={{ marginBottom: '1rem', color: 'var(--accent)', borderBottom: '1px solid var(--accent)', paddingBottom: '0.5rem' }}>
                                            Editing: {selectedCourse.name}
                                        </h3>

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
                                            </div>
                                        )}
                                    </div>

                                    <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Hole Data (Par & Handicap)</h3>
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
                                                        value={hole.handicapIndex || ''}
                                                        onChange={(e) => handleHoleUpdate(index, 'handicapIndex', parseInt(e.target.value))}
                                                        style={{
                                                            width: '100%',
                                                            padding: '4px',
                                                            textAlign: 'center',
                                                            borderRadius: '4px',
                                                            border: '1px solid var(--glass-border)',
                                                            background: 'var(--bg-dark)',
                                                            color: 'var(--text-main)',
                                                            fontSize: '0.8rem'
                                                        }}
                                                        title="Handicap"
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
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div >
        </div >
    );
}
