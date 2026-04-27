import React, { useState, useEffect } from 'react';

export default function RestaurantSettingsTab({ tournamentId, players }) {
    const [restaurants, setRestaurants] = useState([]);
    const [restaurantForm, setRestaurantForm] = useState({ name: '', address: '', cuisine: '', url: '', phone: '', lat: '', lng: '', notes: '', payerId: '', paymentLink: '', splitCost: '', date: '' });
    const [savingRestaurant, setSavingRestaurant] = useState(false);
    const [editingRestaurantId, setEditingRestaurantId] = useState(null);
    const [restaurantSearch, setRestaurantSearch] = useState('');
    const [placeResults, setPlaceResults] = useState([]);
    const [searchingPlaces, setSearchingPlaces] = useState(false);

    useEffect(() => {
        if (tournamentId) {
            fetchRestaurants();
        }
    }, [tournamentId]);

    const fetchRestaurants = async () => {
        try {
            const res = await fetch(`/api/restaurants?tournamentId=${tournamentId}`);
            if (res.ok) setRestaurants(await res.json());
        } catch (error) { console.error(error); }
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
            date: restaurant.date || '',
            payerId: restaurant.payerId || ''
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
        if (!window.confirm('Are you sure?')) return;
        try {
            const res = await fetch(`/api/restaurants/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setRestaurants(restaurants.filter(r => r.id !== id));
            } else {
                const data = await res.json();
                alert(`Failed to delete restaurant: ${data.error || 'Unknown error'}`);
            }
        } catch (e) { 
            console.error(e); 
            alert('An unexpected error occurred while deleting.');
        }
    };

    return (
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
                                        style={{ padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s' }}
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
                                {/* Note: Split Cost was removed as it is not supported in the DB schema. If needed, please use the Notes field. */}
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
    );
}
