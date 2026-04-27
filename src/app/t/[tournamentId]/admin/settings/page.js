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
    const [roundHandicaps, setRoundHandicaps] = useState([]);
    const [maxHandicap, setMaxHandicap] = useState('');
    const [ryderCupConfig, setRyderCupConfig] = useState({ enabled: false, team1: [], team2: [] });
    const [showAccommodations, setShowAccommodations] = useState(true);
    const [showFood, setShowFood] = useState(true);
    const [showPhotos, setShowPhotos] = useState(false);
    const [showCourses, setShowCourses] = useState(true);
    const [showPlayers, setShowPlayers] = useState(true);
    const [showSchedule, setShowSchedule] = useState(true);
    const [showLeaderboard, setShowLeaderboard] = useState(true);
    const [showPrizes, setShowPrizes] = useState(true);
    const [showChat, setShowChat] = useState(true);
    const [showPlay, setShowPlay] = useState(true);
    const [showStats, setShowStats] = useState(true);
    const [showScorecards, setShowScorecards] = useState(true);
    const [roundTimeConfig, setRoundTimeConfig] = useState({});
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

    const [tripName, setTripName] = useState('');
    const [savingHistory, setSavingHistory] = useState(false);
    const [restoringHistory, setRestoringHistory] = useState(false);
    const [historyMessage, setHistoryMessage] = useState('');
    const [historyArchives, setHistoryArchives] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const [players, setPlayers] = useState([]);
    const [loadingPlayers, setLoadingPlayers] = useState(true);
    const [allowPlayerEdits, setAllowPlayerEdits] = useState(false);
    const [timezone, setTimezone] = useState('America/New_York');

    const [newPlayerName, setNewPlayerName] = useState('');
    const [newPlayerEmail, setNewPlayerEmail] = useState('');
    const [newPlayerPhone, setNewPlayerPhone] = useState('');
    const [newPlayerHandicap, setNewPlayerHandicap] = useState('');
    const [newPlayerRoomNumber, setNewPlayerRoomNumber] = useState('');
    const [newPlayerHouseNumber, setNewPlayerHouseNumber] = useState('');
    const [addingPlayer, setAddingPlayer] = useState(false);
    const [backgroundColor, setBackgroundColor] = useState('#0a1a0f');
    const [isAdmin, setIsAdmin] = useState(false);

    // Edit Player State
    const [editingPlayerId, setEditingPlayerId] = useState(null);
    const [editPlayerForm, setEditPlayerForm] = useState({
        name: '',
        email: '',
        phone: '',
        handicapIndex: '',
        isManager: false,
        roomNumber: '',
        houseNumber: ''
    });

    // Import Players State
    const [showImport, setShowImport] = useState(false);
    const [importText, setImportText] = useState('');
    const [importPreview, setImportPreview] = useState([]);
    const [importingPlayers, setImportingPlayers] = useState(false);
    const [importMessage, setImportMessage] = useState('');

    const parseImportText = (text) => {
        const rows = text.trim().split('\n').filter(l => l.trim());
        return rows.map(row => {
            // Support comma or tab separated
            const parts = row.includes('\t') ? row.split('\t') : row.split(',');
            const clean = parts.map(p => p.trim().replace(/^"|"$/g, ''));
            return {
                name: clean[0] || '',
                email: clean[1] || '',
                phone: clean[2] || '',
                handicapIndex: clean[3] || '0'
            };
        }).filter(r => r.name);
    };

    const handleImportTextChange = (text) => {
        setImportText(text);
        setImportPreview(parseImportText(text));
        setImportMessage('');
    };

    const handleImportFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => handleImportTextChange(ev.target.result);
        reader.readAsText(file);
    };

    const handleImportPlayers = async () => {
        if (importPreview.length === 0) return;
        setImportingPlayers(true);
        setImportMessage('');
        let added = 0, failed = 0;
        for (const player of importPreview) {
            try {
                const res = await fetch('/api/players', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: player.name,
                        email: player.email || null,
                        phone: player.phone || null,
                        handicapIndex: parseFloat(player.handicapIndex) || 0,
                        tournamentId
                    })
                });
                if (res.ok) added++; else failed++;
            } catch { failed++; }
        }
        await fetchPlayers();
        setImportMessage(`✅ Imported ${added} player(s)${failed > 0 ? `, ${failed} failed` : ''}.`);
        setImportText('');
        setImportPreview([]);
        setImportingPlayers(false);
    };

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
                    roomNumber: newPlayerRoomNumber,
                    houseNumber: newPlayerHouseNumber,
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
                setNewPlayerRoomNumber('');
                setNewPlayerHouseNumber('');
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

    // --- Player Management Handlers ---

    const handleEditPlayerClick = (player) => {
        setEditingPlayerId(player.id);
        const rawCourseData = player.courseData || {};

        // Default each course to the longest tee if none is set
        const defaultedCourseData = { ...rawCourseData };
        courses.forEach(course => {
            if (!defaultedCourseData[course.id]?.tee && Array.isArray(course.tees) && course.tees.length > 0) {
                const longestTee = [...course.tees].sort((a, b) => (b.yardage || 0) - (a.yardage || 0))[0];
                defaultedCourseData[course.id] = {
                    ...defaultedCourseData[course.id],
                    tee: longestTee.name
                };
            }
        });

        setEditPlayerForm({
            name: player.name || '',
            email: player.email || '',
            phone: player.phone || '',
            handicapIndex: player.handicapIndex !== null && player.handicapIndex !== undefined ? String(player.handicapIndex) : '',
            courseData: defaultedCourseData,
            isManager: !!player.isManager,
            roomNumber: player.roomNumber || '',
            houseNumber: player.houseNumber || ''
        });
    };

    const handleCancelEditPlayer = () => {
        setEditingPlayerId(null);
        setEditPlayerForm({ name: '', email: '', phone: '', handicapIndex: '', courseData: {}, roomNumber: '', houseNumber: '' });
    };

    const handleSavePlayerEdit = async (playerId) => {
        try {
            const hcp = parseFloat(editPlayerForm.handicapIndex);
            if (isNaN(hcp)) {
                alert('Please enter a valid handicap index');
                return;
            }

            const payload = {
                name: editPlayerForm.name,
                email: editPlayerForm.email || null,
                phone: editPlayerForm.phone || null,
                handicapIndex: hcp,
                courseData: editPlayerForm.courseData || {},
                isManager: editPlayerForm.isManager,
                roomNumber: editPlayerForm.roomNumber || null,
                houseNumber: editPlayerForm.houseNumber || null
            };

            const res = await fetch(`/api/players/${playerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                await fetchPlayers();
                handleCancelEditPlayer();
            } else {
                alert('Failed to update player');
            }
        } catch (error) {
            console.error('Error updating player:', error);
            alert('Failed to update player');
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
    const [lodgingForm, setLodgingForm] = useState({ name: '', unitNumber: '', address: '', url: '', notes: '', image: '' });
    const [savingLodging, setSavingLodging] = useState(false);
    const [lodgingSearch, setLodgingSearch] = useState('');
    const [lodgingPlaceResults, setLodgingPlaceResults] = useState([]);
    const [searchingLodgingPlaces, setSearchingLodgingPlaces] = useState(false);

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
    const [editingPrizeId, setEditingPrizeId] = useState(null);
    const [editPrizeForm, setEditPrizeForm] = useState({ title: '', description: '', value: '' });

    // Special Prizes
    const [closestToPin, setClosestToPin] = useState([]);
    const [longDrive, setLongDrive] = useState([]);
    // { courseId, hole } entries for each

    // Payment Info
    const [venmo, setVenmo] = useState('');
    const [paypal, setPaypal] = useState('');
    const [zelle, setZelle] = useState('');
    const [savingPayment, setSavingPayment] = useState(false);
    const [paymentMessage, setPaymentMessage] = useState('');

    // const handleLogin = (e) => { ... } // Removed hardcoded auth logic

    useEffect(() => {
        if (!tournamentId) return;
        fetchSettings();
        fetchCourses();
        fetchAvailableCourses(); // Fetch global library
        fetchPlayers();
        fetchLodgings();
        fetchRestaurants();
    }, [tournamentId]);

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

    const handleFetchNcrdbTees = async () => {
        if (!selectedCourseId) return;
        const course = courses.find(c => c.id === selectedCourseId);
        if (!course) return;

        setFetchingNcrdb(true);
        try {
            // Extract state code if possible from address
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
                // Confirm before overwriting if tees already exist
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
                // Keep existing holes but update their handicaps
                const existingHoles = course.holes ? [...course.holes] : [];
                
                // Make sure we have 18 placeholders if array is empty
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
                setScorecardUrl(''); // clear it
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
                // Initialize with 18 handicaps if we want them per tee
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
        // Select the new tee (last index)
        const course = courses.find(c => c.id === selectedCourseId);
        if (course) {
            setSelectedTeeIndex((course.tees || []).length);
        }
    };

    const handleDeleteTee = (teeIndex) => {
        if (!confirm("Are you sure you want to delete this tee box?")) return;
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
            // Append "golf course" to the search query if it isn't already there to improve results
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
            // Step 1 — Save the course to the DB
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

            // Clear the form immediately so the user knows the save worked
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

    const fetchSettings = async () => {
        try {
            const res = await fetch(`/api/settings?tournamentId=${tournamentId}`);
            if (res.ok) {
                const data = await res.json();

                setNumberOfRounds(data.numberOfRounds || 0);
                setRoundDates(data.roundDates || []);
                // Ensure course IDs are valid numbers, default to 1 if null
                setRoundCourses(data.roundCourses || []);
                setRoundHandicaps(data.roundHandicaps || []);
                setMaxHandicap(data.maxHandicap !== null && data.maxHandicap !== undefined ? data.maxHandicap : '');
                setRyderCupConfig(data.ryderCupConfig || { enabled: false, team1: [], team2: [] });
                setRoundTimeConfig(data.roundTimeConfig || {});
                setShowAccommodations(!!data.showAccommodations);
                setShowFood(data.showFood !== false); // Default to true if undefined
                setShowPhotos(!!data.showPhotos);     // Default to false if undefined
                setShowCourses(data.showCourses !== false);
                setShowPlayers(data.showPlayers !== false);
                setShowSchedule(data.showSchedule !== false);
                setShowLeaderboard(data.showLeaderboard !== false);
                setShowPrizes(data.showPrizes !== false);
                setShowChat(data.showChat !== false);
                setShowPlay(data.showPlay !== false);
                setShowStats(data.showStats !== false);
                setShowScorecards(data.showScorecards !== false);
                setTournamentName(data.tournamentName || 'Golf Tournament');
                setLogoUrl(data.logoUrl || '');
                setPrizesTitle(data.prizesTitle || 'Tournament Prizes');
                setPrizes(Array.isArray(data.prizes) ? data.prizes : []);
                setVenmo(data.venmo || '');
                setPaypal(data.paypal || '');
                setZelle(data.zelle || '');
                setSpotifyUrl(data.spotifyUrl || '');
                setClosestToPin(Array.isArray(data.closestToPin) ? data.closestToPin : []);
                setLongDrive(Array.isArray(data.longDrive) ? data.longDrive : []);
                setAllowPlayerEdits(!!data.allowPlayerEdits);
                setTimezone(data.timezone || 'America/New_York');
                setBackgroundColor(data.backgroundColor || '#0a1a0f');
                setIsAdmin(!!data.isAdmin);

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
        setRoundHandicaps([...roundHandicaps, '100']);
        // roundTimeConfig handles new keys lazily or we can init if needed
    };

    const handleDeleteRound = (indexToDelete) => {
        if (!confirm("Are you sure you want to delete this round?")) return;

        setNumberOfRounds(prev => prev - 1);
        setRoundDates(roundDates.filter((_, i) => i !== indexToDelete));
        setRoundCourses(roundCourses.filter((_, i) => i !== indexToDelete));
        setRoundHandicaps(roundHandicaps.filter((_, i) => i !== indexToDelete));

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

    const handleAddPlayerToTeam = (roundIndex, teamKey, playerId) => {
        if (!playerId) return;
        const newConfig = { ...roundTimeConfig };
        if (!newConfig[roundIndex]) newConfig[roundIndex] = {};
        if (!newConfig[roundIndex][teamKey]) newConfig[roundIndex][teamKey] = [];

        if (!newConfig[roundIndex][teamKey].includes(playerId)) {
            newConfig[roundIndex][teamKey] = [...newConfig[roundIndex][teamKey], playerId];
        }
        setRoundTimeConfig(newConfig);
    };

    const handleRemovePlayerFromTeam = (roundIndex, teamKey, playerId) => {
        const newConfig = { ...roundTimeConfig };
        if (!newConfig[roundIndex] || !newConfig[roundIndex][teamKey]) return;

        newConfig[roundIndex][teamKey] = newConfig[roundIndex][teamKey].filter(id => id !== playerId);
        setRoundTimeConfig(newConfig);
    };

    const handleAddPlayerToGlobalTeam = (team, playerId) => {
        if (!playerId) return;
        setRyderCupConfig(prev => ({
            ...prev,
            [team]: [...(prev[team] || []), playerId]
        }));
    };

    const handleRemovePlayerFromGlobalTeam = (team, playerId) => {
        setRyderCupConfig(prev => ({
            ...prev,
            [team]: (prev[team] || []).filter(id => id !== playerId)
        }));
    };

    const handleClearRoundScores = async (roundNum) => {
        if (!window.confirm(`Are you sure you want to clear ALL scores for Round ${roundNum}? This cannot be undone.`)) return;

        try {
            const res = await fetch(`/api/scores?tournamentId=${tournamentId}&round=${roundNum}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                alert(`Round ${roundNum} scores cleared successfully.`);
            } else {
                const errorData = await res.json();
                const msg = errorData.details ? `${errorData.error}: ${errorData.details}` : (errorData.error || 'Unknown error');
                alert(`Failed to clear scores: ${msg}`);
            }
        } catch (error) {
            console.error('Error clearing scores:', error);
            alert('Error clearing scores.');
        }
    };

    const handleMoveRoundUp = (index) => {
        if (index === 0) return;

        // Swap Dates
        const newDates = [...roundDates];
        [newDates[index - 1], newDates[index]] = [newDates[index], newDates[index - 1]];
        setRoundDates(newDates);

        // Swap Courses
        const newCourses = [...roundCourses];
        [newCourses[index - 1], newCourses[index]] = [newCourses[index], newCourses[index - 1]];
        setRoundCourses(newCourses);

        // Swap Handicaps
        const newHandicaps = [...roundHandicaps];
        [newHandicaps[index - 1], newHandicaps[index]] = [newHandicaps[index], newHandicaps[index - 1]];
        setRoundHandicaps(newHandicaps);

        // Swap Time Configs (1-based indices)
        const roundNumAbove = index;     // e.g. Round 1 (index 0+1)
        const roundNumCurrent = index + 1; // e.g. Round 2 (index 1+1)

        const newTimeConfig = { ...roundTimeConfig };
        const temp = newTimeConfig[roundNumAbove];
        newTimeConfig[roundNumAbove] = newTimeConfig[roundNumCurrent];
        newTimeConfig[roundNumCurrent] = temp;

        if (newTimeConfig[roundNumAbove] === undefined) delete newTimeConfig[roundNumAbove];
        if (newTimeConfig[roundNumCurrent] === undefined) delete newTimeConfig[roundNumCurrent];

        setRoundTimeConfig(newTimeConfig);
    };

    const handleMoveRoundDown = (index) => {
        if (index === numberOfRounds - 1) return;

        // Swap Dates
        const newDates = [...roundDates];
        [newDates[index + 1], newDates[index]] = [newDates[index], newDates[index + 1]];
        setRoundDates(newDates);

        // Swap Courses
        const newCourses = [...roundCourses];
        [newCourses[index + 1], newCourses[index]] = [newCourses[index], newCourses[index + 1]];
        setRoundCourses(newCourses);

        // Swap Handicaps
        const newHandicaps = [...roundHandicaps];
        [newHandicaps[index + 1], newHandicaps[index]] = [newHandicaps[index], newHandicaps[index + 1]];
        setRoundHandicaps(newHandicaps);

        // Swap Time Configs (1-based indices)
        const roundNumCurrent = index + 1; // e.g. Round 1 (index 0+1)
        const roundNumBelow = index + 2;   // e.g. Round 2 (index 1+1)

        const newTimeConfig = { ...roundTimeConfig };
        const temp = newTimeConfig[roundNumCurrent];
        newTimeConfig[roundNumCurrent] = newTimeConfig[roundNumBelow];
        newTimeConfig[roundNumBelow] = temp;

        if (newTimeConfig[roundNumCurrent] === undefined) delete newTimeConfig[roundNumCurrent];
        if (newTimeConfig[roundNumBelow] === undefined) delete newTimeConfig[roundNumBelow];

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

    const handleHandicapChange = (index, value) => {
        const newHandicaps = [...roundHandicaps];
        newHandicaps[index] = value;
        setRoundHandicaps(newHandicaps);
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
                    roundHandicaps: roundHandicaps,
                    maxHandicap: maxHandicap !== '' ? parseInt(maxHandicap) : null,
                    ryderCupConfig: ryderCupConfig,
                    roundTimeConfig: roundTimeConfig,
                    totalPlayers: 0, // Deprecated in UI, setting to 0
                    showAccommodations,
                    showFood,
                    showPhotos,
                    showCourses,
                    showPlayers,
                    showSchedule,
                    showLeaderboard,
                    showPrizes,
                    showChat,
                    showPlay,
                    showStats,
                    showScorecards,
                    tournamentName,
                    logoUrl,
                    prizesTitle,
                    prizes,
                    closestToPin,
                    longDrive,
                    allowPlayerEdits,
                    timezone,
                    spotifyUrl
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

    const handleTogglePlayerEdits = async (checked) => {
        setAllowPlayerEdits(checked); // Optimistic update
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
                    totalPlayers: 0,
                    showAccommodations,
                    showFood,
                    showPhotos,
                    showCourses,
                    showPlayers,
                    showSchedule,
                    showLeaderboard,
                    showPrizes,
                    showChat,
                    showPlay,
                    showStats,
                    showScorecards,
                    tournamentName,
                    logoUrl,
                    prizesTitle,
                    prizes,
                    closestToPin,
                    longDrive,
                    allowPlayerEdits: checked,
                    timezone,
                    spotifyUrl,
                    roundTimeConfig: roundTimeConfig,
                    showPrizes: showPrizes
                })
            });
            if (!res.ok) {
                // Revert on API error
                setAllowPlayerEdits(!checked);
            }
        } catch (error) {
            console.error('Error saving player edit toggle:', error);
            setAllowPlayerEdits(!checked);
        }
    };

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab, tournamentId]);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await fetch('/api/history');
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                // Filter archives that belong to this tournament
                const filtered = data.filter(archive => {
                    const arcData = archive.data || {};
                    return arcData.slug === tournamentId || arcData.id === tournamentId || !arcData.id;
                });
                setHistoryArchives(filtered || []);
            }
        } catch (e) {
            console.error('Error fetching history:', e);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleDeleteArchive = async (id) => {
        if (!confirm('Are you sure you want to delete this archive?')) return;
        try {
            const res = await fetch(`/api/history?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setHistoryArchives(prev => prev.filter(a => a.id !== id));
            }
        } catch (e) {
            console.error('Error deleting archive:', e);
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
                body: JSON.stringify({ name: tripName, tournamentId })
            });

            if (res.ok) {
                setHistoryMessage('History saved successfully!');
                setTripName('');
                fetchHistory(); // Refresh the list
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

    const handleRestoreArchive = async (archiveId, archiveName) => {
        const confirmRestore = confirm(
            `⚠️ WARNING: RESTORE IS DESTRUCTIVE\n\n` +
            `Restoring "${archiveName}" will DELETE all current players, scores, tee times, and settings for this tournament and replace them with the data from the archive.\n\n` +
            `Are you absolutely sure you want to proceed?`
        );

        if (!confirmRestore) return;

        setRestoringHistory(true);
        setHistoryMessage(`Restoring ${archiveName}...`);

        try {
            const res = await fetch('/api/history/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ archiveId, tournamentId })
            });

            if (res.ok) {
                setHistoryMessage(`✅ Successfully restored: ${archiveName}`);
                // Refresh EVERYTHING
                await Promise.all([
                    fetchSettings(),
                    fetchPlayers(),
                    fetchCourses(),
                    fetchAvailableCourses(),
                    fetchLodgings(),
                    fetchRestaurants()
                ]);
                setTimeout(() => setHistoryMessage(''), 5000);
            } else {
                const data = await res.json();
                setHistoryMessage(`❌ Error: ${data.error || 'Restore failed'}`);
            }
        } catch (error) {
            console.error('Error restoring history:', error);
            setHistoryMessage('❌ Error restoring archive');
        } finally {
            setRestoringHistory(false);
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
                    showCourses,
                    showPlayers,
                    showSchedule,
                    showLeaderboard,
                    showPrizes,
                    showChat,
                    showPlay,
                    showStats,
                    showScorecards,
                    tournamentName,
                    logoUrl,
                    prizesTitle,
                    prizes,
                    closestToPin,
                    longDrive,
                    backgroundColor
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

    const handleSearchLodgingPlaces = async (e) => {
        e.preventDefault();
        if (!lodgingSearch.trim()) return;
        setSearchingLodgingPlaces(true);
        try {
            const res = await fetch(`/api/places?query=${encodeURIComponent(lodgingSearch)}&type=lodging`);
            const data = await res.json();
            if (res.ok) {
                setLodgingPlaceResults(data || []);
            } else {
                alert('Failed to search: ' + (data.error || 'Unknown error'));
            }
        } catch (e) {
            console.error(e);
            alert('Error searching places');
        } finally {
            setSearchingLodgingPlaces(false);
        }
    };

    const handleSelectLodgingPlace = async (placeId) => {
        setSearchingLodgingPlaces(true);
        try {
            const res = await fetch(`/api/places?placeId=${placeId}`);
            const data = await res.json();
            if (res.ok) {
                setLodgingForm(prev => ({
                    ...prev,
                    name: data.name || '',
                    address: data.formatted_address || '',
                    url: data.website || '',
                }));
                setLodgingPlaceResults([]);
                setLodgingSearch('');
            } else {
                alert('Failed to get place details: ' + (data.error || 'Unknown error'));
            }
        } catch (e) {
            console.error(e);
            alert('Error fetching place details');
        } finally {
            setSearchingLodgingPlaces(false);
        }
    };

    const handleAddPlayerToLodging = async (lodgingId, playerId) => {
        const lodging = lodgings.find(l => l.id === lodgingId);
        if (!lodging) return;
        const currentPlayerIds = (lodging.players || []).map(lp => lp.player.id);
        if (currentPlayerIds.includes(playerId)) return;
        const newPlayerIds = [...currentPlayerIds, playerId];
        try {
            const res = await fetch(`/api/lodging/${lodgingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerIds: newPlayerIds })
            });
            if (res.ok) {
                const updated = await res.json();
                setLodgings(lodgings.map(l => l.id === lodgingId ? updated : l));
            }
        } catch (e) { console.error(e); }
    };

    const handleRemovePlayerFromLodging = async (lodgingId, playerId) => {
        const lodging = lodgings.find(l => l.id === lodgingId);
        if (!lodging) return;
        const newPlayerIds = (lodging.players || []).map(lp => lp.player.id).filter(id => id !== playerId);
        try {
            const res = await fetch(`/api/lodging/${lodgingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerIds: newPlayerIds })
            });
            if (res.ok) {
                const updated = await res.json();
                setLodgings(lodgings.map(l => l.id === lodgingId ? updated : l));
            }
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
                callback(canvas.toDataURL('image/png'));
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

    const handleClearAllScores = async () => {
        if (confirm('Are you SUPER SURE? This will delete ALL scores for the entire tournament. This cannot be undone.')) {
            try {
                const res = await fetch('/api/scores', { method: 'DELETE' });
                if (res.ok) {
                    alert('All scores cleared!');
                } else {
                    const errorData = await res.json();
                    const msg = errorData.details ? `${errorData.error}: ${errorData.details}` : (errorData.error || 'Unknown error');
                    alert(`Failed to clear scores: ${msg}`);
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
                    showCourses,
                    showPlayers,
                    showSchedule,
                    showLeaderboard,
                    showPrizes,
                    showChat,
                    showPlay,
                    showStats,
                    showScorecards,
                    tournamentName,
                    logoUrl,
                    prizesTitle,
                    prizes,
                    closestToPin,
                    longDrive
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
                    showCourses,
                    showPlayers,
                    showSchedule,
                    showLeaderboard,
                    showPrizes,
                    showChat,
                    showPlay,
                    showStats,
                    tournamentName,
                    logoUrl,
                    prizesTitle,
                    prizes,
                    venmo,
                    paypal,
                    zelle,
                    allowPlayerEdits,
                    timezone,
                    spotifyUrl,
                    showScorecards
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

    const handleEditPrizeClick = (prize) => {
        setEditingPrizeId(prize.id);
        setEditPrizeForm({ title: prize.title || '', description: prize.description || '', value: prize.value || '' });
    };

    const handleCancelEditPrize = () => {
        setEditingPrizeId(null);
        setEditPrizeForm({ title: '', description: '', value: '' });
    };

    const handleSavePrizeEdit = (id) => {
        if (!editPrizeForm.title) return;
        setPrizes((prizes || []).map(p => p.id === id ? { ...p, ...editPrizeForm } : p));
        setEditingPrizeId(null);
        setEditPrizeForm({ title: '', description: '', value: '' });
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

    if (!isAdmin && status !== 'loading' && !loading) {
        return (
            <div className="fade-in" style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
                <h1 className="section-title">Access Denied</h1>
                <div className="card">
                    <p style={{ marginBottom: '1.5rem' }}>You do not have permission to manage this tournament.</p>
                    <Link href={`/t/${tournamentId}`} className="btn" style={{ width: '100%' }}>Return to Tournament</Link>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'general', label: 'General' },
        { id: 'players', label: 'Players' },
        { id: 'courses', label: 'Courses' },
        { id: 'accommodations', label: 'Lodging' },
        { id: 'restaurants', label: 'Food' },
        { id: 'prizes', label: 'Prizes' },
        { id: 'payment', label: 'Payment' },
        { id: 'branding', label: 'Branding' },
        { id: 'history', label: 'History' },
        { id: 'print', label: 'Print & Export' },
    ];

    return (
        <div className="container fade-in" style={{ paddingBottom: '3rem', paddingTop: '1rem' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                gap: '0.75rem'
            }}>
                <h1 className="section-title" style={{ margin: 0, fontSize: 'clamp(1.4rem, 5vw, 2rem)', textAlign: 'left' }}>Settings</h1>
                <button
                    onClick={() => signOut()}
                    className="btn-outline"
                    style={{ fontSize: '0.8rem', padding: '6px 10px', whiteSpace: 'nowrap' }}
                >
                    Sign Out
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
                <div style={{ flex: 1, minWidth: 0, width: '100%' }}>

                    {/* General / Tournament Config Tab */}
                    {activeTab === 'general' && (
                        <div className="card">
                            {courses.length === 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1.1rem', marginBottom: '1.5rem', background: 'rgba(255, 193, 7, 0.08)', border: '1px solid rgba(255, 193, 7, 0.35)', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '1.2rem' }}>⛳</span>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#ffc107' }}>
                                        <strong>Add and edit a golf course before you create a round</strong> — head to the <button onClick={() => setActiveTab('courses')} style={{ background: 'none', border: 'none', color: '#ffc107', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit', fontWeight: 700 }}>Courses tab</button> to get started.
                                    </p>
                                </div>
                            )}

                            <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Tournament Configuration</h2>

                            {/* Overall Tournament Format */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Overall Tournament Format</h3>
                                <div style={{ background: 'rgba(212, 175, 55, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div>
                                            <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>Overall Ryder Cup Mode</h4>
                                            <p style={{ margin: 0, marginTop: '0.2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                Enables Team 1 vs Team 2 scoring for the entire tournament. Points will accumulate across all rounds based on head-to-head performance.
                                            </p>
                                        </div>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                checked={ryderCupConfig.enabled}
                                                onChange={(e) => setRyderCupConfig({ ...ryderCupConfig, enabled: e.target.checked })}
                                            />
                                            <span className="slider round"></span>
                                        </label>
                                    </div>

                                    {ryderCupConfig.enabled && (
                                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                                            <h4 style={{ color: 'var(--accent)', marginBottom: '1rem', fontSize: '1rem' }}>Global Ryder Cup Teams</h4>
                                            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>

                                                {/* Global Team 1 */}
                                                <div style={{ flex: '1 1 300px' }}>
                                                    <h5 style={{ marginBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <input
                                                            type="text"
                                                            value={ryderCupConfig.team1Name || 'Team 1'}
                                                            onChange={(e) => setRyderCupConfig({ ...ryderCupConfig, team1Name: e.target.value })}
                                                            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: 'inherit', fontWeight: 'inherit', width: '100%' }}
                                                        />
                                                    </h5>
                                                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0' }}>
                                                        {(ryderCupConfig.team1 || []).map(playerId => {
                                                            const player = players.find(p => p.id === playerId);
                                                            return player ? (
                                                                <li key={playerId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0', fontSize: '0.9rem' }}>
                                                                    <span>{player.name}</span>
                                                                    <button onClick={() => handleRemovePlayerFromGlobalTeam('team1', playerId)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>&times;</button>
                                                                </li>
                                                            ) : null;
                                                        })}
                                                    </ul>
                                                    <select
                                                        onChange={(e) => handleAddPlayerToGlobalTeam('team1', e.target.value)}
                                                        value=""
                                                        style={{ width: '100%', padding: '6px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '0.85rem' }}
                                                    >
                                                        <option value="" disabled>+ Add Player to {ryderCupConfig.team1Name || 'Team 1'}</option>
                                                        {players.filter(p =>
                                                            !(ryderCupConfig.team1 || []).includes(p.id) &&
                                                            !(ryderCupConfig.team2 || []).includes(p.id)
                                                        ).map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Global Team 2 */}
                                                <div style={{ flex: '1 1 300px' }}>
                                                    <h5 style={{ marginBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <input
                                                            type="text"
                                                            value={ryderCupConfig.team2Name || 'Team 2'}
                                                            onChange={(e) => setRyderCupConfig({ ...ryderCupConfig, team2Name: e.target.value })}
                                                            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: 'inherit', fontWeight: 'inherit', width: '100%' }}
                                                        />
                                                    </h5>
                                                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0' }}>
                                                        {(ryderCupConfig.team2 || []).map(playerId => {
                                                            const player = players.find(p => p.id === playerId);
                                                            return player ? (
                                                                <li key={playerId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0', fontSize: '0.9rem' }}>
                                                                    <span>{player.name}</span>
                                                                    <button onClick={() => handleRemovePlayerFromGlobalTeam('team2', playerId)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>&times;</button>
                                                                </li>
                                                            ) : null;
                                                        })}
                                                    </ul>
                                                    <select
                                                        onChange={(e) => handleAddPlayerToGlobalTeam('team2', e.target.value)}
                                                        value=""
                                                        style={{ width: '100%', padding: '6px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '0.85rem' }}
                                                    >
                                                        <option value="" disabled>+ Add Player to {ryderCupConfig.team2Name || 'Team 2'}</option>
                                                        {players.filter(p =>
                                                            !(ryderCupConfig.team1 || []).includes(p.id) &&
                                                            !(ryderCupConfig.team2 || []).includes(p.id)
                                                        ).map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* General Links Configuration */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>General Links & Information</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1rem' }}>
                                    <div>
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

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                                            Tournament Timezone
                                        </label>
                                        <select
                                            value={timezone}
                                            onChange={(e) => setTimezone(e.target.value)}
                                            style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                        >
                                            <optgroup label="US Timezones">
                                                <option value="America/New_York">Eastern Time (ET)</option>
                                                <option value="America/Chicago">Central Time (CT)</option>
                                                <option value="America/Denver">Mountain Time (MT)</option>
                                                <option value="America/Phoenix">Mountain Time - Arizona (No DST)</option>
                                                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                                <option value="America/Anchorage">Alaska Time (AKT)</option>
                                                <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
                                            </optgroup>
                                            <optgroup label="Common International">
                                                <option value="Europe/London">London (GMT/BST)</option>
                                                <option value="Europe/Paris">Central Europe (CET/CEST)</option>
                                                <option value="Asia/Tokyo">Tokyo (JST)</option>
                                                <option value="Australia/Sydney">Sydney (AEST/AEDT)</option>
                                            </optgroup>
                                        </select>
                                        <p style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            Ensures accurate &quot;Add to Calendar&quot; links for players matching the tournament's actual physical location.
                                        </p>
                                    </div>
                                </div>
                            </div>


                            {/* Round Details */}
                            <div style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                                    <h3 style={{ margin: 0, color: 'var(--accent)' }}>Round Details</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>Global Max Handicap:</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="54"
                                            value={maxHandicap}
                                            onChange={(e) => setMaxHandicap(e.target.value)}
                                            placeholder="None"
                                            style={{
                                                width: '80px',
                                                padding: '8px',
                                                borderRadius: 'var(--radius)',
                                                border: '1px solid var(--glass-border)',
                                                background: 'var(--bg-dark)',
                                                color: 'var(--text-main)',
                                                fontSize: '0.9rem'
                                            }}
                                        />
                                    </div>
                                </div>
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
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleMoveRoundUp(index)}
                                                    disabled={index === 0}
                                                    className="btn-outline"
                                                    style={{
                                                        padding: '4px 8px',
                                                        fontSize: '0.8rem',
                                                        opacity: index === 0 ? 0.4 : 1,
                                                        cursor: index === 0 ? 'not-allowed' : 'pointer'
                                                    }}
                                                    title="Move Round Up"
                                                >
                                                    ↑
                                                </button>
                                                <button
                                                    onClick={() => handleMoveRoundDown(index)}
                                                    disabled={index === numberOfRounds - 1}
                                                    className="btn-outline"
                                                    style={{
                                                        padding: '4px 8px',
                                                        fontSize: '0.8rem',
                                                        opacity: index === numberOfRounds - 1 ? 0.4 : 1,
                                                        cursor: index === numberOfRounds - 1 ? 'not-allowed' : 'pointer'
                                                    }}
                                                    title="Move Round Down"
                                                >
                                                    ↓
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRound(index)}
                                                    className="btn-outline"
                                                    style={{
                                                        borderColor: '#ff6b6b',
                                                        color: '#ff6b6b',
                                                        padding: '4px 8px',
                                                        fontSize: '0.8rem'
                                                    }}
                                                    title="Delete Round"
                                                >
                                                    ✖
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
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
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Handicap %</label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={roundHandicaps[index] || ''}
                                                        placeholder="100"
                                                        onChange={(e) => handleHandicapChange(index, e.target.value)}
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
                                                    <span style={{ color: 'var(--text-muted)' }}>%</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                            <div style={{ flex: '1 1 120px' }}>
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
                                            <div style={{ flex: '1 1 120px' }}>
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
                                            <div style={{ flex: '1 1 200px' }}>
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


                                                    <option value="MatchPlay">Match Play</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => handleClearRoundScores(index + 1)}
                                                style={{
                                                    padding: '4px 12px',
                                                    fontSize: '0.75rem',
                                                    background: 'transparent',
                                                    border: '1px solid #ff4d4d',
                                                    color: '#ff4d4d',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Clear Round Scores
                                            </button>
                                        </div>

                                        {/* Ryder Cup Teams UI */}
                                        {(roundTimeConfig[index + 1]?.format === 'RyderCup' || roundTimeConfig[index + 1]?.format === 'MatchPlay') && (
                                            <div style={{ marginTop: '1rem', background: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                                <h4 style={{ color: 'var(--accent)', marginBottom: '1rem', fontSize: '1rem' }}>Match Play Teams</h4>
                                                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>

                                                    {/* Team 1 */}
                                                    <div style={{ flex: '1 1 300px' }}>
                                                        <h5 style={{ marginBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.25rem' }}>Team 1</h5>
                                                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0' }}>
                                                            {(roundTimeConfig[index + 1]?.team1 || []).map(playerId => {
                                                                const player = players.find(p => p.id === playerId);
                                                                return player ? (
                                                                    <li key={playerId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0', fontSize: '0.9rem' }}>
                                                                        <span>{player.name}</span>
                                                                        <button onClick={() => handleRemovePlayerFromTeam(index + 1, 'team1', playerId)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>&times;</button>
                                                                    </li>
                                                                ) : null;
                                                            })}
                                                        </ul>
                                                        <select
                                                            onChange={(e) => handleAddPlayerToTeam(index + 1, 'team1', e.target.value)}
                                                            value=""
                                                            style={{ width: '100%', padding: '6px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '0.85rem' }}
                                                        >
                                                            <option value="" disabled>+ Add Player to Team 1</option>
                                                            {players.filter(p =>
                                                                !(roundTimeConfig[index + 1]?.team1 || []).includes(p.id) &&
                                                                !(roundTimeConfig[index + 1]?.team2 || []).includes(p.id)
                                                            ).map(p => (
                                                                <option key={p.id} value={p.id}>{p.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Team 2 */}
                                                    <div style={{ flex: '1 1 300px' }}>
                                                        <h5 style={{ marginBottom: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.25rem' }}>Team 2</h5>
                                                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0' }}>
                                                            {(roundTimeConfig[index + 1]?.team2 || []).map(playerId => {
                                                                const player = players.find(p => p.id === playerId);
                                                                return player ? (
                                                                    <li key={playerId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0', fontSize: '0.9rem' }}>
                                                                        <span>{player.name}</span>
                                                                        <button onClick={() => handleRemovePlayerFromTeam(index + 1, 'team2', playerId)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>&times;</button>
                                                                    </li>
                                                                ) : null;
                                                            })}
                                                        </ul>
                                                        <select
                                                            onChange={(e) => handleAddPlayerToTeam(index + 1, 'team2', e.target.value)}
                                                            value=""
                                                            style={{ width: '100%', padding: '6px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '0.85rem' }}
                                                        >
                                                            <option value="" disabled>+ Add Player to Team 2</option>
                                                            {players.filter(p =>
                                                                !(roundTimeConfig[index + 1]?.team1 || []).includes(p.id) &&
                                                                !(roundTimeConfig[index + 1]?.team2 || []).includes(p.id)
                                                            ).map(p => (
                                                                <option key={p.id} value={p.id}>{p.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                </div>
                                            </div>
                                        )}
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
                                        <input type="checkbox" checked={showCourses} onChange={(e) => setShowCourses(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                                        <span>Show Courses Page</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={showPlayers} onChange={(e) => setShowPlayers(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                                        <span>Show Players Page</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={showSchedule} onChange={(e) => setShowSchedule(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                                        <span>Show Schedule / Tee Times Page</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={showAccommodations} onChange={(e) => setShowAccommodations(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                                        <span>Show Accommodations / Lodging Page</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={showFood} onChange={(e) => setShowFood(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                                        <span>Show Restaurants / Food Page</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={showPhotos} onChange={(e) => setShowPhotos(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                                        <span>Show Photos Gallery Page</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={showPrizes} onChange={(e) => setShowPrizes(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                                        <span>Show Prizes & Payments Page</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={showChat} onChange={(e) => setShowChat(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                                        <span>Show Smack Talk / Chat Page</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={showPlay} onChange={(e) => setShowPlay(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                                        <span>Show Play / Enter Scores Page</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={showLeaderboard} onChange={(e) => setShowLeaderboard(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                                        <span>Show Leaderboard & Teams Page</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={showStats} onChange={(e) => setShowStats(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                                        <span>Show Tournament Stats Page</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={showScorecards} onChange={(e) => setShowScorecards(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                                        <span>Show Scorecard Upload Page</span>
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
                                                    {l.unitNumber && <p style={{ margin: '0.1rem 0', fontSize: '0.85rem', color: 'var(--accent)', opacity: 0.7, fontWeight: 600 }}>{l.unitNumber}</p>}
                                                    <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{l.address}</p>
                                                    {l.url && <a href={l.url} target="_blank" style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>Website</a>}

                                                    {/* Players assigned */}
                                                    <div style={{ marginTop: '0.75rem' }}>
                                                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🏌️ Assigned Players</p>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.6rem' }}>
                                                            {(l.players || []).length === 0
                                                                ? <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>None assigned</span>
                                                                : l.players.map(lp => (
                                                                    <span key={lp.player.id} style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '20px', padding: '0.2rem 0.65rem', fontSize: '0.82rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                                        {lp.player.name}
                                                                        <button
                                                                            onClick={() => handleRemovePlayerFromLodging(l.id, lp.player.id)}
                                                                            style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: 0, fontSize: '0.85rem', lineHeight: 1 }}
                                                                            title="Remove"
                                                                        >×</button>
                                                                    </span>
                                                                ))
                                                            }
                                                        </div>
                                                        {/* Add player dropdown */}
                                                        <select
                                                            defaultValue=""
                                                            onChange={e => { if (e.target.value) { handleAddPlayerToLodging(l.id, e.target.value); e.target.value = ''; } }}
                                                            style={{ padding: '6px 10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '0.85rem' }}
                                                        >
                                                            <option value="" disabled>+ Add player...</option>
                                                            {players
                                                                .filter(p => !(l.players || []).some(lp => lp.player.id === p.id))
                                                                .map(p => (
                                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                                ))
                                                            }
                                                        </select>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleDeleteLodging(l.id)} className="btn-outline" style={{ height: 'fit-content', borderColor: '#ff6b6b', color: '#ff6b6b' }}>Delete</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Add New Location</h3>

                                {/* Google Places Search */}
                                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(212, 175, 55, 0.05)', borderRadius: 'var(--radius)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                                    <h4 style={{ color: 'var(--accent)', margin: '0 0 0.4rem 0' }}>🔍 Search via Google Places</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Auto-fill name, address & website by searching for the property.</p>
                                    <form onSubmit={handleSearchLodgingPlaces} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <input
                                            value={lodgingSearch}
                                            onChange={e => setLodgingSearch(e.target.value)}
                                            placeholder="Hotel or resort name..."
                                            style={{ flex: 1, padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                        />
                                        <button type="submit" className="btn" disabled={searchingLodgingPlaces}>
                                            {searchingLodgingPlaces ? 'Searching...' : 'Search'}
                                        </button>
                                    </form>
                                    {lodgingPlaceResults.length > 0 && (
                                        <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                                            {lodgingPlaceResults.map(p => (
                                                <div
                                                    key={p.place_id}
                                                    onClick={() => handleSelectLodgingPlace(p.place_id)}
                                                    style={{ padding: '0.6rem 0.8rem', background: 'var(--bg-dark)', borderRadius: '6px', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'border-color 0.2s' }}
                                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                                                >
                                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.formatted_address}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <form onSubmit={handleSaveLodging}>
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        <input
                                            placeholder="Property Name (e.g. Hilton Resort)"
                                            value={lodgingForm.name}
                                            onChange={e => setLodgingForm({ ...lodgingForm, name: e.target.value })}
                                            style={{ padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                            required
                                        />
                                        <input
                                            placeholder="Unit / Room (e.g. Unit 4B, Room 201)"
                                            value={lodgingForm.unitNumber}
                                            onChange={e => setLodgingForm({ ...lodgingForm, unitNumber: e.target.value })}
                                            style={{ padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
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

                            {/* Allow Player Edits toggle */}
                            <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', marginBottom: '0.2rem' }}>Allow Players to Edit Their Info</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>When enabled, players can update their name, contact info, and tee box on the Players page.</div>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', flexShrink: 0 }}>
                                    <input
                                        type="checkbox"
                                        checked={allowPlayerEdits}
                                        onChange={e => handleTogglePlayerEdits(e.target.checked)}
                                        style={{ accentColor: 'var(--accent)', width: '18px', height: '18px' }}
                                    />
                                    <span style={{ fontSize: '0.9rem', color: allowPlayerEdits ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 'bold' }}>
                                        {allowPlayerEdits ? 'Enabled' : 'Disabled'}
                                    </span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>

                                <Link href={`/t/${tournamentId}/admin/schedule`} className="btn" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                    Manage Schedule
                                </Link>
                                {(() => {
                                    const emailList = players.filter(p => p.email).map(p => p.email);
                                    const withoutEmail = players.filter(p => !p.email);
                                    const href = emailList.length > 0
                                        ? `mailto:?bcc=${encodeURIComponent(emailList.join(','))}&subject=${encodeURIComponent(tournamentName)}`
                                        : null;
                                    return (
                                        <a
                                            href={href || undefined}
                                            onClick={!href ? (e) => { e.preventDefault(); alert('No players have email addresses on file.'); } : undefined}
                                            className="btn-outline"
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', cursor: 'pointer' }}
                                            title={withoutEmail.length > 0 ? `${withoutEmail.length} player(s) have no email and will be skipped` : 'Email all players'}
                                        >
                                            ✉️ Email All Players
                                            {emailList.length > 0 && (
                                                <span style={{ fontSize: '0.75rem', background: 'var(--accent)', color: '#000', borderRadius: '999px', padding: '1px 7px', fontWeight: 'bold' }}>
                                                    {emailList.length}
                                                </span>
                                            )}
                                        </a>
                                    );
                                })()}
                                <button
                                    onClick={handleClearAllScores}
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
                                                placeholder="e.g. 12.4"
                                                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Room # (Optional)</label>
                                            <input
                                                value={newPlayerRoomNumber}
                                                onChange={e => setNewPlayerRoomNumber(e.target.value)}
                                                placeholder="Room Number"
                                                style={{ width: '100%', padding: '8px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>House # (Optional)</label>
                                            <input
                                                value={newPlayerHouseNumber}
                                                onChange={e => setNewPlayerHouseNumber(e.target.value)}
                                                placeholder="House Number"
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

                            {/* Import Players */}
                            <div style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => { setShowImport(v => !v); setImportMessage(''); }}>
                                    <h3 style={{ margin: 0, color: 'var(--accent)' }}>⬆️ Import Players (CSV)</h3>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>{showImport ? '▲' : '▼'}</span>
                                </div>

                                {showImport && (
                                    <div style={{ marginTop: '1.25rem' }}>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                            Paste or upload a CSV/TSV file with columns in this order: <strong>Name, Email, Phone, Handicap Index</strong>. Email, phone and handicap are optional.
                                        </p>
                                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                                            <label className="btn-outline" style={{ padding: '6px 14px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                                📂 Upload file
                                                <input type="file" accept=".csv,.tsv,.txt" onChange={handleImportFile} style={{ display: 'none' }} />
                                            </label>
                                        </div>
                                        <textarea
                                            rows={5}
                                            placeholder={`John Smith, john@example.com, 555-1234, 12.4\nJane Doe, , , 5.1`}
                                            value={importText}
                                            onChange={e => handleImportTextChange(e.target.value)}
                                            style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }}
                                        />

                                        {importPreview.length > 0 && (
                                            <div style={{ marginTop: '1rem' }}>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{importPreview.length} player(s) ready to import:</div>
                                                <div style={{ overflowX: 'auto' }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                                        <thead>
                                                            <tr style={{ color: 'var(--accent)', borderBottom: '1px solid var(--glass-border)' }}>
                                                                <th style={{ padding: '6px 8px', textAlign: 'left' }}>Name</th>
                                                                <th style={{ padding: '6px 8px', textAlign: 'left' }}>Email</th>
                                                                <th style={{ padding: '6px 8px', textAlign: 'left' }}>Phone</th>
                                                                <th style={{ padding: '6px 8px', textAlign: 'left' }}>HCP</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {importPreview.map((p, i) => (
                                                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                                    <td style={{ padding: '5px 8px' }}>{p.name}</td>
                                                                    <td style={{ padding: '5px 8px', color: 'var(--text-muted)' }}>{p.email || '—'}</td>
                                                                    <td style={{ padding: '5px 8px', color: 'var(--text-muted)' }}>{p.phone || '—'}</td>
                                                                    <td style={{ padding: '5px 8px' }}>{p.handicapIndex || '0'}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <button
                                                    onClick={handleImportPlayers}
                                                    disabled={importingPlayers}
                                                    className="btn"
                                                    style={{ marginTop: '1rem' }}
                                                >
                                                    {importingPlayers ? 'Importing...' : `Import ${importPreview.length} Player(s)`}
                                                </button>
                                            </div>
                                        )}
                                        {importMessage && <p style={{ marginTop: '0.75rem', color: importMessage.includes('✅') ? 'var(--accent)' : '#ff6b6b', fontWeight: 'bold' }}>{importMessage}</p>}
                                    </div>
                                )}
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
                                                padding: '10px',
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: 'var(--radius)'
                                            }}>
                                                {editingPlayerId === player.id ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>Name</label>
                                                                <input
                                                                    value={editPlayerForm.name}
                                                                    onChange={e => setEditPlayerForm({ ...editPlayerForm, name: e.target.value })}
                                                                    style={{ width: '100%', padding: '6px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '0.9rem' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>Email</label>
                                                                <input
                                                                    type="email"
                                                                    value={editPlayerForm.email}
                                                                    onChange={e => setEditPlayerForm({ ...editPlayerForm, email: e.target.value })}
                                                                    placeholder="Optional"
                                                                    style={{ width: '100%', padding: '6px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '0.9rem' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>Phone</label>
                                                                <input
                                                                    type="tel"
                                                                    value={editPlayerForm.phone}
                                                                    onChange={e => setEditPlayerForm({ ...editPlayerForm, phone: e.target.value })}
                                                                    placeholder="Optional"
                                                                    style={{ width: '100%', padding: '6px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '0.9rem' }}
                                                                />
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>Handicap Index</label>
                                                                <input
                                                                    type="number"
                                                                    step="0.1"
                                                                    value={editPlayerForm.handicapIndex}
                                                                    onChange={e => setEditPlayerForm({ ...editPlayerForm, handicapIndex: e.target.value })}
                                                                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>Room #</label>
                                                                <input
                                                                    value={editPlayerForm.roomNumber}
                                                                    onChange={e => setEditPlayerForm({ ...editPlayerForm, roomNumber: e.target.value })}
                                                                    placeholder="Optional"
                                                                    style={{ width: '100%', padding: '6px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '0.9rem' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>House #</label>
                                                                <input
                                                                    value={editPlayerForm.houseNumber}
                                                                    onChange={e => setEditPlayerForm({ ...editPlayerForm, houseNumber: e.target.value })}
                                                                    placeholder="Optional"
                                                                    style={{ width: '100%', padding: '6px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '0.9rem' }}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.2rem' }}>
                                                            <input
                                                                type="checkbox"
                                                                id={`manager-${player.id}`}
                                                                checked={editPlayerForm.isManager}
                                                                onChange={e => setEditPlayerForm({ ...editPlayerForm, isManager: e.target.checked })}
                                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                            />
                                                            <label htmlFor={`manager-${player.id}`} style={{ fontSize: '0.9rem', color: 'var(--accent)', cursor: 'pointer', fontWeight: 'bold' }}>Tournament Manager</label>
                                                        </div>

                                                        {/* Per-course tee selectors */}
                                                        {courses.length > 0 && (
                                                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Tee Boxes</label>
                                                                {courses.map(course => {
                                                                    const cd = editPlayerForm.courseData?.[course.id] || {};
                                                                    const selectedTee = cd.tee || '';
                                                                    const teeOptions = Array.isArray(course.tees) ? course.tees : [];
                                                                    const teeInfo = teeOptions.find(t => t.name === selectedTee);
                                                                    const yardage = teeInfo?.yardage;
                                                                    return (
                                                                        <div key={course.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: '90px', flexShrink: 0 }}>{course.name}</span>
                                                                            <select
                                                                                value={selectedTee}
                                                                                onChange={e => setEditPlayerForm(prev => ({
                                                                                    ...prev,
                                                                                    courseData: { ...prev.courseData, [course.id]: { ...cd, tee: e.target.value } }
                                                                                }))}
                                                                                style={{ flex: 1, padding: '5px 8px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', fontSize: '0.85rem' }}
                                                                            >
                                                                                <option value="">Select tee</option>
                                                                                {teeOptions.map(t => (
                                                                                    <option key={t.name} value={t.name}>{t.name}</option>
                                                                                ))}
                                                                            </select>
                                                                            {yardage && (
                                                                                <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                                                                    {yardage.toLocaleString()} yds
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                            <button onClick={handleCancelEditPlayer} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Cancel</button>
                                                            <button onClick={() => handleSavePlayerEdit(player.id)} className="btn" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>Save</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <div style={{ fontWeight: '500', color: 'var(--accent)' }}>{player.name}</div>
                                                                {player.isManager && (
                                                                    <span style={{
                                                                        background: 'var(--accent)',
                                                                        color: '#000',
                                                                        fontSize: '0.65rem',
                                                                        padding: '2px 6px',
                                                                        borderRadius: '10px',
                                                                        fontWeight: 'bold',
                                                                        textTransform: 'uppercase'
                                                                    }}>
                                                                        Manager
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', marginTop: '0.2rem' }}>
                                                                <span>HCP: {player.handicapIndex}</span>
                                                                {player.email && <span>📧 {player.email}</span>}
                                                                {player.phone && <span>📞 {player.phone}</span>}
                                                                {player.roomNumber && <span>🚪 Room: {player.roomNumber}</span>}
                                                                {player.houseNumber && <span>🏠 House: {player.houseNumber}</span>}
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button
                                                                onClick={() => handleEditPlayerClick(player)}
                                                                className="btn-outline"
                                                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeletePlayer(player.id, player.name)}
                                                                className="btn-outline"
                                                                style={{ borderColor: '#ff6b6b', color: '#ff6b6b', padding: '4px 10px', fontSize: '0.8rem' }}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                    }
                    {/* Branding Tab */}
                    {
                        activeTab === 'branding' && (
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

                                                        const dataUrl = canvas.toDataURL('image/png');
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

                                <div style={{ marginTop: '2rem' }}>
                                    <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 'bold' }}>Background Color</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                        {[
                                            { name: 'Forest (Original)', color: '#0a1a0f' },
                                            { name: 'Navy', color: '#0a122a' },
                                            { name: 'Burgundy', color: '#2a0a0b' },
                                            { name: 'Charcoal', color: '#1a1a1b' },
                                            { name: 'Slate', color: '#1e293b' },
                                            { name: 'Midnight', color: '#0f172a' },
                                            { name: 'Emerald', color: '#064e4b' },
                                            { name: 'Plum', color: '#2d1b36' },
                                            { name: 'Ocean', color: '#0c4a6e' }
                                        ].map((swatch) => (
                                            <div
                                                key={swatch.color}
                                                onClick={() => setBackgroundColor(swatch.color)}
                                                style={{
                                                    width: '45px',
                                                    height: '45px',
                                                    borderRadius: '8px',
                                                    backgroundColor: swatch.color,
                                                    cursor: 'pointer',
                                                    border: backgroundColor === swatch.color ? '3px solid var(--accent)' : '1px solid var(--glass-border)',
                                                    boxShadow: backgroundColor === swatch.color ? '0 0 10px var(--accent-glow)' : 'none',
                                                    transition: 'all 0.2s ease',
                                                    title: swatch.name
                                                }}
                                                title={swatch.name}
                                            />
                                        ))}
                                    </div>
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
                        )
                    }

                    {/* History Tab */}
                    {
                        activeTab === 'history' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
                                                padding: '10px',
                                                borderRadius: 'var(--radius)',
                                                border: '1px solid var(--glass-border)',
                                                background: 'var(--bg-dark)',
                                                color: 'var(--text-main)',
                                                fontSize: '1rem'
                                            }}
                                        />
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                            Save a complete snapshot of the current tournament (Settings, Players, Scores, Courses, Lodging, etc.) to the archives.
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <button
                                            onClick={handleSaveHistory}
                                            className="btn"
                                            disabled={savingHistory || !tripName.trim()}
                                            style={{ minWidth: '150px' }}
                                        >
                                            {savingHistory ? 'Archiving...' : 'Save Snapshot'}
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

                                <div className="card">
                                    <h3 style={{ marginBottom: '1.5rem' }}>Past Snapshots</h3>
                                    {loadingHistory ? (
                                        <p>Loading archives...</p>
                                    ) : historyArchives.length === 0 ? (
                                        <p style={{ color: 'var(--text-muted)' }}>No archives found for this tournament.</p>
                                    ) : (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                                        <th style={{ padding: '1rem' }}>Name</th>
                                                        <th style={{ padding: '1rem' }}>Date</th>
                                                        <th style={{ padding: '1rem' }}>Players</th>
                                                        <th style={{ padding: '1rem' }}>Rounds</th>
                                                        <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {historyArchives.map(archive => (
                                                        <tr key={archive.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>{archive.name}</td>
                                                            <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                                                                {new Date(archive.date).toLocaleDateString()}
                                                            </td>
                                                            <td style={{ padding: '1rem' }}>
                                                                {archive.data?.players?.length || 0}
                                                            </td>
                                                            <td style={{ padding: '1rem' }}>
                                                                {archive.data?.numberOfRounds || archive.data?.settings?.numberOfRounds || 0}
                                                            </td>
                                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                                <button
                                                                    onClick={() => handleRestoreArchive(archive.id, archive.name)}
                                                                    disabled={restoringHistory}
                                                                    style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: '0.5rem', fontWeight: 'bold', opacity: restoringHistory ? 0.5 : 1 }}
                                                                    title="Restore this snapshot"
                                                                >
                                                                    {restoringHistory ? '...' : 'Restore'}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteArchive(archive.id)}
                                                                    disabled={restoringHistory}
                                                                    style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: '0.5rem', opacity: restoringHistory ? 0.5 : 1 }}
                                                                    title="Delete archive"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    }

                    {/* Prizes Tab */}
                    {
                        activeTab === 'prizes' && (
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
                                                <div key={prize.id || idx} style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: `1px solid ${editingPrizeId === prize.id ? 'var(--accent)' : 'var(--glass-border)'}` }}>
                                                    {editingPrizeId === prize.id ? (
                                                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                                                            <input
                                                                value={editPrizeForm.title}
                                                                onChange={e => setEditPrizeForm({ ...editPrizeForm, title: e.target.value })}
                                                                placeholder="Prize Title"
                                                                style={{ padding: '8px 10px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                                            />
                                                            <textarea
                                                                value={editPrizeForm.description}
                                                                onChange={e => setEditPrizeForm({ ...editPrizeForm, description: e.target.value })}
                                                                placeholder="Description"
                                                                style={{ padding: '8px 10px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', minHeight: '70px', resize: 'vertical' }}
                                                            />
                                                            <input
                                                                value={editPrizeForm.value}
                                                                onChange={e => setEditPrizeForm({ ...editPrizeForm, value: e.target.value })}
                                                                placeholder="Value (e.g. $100)"
                                                                style={{ padding: '8px 10px', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                                            />
                                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                <button onClick={() => handleSavePrizeEdit(prize.id)} className="btn" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>Save</button>
                                                                <button onClick={handleCancelEditPrize} className="btn-outline" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>Cancel</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <h4 style={{ margin: 0, color: 'var(--accent)' }}>{prize.title}</h4>
                                                                <p style={{ margin: '0.2rem 0', fontSize: '0.9rem' }}>{prize.description}</p>
                                                                {prize.value && <p style={{ margin: 0, fontSize: '0.85rem', color: '#4ade80' }}>Value: {prize.value}</p>}
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                <button onClick={() => handleEditPrizeClick(prize)} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>Edit</button>
                                                                <button onClick={() => handleDeletePrize(prize.id)} className="btn-outline" style={{ borderColor: '#ff6b6b', color: '#ff6b6b', padding: '4px 10px', fontSize: '0.8rem' }}>Delete</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Closest to Pin */}
                                {(() => {
                                    const enabled = closestToPin.length > 0;
                                    const inputStyle = { padding: '8px 10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' };
                                    return (
                                        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>📍 Closest to Pin</h3>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                                    <input type="checkbox" checked={enabled} onChange={e => setClosestToPin(e.target.checked ? [{ courseId: courses[0]?.id || '', hole: 1 }] : [])} style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }} />
                                                    {enabled ? 'Enabled' : 'Disabled'}
                                                </label>
                                            </div>
                                            {enabled && (
                                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                                    {closestToPin.map((entry, i) => (
                                                        <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                            <select value={entry.courseId} onChange={e => setClosestToPin(closestToPin.map((c, ci) => ci === i ? { ...c, courseId: e.target.value } : c))} style={{ ...inputStyle, flex: 2, minWidth: '140px' }}>
                                                                <option value="">Select Course</option>
                                                                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                            </select>
                                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Hole</span>
                                                            <input type="number" min={1} max={18} value={entry.hole} onChange={e => setClosestToPin(closestToPin.map((c, ci) => ci === i ? { ...c, hole: parseInt(e.target.value) || 1 } : c))} style={{ ...inputStyle, width: '70px' }} />
                                                            <button onClick={() => setClosestToPin(closestToPin.filter((_, ci) => ci !== i))} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
                                                        </div>
                                                    ))}
                                                    <button onClick={() => setClosestToPin([...closestToPin, { courseId: courses[0]?.id || '', hole: 1 }])} className="btn-outline" style={{ width: 'fit-content', padding: '5px 12px', fontSize: '0.85rem' }}>+ Add Hole</button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* Long Drive */}
                                {(() => {
                                    const enabled = longDrive.length > 0;
                                    const inputStyle = { padding: '8px 10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' };
                                    return (
                                        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>💥 Long Drive</h3>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                                    <input type="checkbox" checked={enabled} onChange={e => setLongDrive(e.target.checked ? [{ courseId: courses[0]?.id || '', hole: 1 }] : [])} style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }} />
                                                    {enabled ? 'Enabled' : 'Disabled'}
                                                </label>
                                            </div>
                                            {enabled && (
                                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                                    {longDrive.map((entry, i) => (
                                                        <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                            <select value={entry.courseId} onChange={e => setLongDrive(longDrive.map((c, ci) => ci === i ? { ...c, courseId: e.target.value } : c))} style={{ ...inputStyle, flex: 2, minWidth: '140px' }}>
                                                                <option value="">Select Course</option>
                                                                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                            </select>
                                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Hole</span>
                                                            <input type="number" min={1} max={18} value={entry.hole} onChange={e => setLongDrive(longDrive.map((c, ci) => ci === i ? { ...c, hole: parseInt(e.target.value) || 1 } : c))} style={{ ...inputStyle, width: '70px' }} />
                                                            <button onClick={() => setLongDrive(longDrive.filter((_, ci) => ci !== i))} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
                                                        </div>
                                                    ))}
                                                    <button onClick={() => setLongDrive([...longDrive, { courseId: courses[0]?.id || '', hole: 1 }])} className="btn-outline" style={{ width: 'fit-content', padding: '5px 12px', fontSize: '0.85rem' }}>+ Add Hole</button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

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
                        )
                    }

                    {/* Payment Info Tab */}
                    {
                        activeTab === 'payment' && (
                            <div className="card">
                                <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Payment Info</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
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
                        )
                    }

                    {/* Courses Tab */}
                    {
                        activeTab === 'courses' && (
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
                                                                    
                                                                    // Ensure we have 18 holes in the handicaps array
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
                        )
                    }

                    {
                        activeTab === 'print' && (
                            <div className="card">
                                <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Print & Export</h2>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                                    Generate printable PDFs for your tournament materials.
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                    <div style={{ padding: '1.5rem', background: 'var(--bg-dark)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <h3 style={{ margin: 0, color: 'var(--accent)' }}>Cart Signs</h3>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Print out custom cart signs for all players.</p>
                                        <button className="btn" style={{ marginTop: 'auto' }} onClick={() => window.open(`/t/${tournamentId}/admin/print-cart-signs`, '_blank')}>Generate Cart Signs</button>
                                    </div>
                                    <div style={{ padding: '1.5rem', background: 'var(--bg-dark)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <h3 style={{ margin: 0, color: 'var(--accent)' }}>Scorecards</h3>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Print official scorecards with handicaps.</p>
                                        <button className="btn" style={{ marginTop: 'auto' }} onClick={() => window.open(`/t/${tournamentId}/admin/print-scorecards`, '_blank')}>Generate Scorecards</button>
                                    </div>
                                    <div style={{ padding: '1.5rem', background: 'var(--bg-dark)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <h3 style={{ margin: 0, color: 'var(--accent)' }}>Results</h3>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Print the final tournament leaderboard.</p>
                                        <button className="btn" style={{ marginTop: 'auto' }} onClick={() => window.open(`/t/${tournamentId}/leaderboard?print=true`, '_blank')}>Print Results</button>
                                    </div>
                                    <div style={{ padding: '1.5rem', background: 'var(--bg-dark)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <h3 style={{ margin: 0, color: 'var(--accent)' }}>Statistics</h3>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Print player statistics and hole-by-hole breakdown.</p>
                                        <button className="btn" style={{ marginTop: 'auto' }} onClick={() => window.open(`/t/${tournamentId}/stats?print=true`, '_blank')}>Print Statistics</button>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </div >
            </div >
        </div >
    );
}
