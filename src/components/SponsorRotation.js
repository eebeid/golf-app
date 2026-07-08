"use client";

import React, { useState, useEffect } from 'react';

export default function SponsorRotation({ sponsorLogos, interval = 5000 }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        if (!sponsorLogos || sponsorLogos.length <= 1) return;
        const timer = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % sponsorLogos.length);
                setFade(true);
            }, 300); // match transition speed
        }, interval);

        return () => clearInterval(timer);
    }, [sponsorLogos, interval]);

    if (!Array.isArray(sponsorLogos) || sponsorLogos.length === 0) return null;

    return (
        <div className="no-print" style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.2rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderTop: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius)',
            marginTop: '2rem',
            textAlign: 'center',
            boxSizing: 'border-box'
        }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                Tournament Sponsor
            </span>
            <div style={{
                height: '55px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'opacity 0.3s ease-in-out',
                opacity: fade ? 1 : 0
            }}>
                <img
                    src={sponsorLogos[currentIndex]}
                    alt="Sponsor Logo"
                    style={{
                        maxHeight: '100%',
                        maxWidth: '220px',
                        objectFit: 'contain'
                    }}
                />
            </div>
        </div>
    );
}
