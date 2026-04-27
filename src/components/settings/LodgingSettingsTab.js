import React, { useState, useEffect } from 'react';

export default function LodgingSettingsTab({ tournamentId, players }) {
    const [lodgings, setLodgings] = useState([]);
    const [lodgingForm, setLodgingForm] = useState({ name: '', unitNumber: '', address: '', url: '', notes: '', image: '' });
    const [savingLodging, setSavingLodging] = useState(false);
    const [lodgingSearch, setLodgingSearch] = useState('');
    const [lodgingPlaceResults, setLodgingPlaceResults] = useState([]);
    const [searchingLodgingPlaces, setSearchingLodgingPlaces] = useState(false);

    useEffect(() => {
        if (tournamentId) {
            fetchLodgings();
        }
    }, [tournamentId]);

    const fetchLodgings = async () => {
        try {
            const res = await fetch(`/api/lodging?tournamentId=${tournamentId}`);
            if (res.ok) setLodgings(await res.json());
        } catch (error) {
            console.error(error);
        }
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
        if (!window.confirm('Are you sure?')) return;
        try {
            const res = await fetch(`/api/lodging/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setLodgings(lodgings.filter(l => l.id !== id));
            } else {
                const data = await res.json();
                alert(`Failed to delete lodging: ${data.error || 'Unknown error'}`);
            }
        } catch (e) { 
            console.error(e); 
            alert('An unexpected error occurred while deleting.');
        }
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

    return (
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
                                    {l.url && <a href={l.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>Website</a>}

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
    );
}
