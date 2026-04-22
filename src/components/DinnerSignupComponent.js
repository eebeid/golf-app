"use client";

import { useState, useEffect } from 'react';
import { Users, Plus, Trash2 } from 'lucide-react';

export default function DinnerSignupComponent({ restaurantId, sessionName }) {
    const [signups, setSignups] = useState([]);
    const [name, setName] = useState(sessionName || '');
    const [attendees, setAttendees] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchSignups();
    }, [restaurantId]);

    const fetchSignups = async () => {
        try {
            const res = await fetch(`/api/restaurants/${restaurantId}/signup`);
            if (res.ok) {
                const data = await res.json();
                setSignups(data);
            }
        } catch (err) {
            console.error("Error fetching signups:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/restaurants/${restaurantId}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, attendees })
            });

            if (res.ok) {
                await fetchSignups();
                setName(sessionName || '');
                setAttendees(1);
                setShowForm(false);
            } else {
                alert("Failed to sign up.");
            }
        } catch (err) {
            console.error("Signup error:", err);
            alert("Error signing up.");
        } finally {
            setSubmitting(false);
        }
    };

    const totalAttendees = signups.reduce((sum, s) => sum + (s.attendees || 1), 0);

    return (
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={20} color="var(--accent)" />
                    Dinner Signups ({totalAttendees})
                </h3>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: 'var(--accent)', 
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                    }}
                >
                    {showForm ? 'Cancel' : <><Plus size={16} /> Sign Up</>}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSignup} className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Name</label>
                            <input 
                                type="text" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                placeholder="Your Name"
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Total Attendees (Including Guests)</label>
                            <input 
                                type="number" 
                                min="1"
                                value={attendees} 
                                onChange={(e) => setAttendees(parseInt(e.target.value) || 1)} 
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="btn" 
                            disabled={submitting}
                            style={{ width: '100%', padding: '10px' }}
                        >
                            {submitting ? 'Signing Up...' : 'Confirm Signup'}
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading signups...</p>
            ) : signups.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No one has signed up yet.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {signups.map((s) => (
                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', padding: '0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.03)' }}>
                            <span>{s.name}</span>
                            <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{s.attendees} {s.attendees === 1 ? 'Person' : 'People'}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
