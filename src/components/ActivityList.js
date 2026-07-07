"use client";

import React, { useState } from 'react';
import { Clock, MapPin, Users, Check, DollarSign, CreditCard, ChevronDown, ChevronRight } from 'lucide-react';

export default function ActivityList({ activities: initialActivities, player, tournamentId, onSignupChange }) {
    const [activities, setActivities] = useState(initialActivities || []);
    const [loadingIds, setLoadingIds] = useState({});

    // We can update the parent when change happens, and also local state for immediate feedback
    const handleRsvp = async (activityId, isSignedUp) => {
        if (!player) {
            alert("You must be registered as a player in this tournament to RSVP for activities.");
            return;
        }

        setLoadingIds(prev => ({ ...prev, [activityId]: true }));
        try {
            const method = isSignedUp ? 'DELETE' : 'POST';
            const url = isSignedUp 
                ? `/api/activities/${activityId}/signup?playerId=${player.id}`
                : `/api/activities/${activityId}/signup`;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: isSignedUp ? undefined : JSON.stringify({ playerId: player.id })
            });

            if (res.ok) {
                let updatedSignups;
                if (isSignedUp) {
                    // Deleted: filter out the player
                    updatedSignups = (activities.find(a => a.id === activityId)?.signups || [])
                        .filter(s => s.playerId !== player.id);
                } else {
                    const newSignup = await res.json();
                    updatedSignups = [...(activities.find(a => a.id === activityId)?.signups || []), newSignup];
                }

                const updatedActivities = activities.map(a => {
                    if (a.id === activityId) {
                        return { ...a, signups: updatedSignups };
                    }
                    return a;
                });
                setActivities(updatedActivities);
                if (onSignupChange) {
                    onSignupChange(updatedActivities);
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(errData.error || 'Failed to update RSVP');
            }
        } catch (error) {
            console.error('RSVP error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setLoadingIds(prev => ({ ...prev, [activityId]: false }));
        }
    };

    const formatDateHeader = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateStr) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Calculate user specific stats
    const attendingActivities = activities.filter(a => 
        player && a.signups?.some(s => s.playerId === player.id)
    );
    const totalCost = attendingActivities.reduce((sum, a) => sum + (a.cost || 0), 0);

    // Group activities by date (local date comparison)
    const grouped = activities.reduce((acc, act) => {
        const dateKey = new Date(act.date).toLocaleDateString();
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(act);
        return acc;
    }, {});

    // Sort grouped keys by date chronologically
    const sortedGroupedKeys = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));

    return (
        <div>
            {player && (
                <div className="card glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem', padding: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>Welcome back, {player.name}! ⛳</h3>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            You are attending <strong>{attendingActivities.length}</strong> trip activities.
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            ${totalCost.toFixed(2)}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estimated Cost Tally</span>
                    </div>
                </div>
            )}

            {activities.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '1.1rem', margin: 0 }}>No activities scheduled for this tournament yet.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {sortedGroupedKeys.map(dateKey => {
                        const dayActivities = grouped[dateKey].sort((a, b) => new Date(a.date) - new Date(b.date));
                        const formattedHeader = formatDateHeader(dayActivities[0].date);

                        return (
                            <div key={dateKey} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                                    <h3 style={{ margin: 0, color: 'var(--accent)', fontSize: '1.2rem' }}>{formattedHeader}</h3>
                                </div>

                                <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                                    {dayActivities.map(a => {
                                        const isSignedUp = player ? a.signups?.some(s => s.playerId === player.id) : false;
                                        const attendeesNames = a.signups?.map(s => s.player?.name).filter(Boolean).join(', ') || '';
                                        const isFull = a.maxPeople ? (a.signups?.length || 0) >= a.maxPeople : false;
                                        const isPast = new Date(a.date) < new Date();

                                        return (
                                            <div key={a.id} className="card" style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '1rem',
                                                background: isSignedUp ? 'rgba(212, 175, 55, 0.04)' : 'var(--bg-card)',
                                                border: isSignedUp ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
                                                opacity: isPast ? 0.65 : 1,
                                                position: 'relative'
                                            }}>
                                                {/* Top info and RSVP button */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '2rem', minWidth: '40px', textAlign: 'center' }}>{a.icon || '📅'}</span>
                                                        <div>
                                                            <h4 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 'bold' }}>{a.title}</h4>
                                                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                                                                {a.category}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {player ? (
                                                        <button
                                                            onClick={() => handleRsvp(a.id, isSignedUp)}
                                                            disabled={loadingIds[a.id] || (isFull && !isSignedUp) || isPast}
                                                            className={isSignedUp ? 'btn' : 'btn-outline'}
                                                            style={{
                                                                padding: '6px 14px',
                                                                fontSize: '0.8rem',
                                                                whiteSpace: 'nowrap',
                                                                background: isSignedUp ? 'var(--accent)' : 'transparent',
                                                                color: isSignedUp ? '#000' : 'var(--text-main)',
                                                                opacity: isPast ? 0.5 : 1
                                                            }}
                                                        >
                                                            {loadingIds[a.id] ? '...' : (isSignedUp ? '✓ Joined' : (isFull ? 'Full' : 'Join'))}
                                                        </button>
                                                    ) : (
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sign in to RSVP</span>
                                                    )}
                                                </div>

                                                {/* Details */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)', borderTop: '1px solid var(--glass-border)', paddingTop: '0.8rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <Clock size={16} style={{ color: 'var(--accent)' }} />
                                                        <span>
                                                            {formatTime(a.date)}
                                                            {a.endTime && ` - ${formatTime(a.endTime)}`}
                                                        </span>
                                                    </div>

                                                    {a.location && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <MapPin size={16} style={{ color: 'var(--accent)' }} />
                                                            <span>{a.location}</span>
                                                        </div>
                                                    )}

                                                    {a.cost !== null && a.cost !== undefined && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500', color: 'var(--text-main)' }}>
                                                            <DollarSign size={16} style={{ color: 'var(--accent)' }} />
                                                            <span>${a.cost.toFixed(2)}</span>
                                                        </div>
                                                    )}

                                                    {a.description && (
                                                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                                            {a.description}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Attendees going */}
                                                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '0.8rem', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', width: '100%', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Users size={14} style={{ color: 'var(--accent)' }} />
                                                            <span>{a.signups?.length || 0} attending {a.maxPeople ? `(Limit ${a.maxPeople})` : ''}</span>
                                                        </div>

                                                        {a.venmoLink && isSignedUp && (
                                                            <a
                                                                href={a.venmoLink.startsWith('http') ? a.venmoLink : `https://venmo.com/${a.venmoLink.replace('@', '')}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{
                                                                    marginLeft: 'auto',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    color: 'var(--accent)',
                                                                    fontWeight: 'bold',
                                                                    textDecoration: 'none'
                                                                }}
                                                            >
                                                                <CreditCard size={14} /> Pay Venmo
                                                            </a>
                                                        )}
                                                    </div>

                                                    {attendeesNames && (
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={attendeesNames}>
                                                            {attendeesNames}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
