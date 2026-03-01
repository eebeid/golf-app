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
    const [showPrizes, setShowPrizes] = useState(true);
    const [roundTimeConfig, setRoundTimeConfig] = useState({});
    const [showPhotos, setShowPhotos] = useState(false);
    const [spotifyUrl, setSpotifyUrl] = useState('');
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
    const [courseSearch, setCourseSearch] = useState('');
    const [coursePlaceResults, setCoursePlaceResults] = useState([]);
    const [searchingCoursePlaces, setSearchingCoursePlaces] = useState(false);
    const [newCourseAddress, setNewCourseAddress] = useState('');
    const [tripName, setTripName] = useState('');
    const [savingHistory, setSavingHistory] = useState(false);
    const [historyMessage, setHistoryMessage] = useState('');

    const [players, setPlayers] = useState([]);
    const [loadingPlayers, setLoadingPlayers] = useState(true);

    const [newPlayerName, setNewPlayerName] = useState('');
    const [newPlayerEmail, setNewPlayerEmail] = useState('');
    const [newPlayerPhone, setNewPlayerPhone] = useState('');
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
                    phone: newPlayerPhone,
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
                setNewPlayerPhone('');
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
    const [restaurantForm, setRestaurantForm] = useState({ name: '', address: '', cuisine: '', url: '', phone: '', lat: '', lng: '', notes: '', payerId: '', paymentLink: '', splitCost: '', date: '' });
    const [savingRestaurant, setSavingRestaurant] = useState(false);
    const [editingRestaurantId, setEditingRestaurantId] = useState(null);
    const [restaurantSearch, setRestaurantSearch] = useState('');
    const [placeResults, setPlaceResults] = useState([]);
    const [searchingPlaces, setSearchingPlaces] = useState(false);

    // Prizes
    const [prizesTitle, setPrizesTitle] = useState('Tournament Prizes');
    const [prizes, setPrizes] = useState([]);
    const [prizeForm, setPrizeForm] = useState({ title: '', description: '', value: '' });
    const [savingPrizes, setSavingPrizes] = useState(false);
    const [prizesMessage, setPrizesMessage] = useState('');

    // Payment Info
    const [venmo, setVenmo] = useState('');
    const [paypal, setPaypal] = useState('');
    const [zelle, setZelle] = useState('');
    const [savingPayment, setSavingPayment] = useState(false);
    const [paymentMessage, setPaymentMessage] = useState('');

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

    const handleDeleteCourse = async (courseId) => {
        if (!confirm('Are you sure you want to delete this course from the tournament?')) return;
        setSavingCourses(true);
        try {
            const res = await fetch(`/api/courses/${courseId}`, { method: 'DELETE' });
            if (res.ok) {
                const newCourses = courses.filter(c => c.id !== courseId);
                setCourses(newCourses);
                if (newCourses.length > 0) {
                    setSelectedCourseId(newCourses[0].id);
                } else {
                    setSelectedCourseId(null);
                }
                alert('Course deleted successfully.');
            } else {
                alert('Failed to delete course.');
            }
        } catch (error) {
            console.error(error);
            alert('Error deleting course.');
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
    const handleSearchCoursePlaces = async (e) => {
        if (e) e.preventDefault();
        if (!courseSearch.trim()) return;
        setSearchingCoursePlaces(true);
        try {
            const res = await fetch(`/api/places?query=${encodeURIComponent(courseSearch)}&type=golf_course`);
            const data = await res.json();
            if (res.ok) {
                setCoursePlaceResults(data || []);
            } else {
                alert('Failed to search places: ' + (data.error || 'Unknown error'));
            }
        } catch (e) {
            console.error(e);
            alert('Error searching places');
        } finally {
            setSearchingCoursePlaces(false);
        }
    };

    const handleSelectCoursePlace = async (placeId) => {
        setSearchingCoursePlaces(true);
        try {
            const res = await fetch(`/api/places?placeId=${placeId}`);
            const data = await res.json();
            if (res.ok) {
                setNewCourseName(data.name || '');
                setNewCourseAddress(data.formatted_address || '');
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
        setAddingCourse(true);
        try {
            const res = await fetch('/api/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId,
                    courses: [{ name: newCourseName, par: parseInt(newCoursePar), address: newCourseAddress }]
                })
            });
            if (res.ok) {
                const addedData = await res.json();
                setNewCourseName('');
                setNewCourseAddress('');
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
                setVenmo(data.venmo || '');
                setPaypal(data.paypal || '');
                setZelle(data.zelle || '');
                setSpotifyUrl(data.spotifyUrl || '');

                if (data.roundTimeConfig && typeof data.roundTimeConfig === 'object') {
                    if (data.roundTimeConfig.showPrizes !== undefined) {
                        setShowPrizes(data.roundTimeConfig.showPrizes);
                    }
                }
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
        // value is the course ID from the dropdown
        let finalCourseId = value;

        // 1. Check if this is an existing local course
        const existingLocalById = courses.find(c => c.id === value);
        if (existingLocalById) {
            updateRoundCourse(index, value);
            return;
        }

        // 2. Check if it's a global course that needs importing
        const selectedGlobal = availableCourses.find(c => c.id === value);
        if (selectedGlobal) {
            // Check if we already have this course imported (by name)
            const existingLocalByName = courses.find(c => c.name === selectedGlobal.name);

            if (existingLocalByName) {
                finalCourseId = existingLocalByName.id;
                updateRoundCourse(index, finalCourseId);
            } else {
                // Must import (clone) the course
                try {
                    console.log('Importing course:', selectedGlobal.name, 'for tournament:', tournamentId);
                    const res = await fetch('/api/courses', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            tournamentId: tournamentId, // Ensure this is the slug
                            courses: [{
                                name: selectedGlobal.name,
                                par: selectedGlobal.par || 72,
                                address: selectedGlobal.address,
                                tees: selectedGlobal.tees || [],
                                holes: selectedGlobal.holes || []
                            }]
                        })
                    });

                    if (res.ok) {
                        const newCourses = await res.json();
                        // API returns array of created/updated courses
                        if (Array.isArray(newCourses) && newCourses.length > 0) {
                            finalCourseId = newCourses[0].id;
                            // Refresh local courses to include the new one
                            await fetchCourses();
                            // Update the selection
                            updateRoundCourse(index, finalCourseId);
                            // Also select it for editing to be helpful
                            setSelectedCourseId(finalCourseId);
                        }
                    } else {
                        const err = await res.json();
                        console.error('Import failed:', err);
                        alert(`Failed to import course: ${err.error || 'Unknown error'}`);
                    }
                } catch (e) {
                    console.error('Error importing course:', e);
                    alert('Error importing course');
                }
            }
        } else {
            // Fallback (shouldn't happen if dropdown is consistent)
            updateRoundCourse(index, value);
        }
    };

    const updateRoundCourse = (index, courseId) => {
        const newCourses = [...roundCourses];
        newCourses[index] = courseId;
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
                    prizes,
                    spotifyUrl,
                    roundTimeConfig: { ...roundTimeConfig, showPrizes }
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
                    setRestaurantForm({ name: '', address: '', cuisine: '', url: '', phone: '', lat: '', lng: '', notes: '', payerId: '', paymentLink: '', splitCost: '', date: '' });
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
                    setRestaurantForm({ name: '', address: '', cuisine: '', url: '', phone: '', lat: '', lng: '', notes: '', payerId: '', paymentLink: '', splitCost: '', date: '' });
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
            phone: restaurant.phone || '',
            lat: restaurant.lat || '',
            lng: restaurant.lng || '',
            notes: restaurant.notes || '',
            paymentLink: restaurant.paymentLink || '',
            splitCost: restaurant.splitCost || '',
            date: restaurant.date || ''
        });
        setEditingRestaurantId(restaurant.id);
    };

    const handleCancelEditRestaurant = () => {
        setRestaurantForm({ name: '', address: '', cuisine: '', url: '', phone: '', lat: '', lng: '', notes: '', payerId: '', paymentLink: '', splitCost: '', date: '' });
        setEditingRestaurantId(null);
    };

    const handleSearchPlaces = async (e) => {
        e.preventDefault();
        if (!restaurantSearch.trim()) return;
        setSearchingPlaces(true);
        try {
            const res = await fetch(`/api/places?query=${encodeURIComponent(restaurantSearch)}&type=restaurant`);
            const data = await res.json();
            if (res.ok) {
                setPlaceResults(data || []);
            } else {
                alert('Failed to search places: ' + (data.error || 'Unknown error'));
            }
        } catch (e) {
            console.error(e);
            alert('Error searching places');
        } finally {
            setSearchingPlaces(false);
        }
    };

    const handleSelectPlace = async (placeId) => {
        setSearchingPlaces(true);
        try {
            const res = await fetch(`/api/places?placeId=${placeId}`);
            const data = await res.json();
            if (res.ok) {
                setRestaurantForm(prev => ({
                    ...prev,
                    name: data.name || '',
                    address: data.formatted_address || '',
                    url: data.website || '',
                    phone: data.formatted_phone_number || '',
                    lat: data.geometry?.location?.lat || '',
                    lng: data.geometry?.location?.lng || '',
                    notes: data.editorial_summary?.overview || ''
                }));
                setPlaceResults([]);
                setRestaurantSearch('');
            } else {
                alert('Failed to get place details: ' + (data.error || 'Unknown error'));
            }
        } catch (e) {
            console.error(e);
            alert('Error fetching place details');
        } finally {
            setSearchingPlaces(false);
        }
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

    const handleSavePayment = async () => {
        setSavingPayment(true);
        setPaymentMessage('');

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
                    prizes,
                    venmo,
                    paypal,
                    zelle,
                    spotifyUrl,
                    roundTimeConfig: { ...roundTimeConfig, showPrizes }
                })
            });

            if (res.ok) {
                setPaymentMessage('Payment info saved!');
                setTimeout(() => setPaymentMessage(''), 3000);
            } else {
                setPaymentMessage('Error saving payment info');
            }
        } finally {
            setSavingPayment(false);
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
        { id: 'payment', label: 'Payment Info' },
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
                            {/* General Links Configuration */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>General Links & Information</h3>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                                        Spotify Jam Link (Optional)
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="e.g. https://spotify.link/l9kRVhd380b"
                                        value={spotifyUrl}
                                        onChange={(e) => setSpotifyUrl(e.target.value)}
                                        style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                    />
                                    <p style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Provides a quick QR code link on the main page for people to join a shared music playlist.
                                    </p>
                                </div>
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
                                                    {courses.map(course => (
                                                        <option key={course.id} value={course.id}>
                                                            {course.name}
                                                        </option>
                                                    ))}
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
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={showPrizes}
                                            onChange={(e) => setShowPrizes(e.target.checked)}
                                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                        />
                                        <span>Show Prizes Page</span>
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

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                                        {r.date && (
                                                            <div style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
                                                                📅 {r.date.includes('T') ? `${r.date.split('T')[0]} at ${r.date.split('T')[1]}` : r.date}
                                                            </div>
                                                        )}
                                                        {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-main)' }}>Website</a>}

                                                        {r.splitCost && (
                                                            <div style={{ color: '#4ade80' }}>Bill: {r.splitCost}</div>
                                                        )}

                                                        {r.payerId && (
                                                            <div style={{ color: 'var(--text-muted)' }}>
                                                                Paid by: <span style={{ color: 'var(--text-main)' }}>{players.find(p => p.id === r.payerId)?.name || 'Unknown'}</span>
                                                            </div>
                                                        )}

                                                        {r.paymentLink && (
                                                            <a href={r.paymentLink.startsWith('http') ? r.paymentLink : `https://${r.paymentLink}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                                                                Link to Pay
                                                            </a>
                                                        )}
                                                    </div>
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

                                {!editingRestaurantId && (
                                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(212, 175, 55, 0.05)', borderRadius: 'var(--radius)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                                        <h4 style={{ color: 'var(--accent)', marginBottom: '0.5rem', margin: 0 }}>🔍 Search via Google Places</h4>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Auto-fill the form by searching for a restaurant.</p>
                                        <form onSubmit={handleSearchPlaces} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                            <input
                                                value={restaurantSearch}
                                                onChange={e => setRestaurantSearch(e.target.value)}
                                                placeholder="Restaurant name..."
                                                style={{ flex: 1, padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                            />
                                            <button type="submit" className="btn" disabled={searchingPlaces}>
                                                {searchingPlaces ? 'Searching...' : 'Search'}
                                            </button>
                                        </form>

                                        {placeResults.length > 0 && (
                                            <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                                                {placeResults.map(p => (
                                                    <div
                                                        key={p.place_id}
                                                        onClick={() => handleSelectPlace(p.place_id)}
                                                        style={{ padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s', ':hover': { borderColor: 'var(--accent)' } }}
                                                    >
                                                        <div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{p.name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.formatted_address}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

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
                                            type="datetime-local"
                                            placeholder="Reservation Date & Time"
                                            value={restaurantForm.date}
                                            onChange={e => setRestaurantForm({ ...restaurantForm, date: e.target.value })}
                                            style={{ padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
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
                                        <input
                                            placeholder="Phone Number"
                                            value={restaurantForm.phone}
                                            onChange={e => setRestaurantForm({ ...restaurantForm, phone: e.target.value })}
                                            style={{ padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                        />
                                        <textarea
                                            placeholder="Notes / Description"
                                            value={restaurantForm.notes}
                                            onChange={e => setRestaurantForm({ ...restaurantForm, notes: e.target.value })}
                                            style={{ padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', minHeight: '80px', fontFamily: 'inherit' }}
                                        />

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem', color: 'var(--text-muted)' }}>Payer (Optional)</label>
                                                <select
                                                    value={restaurantForm.payerId}
                                                    onChange={e => setRestaurantForm({ ...restaurantForm, payerId: e.target.value })}
                                                    style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                                >
                                                    <option value="">Select a Player</option>
                                                    {players.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem', color: 'var(--text-muted)' }}>Payment Link (Optional)</label>
                                                <input
                                                    placeholder="e.g. venmo.com/u/user"
                                                    value={restaurantForm.paymentLink}
                                                    onChange={e => setRestaurantForm({ ...restaurantForm, paymentLink: e.target.value })}
                                                    style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                                />
                                            </div>
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem', color: 'var(--text-muted)' }}>Total Bill Split Cost (Optional)</label>
                                                <input
                                                    placeholder="e.g. $45 per person"
                                                    value={restaurantForm.splitCost}
                                                    onChange={e => setRestaurantForm({ ...restaurantForm, splitCost: e.target.value })}
                                                    style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                                />
                                            </div>
                                        </div>
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
                                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Phone (Optional)</label>
                                            <input
                                                type="tel"
                                                value={newPlayerPhone}
                                                onChange={e => setNewPlayerPhone(e.target.value)}
                                                placeholder="e.g. 123-456-7890"
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

                    {/* Payment Info Tab */}
                    {activeTab === 'payment' && (
                        <div className="card">
                            <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Payment Info</h2>
                            <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Venmo Username</label>
                                    <input
                                        value={venmo}
                                        onChange={(e) => setVenmo(e.target.value)}
                                        placeholder="@username"
                                        style={{ width: '100%', padding: '12px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius)' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>PayPal Email/Link</label>
                                    <input
                                        value={paypal}
                                        onChange={(e) => setPaypal(e.target.value)}
                                        placeholder="email@example.com or paypal.me/link"
                                        style={{ width: '100%', padding: '12px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius)' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Zelle Info (Phone/Email)</label>
                                    <input
                                        value={zelle}
                                        onChange={(e) => setZelle(e.target.value)}
                                        placeholder="555-555-5555"
                                        style={{ width: '100%', padding: '12px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius)' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button
                                    onClick={handleSavePayment}
                                    className="btn"
                                    disabled={savingPayment}
                                    style={{ minWidth: '150px' }}
                                >
                                    {savingPayment ? 'Saving...' : 'Save Payment Info'}
                                </button>
                                {paymentMessage && (
                                    <span style={{
                                        color: paymentMessage.includes('Error') ? '#ff6b6b' : 'var(--accent)',
                                        fontWeight: 'bold'
                                    }}>
                                        {paymentMessage}
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

                                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(212, 175, 55, 0.05)', borderRadius: 'var(--radius)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                                    <h4 style={{ color: 'var(--accent)', marginBottom: '0.5rem', margin: 0 }}>🔍 Search via Google Places</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Auto-fill the form by searching for a golf course.</p>
                                    <form onSubmit={handleSearchCoursePlaces} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <input
                                            value={courseSearch}
                                            onChange={e => setCourseSearch(e.target.value)}
                                            placeholder="Golf course name..."
                                            style={{ flex: 1, padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                        />
                                        <button type="submit" className="btn" disabled={searchingCoursePlaces}>
                                            {searchingCoursePlaces ? 'Searching...' : 'Search'}
                                        </button>
                                    </form>

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
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--accent)', paddingBottom: '0.5rem' }}>
                                            <h3 style={{ margin: 0, color: 'var(--accent)' }}>
                                                Editing: {selectedCourse.name}
                                            </h3>
                                            <button
                                                onClick={(e) => { e.preventDefault(); handleDeleteCourse(selectedCourse.id); }}
                                                className="btn-outline"
                                                style={{ borderColor: '#ff6b6b', color: '#ff6b6b', padding: '4px 8px', fontSize: '0.9rem' }}
                                            >
                                                Delete Course
                                            </button>
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
