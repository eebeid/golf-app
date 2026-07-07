"use client";

import React, { useState } from 'react';

export default function SignupWizard({ playerId, activities, onSignupSuccess }) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isJoining, setIsJoining] = useState(false);

    if (!activities || activities.length === 0) return null;

    const currentActivity = activities[currentIndex];

    const handleStart = () => {
        setIsOpen(true);
        setCurrentIndex(0);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleSkip = () => {
        if (currentIndex < activities.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            handleClose();
        }
    };

    const handleJoin = async () => {
        if (!currentActivity) return;
        setIsJoining(true);
        try {
            const res = await fetch(`/api/activities/${currentActivity.id}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId })
            });

            if (res.ok) {
                const signupData = await res.json();
                onSignupSuccess(currentActivity.id, signupData);
                // If it was the last activity, close, else advance index
                if (currentIndex < activities.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                } else {
                    handleClose();
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(errData.error || 'Failed to join activity');
            }
        } catch (error) {
            console.error(error);
            alert("Failed to join. Please try again.");
        } finally {
            setIsJoining(false);
        }
    };

    const formatTime = (dateStr) => {
        return new Date(dateStr).toLocaleTimeString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    return (
        <>
            <button
                onClick={handleStart}
                className="btn"
                style={{
                    background: 'linear-gradient(135deg, var(--accent) 0%, #a8871d 100%)',
                    color: '#000',
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '1.05rem',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(212, 175, 55, 0.2)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.5rem'
                }}
            >
                ✨ Quick Signup Wizard ({activities.length})
            </button>

            {isOpen && currentActivity && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 0, 0, 0.75)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(8px)',
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        width: '100%',
                        maxWidth: '500px',
                        borderRadius: '16px',
                        padding: '2rem',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                        border: '1px solid var(--glass-border)',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem'
                    }}>
                        <button
                            onClick={handleClose}
                            style={{
                                position: 'absolute',
                                top: '1.2rem',
                                right: '1.2rem',
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                fontSize: '1.2rem',
                                transition: 'color 0.2s'
                            }}
                            onMouseOver={e => e.target.style.color = 'var(--text-main)'}
                            onMouseOut={e => e.target.style.color = 'var(--text-muted)'}
                        >
                            ✕
                        </button>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--accent)', margin: 0 }}>Signup Wizard</h2>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                {currentIndex + 1} of {activities.length}
                            </span>
                        </div>

                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            border: '1px solid var(--glass-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                        }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ fontSize: '2.5rem' }}>{currentActivity.icon || '📅'}</div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{currentActivity.title}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                        ⏰ {formatTime(currentActivity.date)}
                                        {currentActivity.location && ` • 📍 ${currentActivity.location}`}
                                    </div>
                                    {currentActivity.cost && (
                                        <div style={{ color: 'var(--accent)', fontWeight: 'bold', marginTop: '0.25rem', fontSize: '0.95rem' }}>
                                            💵 ${currentActivity.cost.toFixed(2)}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {currentActivity.description && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.4', margin: 0, borderTop: '1px solid var(--glass-border)', paddingTop: '0.8rem' }}>
                                    {currentActivity.description}
                                </p>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <button
                                onClick={handleSkip}
                                className="btn-outline"
                                style={{ flex: 1, padding: '0.8rem', fontWeight: 'bold' }}
                            >
                                Skip
                            </button>
                            <button
                                onClick={handleJoin}
                                className="btn"
                                disabled={isJoining}
                                style={{ flex: 1, padding: '0.8rem', fontWeight: 'bold', background: 'var(--accent)', color: '#000' }}
                            >
                                {isJoining ? 'Joining...' : 'Yes, count me in!'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
