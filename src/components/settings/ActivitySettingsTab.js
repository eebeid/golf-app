import React, { useState, useEffect } from 'react';

export default function ActivitySettingsTab({ tournamentId, players }) {
    const [activities, setActivities] = useState([]);
    const [activityForm, setActivityForm] = useState({
        title: '',
        icon: '',
        date: '',
        endTime: '',
        location: '',
        cost: '',
        minPeople: 0,
        maxPeople: '',
        reservationsRequired: false,
        venmoLink: '',
        category: 'Outing',
        description: ''
    });
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        if (tournamentId) {
            fetchActivities();
        }
    }, [tournamentId]);

    const fetchActivities = async () => {
        try {
            const res = await fetch(`/api/activities?tournamentId=${tournamentId}`);
            if (res.ok) setActivities(await res.json());
        } catch (error) {
            console.error('Error fetching activities:', error);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);

        // Format dates correctly for Postgres
        const payload = {
            ...activityForm,
            tournamentId,
            date: activityForm.date ? new Date(activityForm.date).toISOString() : null,
            endTime: activityForm.endTime ? new Date(activityForm.endTime).toISOString() : null,
            cost: activityForm.cost !== '' ? parseFloat(activityForm.cost) : null,
            minPeople: parseInt(activityForm.minPeople) || 0,
            maxPeople: activityForm.maxPeople !== '' ? parseInt(activityForm.maxPeople) : null
        };

        try {
            if (editingId) {
                const res = await fetch(`/api/activities/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    const updated = await res.json();
                    setActivities(activities.map(a => a.id === editingId ? updated : a));
                    resetForm();
                } else {
                    alert('Failed to update activity');
                }
            } else {
                const res = await fetch('/api/activities', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    const created = await res.json();
                    setActivities([...activities, created]);
                    resetForm();
                } else {
                    alert('Failed to create activity');
                }
            }
        } catch (error) {
            console.error('Save activity error:', error);
            alert('Error saving activity');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (activity) => {
        // Format ISO strings back to local datetime format (YYYY-MM-DDThh:mm)
        const formatDateForInput = (isoString) => {
            if (!isoString) return '';
            const d = new Date(isoString);
            const pad = (num) => num.toString().padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };

        setActivityForm({
            title: activity.title || '',
            icon: activity.icon || '',
            date: formatDateForInput(activity.date),
            endTime: formatDateForInput(activity.endTime),
            location: activity.location || '',
            cost: activity.cost ?? '',
            minPeople: activity.minPeople ?? 0,
            maxPeople: activity.maxPeople ?? '',
            reservationsRequired: !!activity.reservationsRequired,
            venmoLink: activity.venmoLink || '',
            category: activity.category || 'Outing',
            description: activity.description || ''
        });
        setEditingId(activity.id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this activity? This will remove all player RSVPs.')) return;
        try {
            const res = await fetch(`/api/activities/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setActivities(activities.filter(a => a.id !== id));
            } else {
                alert('Failed to delete activity');
            }
        } catch (error) {
            console.error('Error deleting activity:', error);
            alert('Error deleting activity');
        }
    };

    const resetForm = () => {
        setActivityForm({
            title: '',
            icon: '',
            date: '',
            endTime: '',
            location: '',
            cost: '',
            minPeople: 0,
            maxPeople: '',
            reservationsRequired: false,
            venmoLink: '',
            category: 'Outing',
            description: ''
        });
        setEditingId(null);
    };

    return (
        <div className="card">
            <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Interactive Activities</h2>

            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Existing Activities</h3>
                {activities.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No activities added yet.</p>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {activities.map(a => (
                            <div key={a.id} style={{ display: 'flex', gap: '1rem', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '1.2rem' }}>{a.icon || '📅'}</span> {a.title}
                                    </h4>
                                    <p style={{ margin: '0.2rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                        Category: {a.category} • Location: {a.location || 'N/A'}
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        <div>
                                            📅 <strong>Start:</strong> {new Date(a.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                        </div>
                                        {a.endTime && (
                                            <div>
                                                📅 <strong>End:</strong> {new Date(a.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                            </div>
                                        )}
                                        {a.cost !== null && a.cost !== undefined && (
                                            <div>
                                                💵 <strong>Cost:</strong> ${a.cost}
                                            </div>
                                        )}
                                        <div>
                                            👥 <strong>Attendees:</strong> {a.signups?.length || 0} joined {a.maxPeople ? `/ ${a.maxPeople} max` : ''}
                                        </div>
                                        {a.venmoLink && (
                                            <div>
                                                🔗 <strong>Venmo:</strong> <a href={a.venmoLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>{a.venmoLink}</a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <button onClick={() => handleEdit(a)} className="btn-outline" style={{ height: 'fit-content', fontSize: '0.8rem' }}>Edit</button>
                                    <button onClick={() => handleDelete(a.id)} className="btn-outline" style={{ height: 'fit-content', borderColor: '#ff6b6b', color: '#ff6b6b', fontSize: '0.8rem' }}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>{editingId ? 'Edit Activity' : 'Add New Activity'}</h3>

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Title *</label>
                            <input
                                placeholder="Activity name (e.g. Boat Day)"
                                value={activityForm.title}
                                onChange={e => setActivityForm({ ...activityForm, title: e.target.value })}
                                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Icon / Emoji (Optional)</label>
                            <input
                                placeholder="e.g. 🚤"
                                value={activityForm.icon}
                                onChange={e => setActivityForm({ ...activityForm, icon: e.target.value })}
                                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Start Date & Time *</label>
                            <input
                                type="datetime-local"
                                value={activityForm.date}
                                onChange={e => setActivityForm({ ...activityForm, date: e.target.value })}
                                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>End Date & Time (Optional)</label>
                            <input
                                type="datetime-local"
                                value={activityForm.endTime}
                                onChange={e => setActivityForm({ ...activityForm, endTime: e.target.value })}
                                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Location / Venue</label>
                            <input
                                placeholder="Clubhouse, marina, or address..."
                                value={activityForm.location}
                                onChange={e => setActivityForm({ ...activityForm, location: e.target.value })}
                                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Category</label>
                            <select
                                value={activityForm.category}
                                onChange={e => setActivityForm({ ...activityForm, category: e.target.value })}
                                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', height: '42px' }}
                            >
                                <option value="Outing">Outing / Tour</option>
                                <option value="Food">Food & Drinks</option>
                                <option value="Sport">Sport / Golf</option>
                                <option value="Logistics">Logistics / Meeting</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Cost ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={activityForm.cost}
                                onChange={e => setActivityForm({ ...activityForm, cost: e.target.value })}
                                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Min Attendees Required</label>
                            <input
                                type="number"
                                value={activityForm.minPeople}
                                onChange={e => setActivityForm({ ...activityForm, minPeople: e.target.value })}
                                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Max Attendees Allowed</label>
                            <input
                                type="number"
                                placeholder="No limit"
                                value={activityForm.maxPeople}
                                onChange={e => setActivityForm({ ...activityForm, maxPeople: e.target.value })}
                                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Venmo Link / Username</label>
                        <input
                            placeholder="e.g. https://venmo.com/username"
                            value={activityForm.venmoLink}
                            onChange={e => setActivityForm({ ...activityForm, venmoLink: e.target.value })}
                            style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Description</label>
                        <textarea
                            placeholder="Add details, packing list, meeting location..."
                            value={activityForm.description}
                            onChange={e => setActivityForm({ ...activityForm, description: e.target.value })}
                            style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '4px', minHeight: '80px', fontFamily: 'inherit' }}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
                        <input
                            type="checkbox"
                            id="resReq"
                            checked={activityForm.reservationsRequired}
                            onChange={e => setActivityForm({ ...activityForm, reservationsRequired: e.target.checked })}
                            style={{ width: '18px', height: '18px' }}
                        />
                        <label htmlFor="resReq" style={{ fontSize: '0.9rem', userSelect: 'none', cursor: 'pointer' }}>Reservations Required?</label>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="submit" className="btn" disabled={saving} style={{ minWidth: '120px' }}>
                            {saving ? 'Saving...' : 'Save Activity'}
                        </button>
                        {editingId && (
                            <button type="button" onClick={resetForm} className="btn-outline">
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
