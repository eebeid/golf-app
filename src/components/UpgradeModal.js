"use client";

import React, { useState } from 'react';
import { X, Check, Zap, Crown } from 'lucide-react';

export default function UpgradeModal({ isOpen, onClose, tournamentId }) {
    const [selectedTier, setSelectedTier] = useState('event_pass');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const tiers = [
        {
            id: 'event_pass',
            icon: <Zap size={20} />,
            name: 'Event Pass',
            price: '$24',
            period: 'one-time',
            badge: null,
            description: 'Perfect for a single annual golf trip.',
            features: [
                'All Pro features for 1 tournament',
                'Sponsor logo showcase',
                'Printable PDFs & cart signs',
                'Budget tracker',
                'Live leaderboard',
                'Never expires',
            ],
            color: '#60a5fa',
        },
        {
            id: 'pro_annual',
            icon: <Crown size={20} />,
            name: 'Pro Annual',
            price: '$79',
            period: '/ yr',
            badge: 'Best Value',
            description: 'For serious coordinators who run multiple events.',
            features: [
                'Unlimited tournaments',
                'All Pro features on every event',
                'Sponsor logo showcase',
                'Priority support',
                'Early access to new features',
                'Perfect for clubs & leagues',
            ],
            color: 'var(--accent)',
        },
    ];

    const handleCheckout = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tier: selectedTier,
                    tournamentId: selectedTier === 'event_pass' ? tournamentId : undefined
                })
            });
            if (res.ok) {
                const { url } = await res.json();
                if (url) window.location.href = url;
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to initiate checkout.');
            }
        } catch (error) {
            console.error(error);
            alert('Error initiating checkout.');
        } finally {
            setIsLoading(false);
        }
    };

    const selected = tiers.find(t => t.id === selectedTier);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '20px'
        }}>
            <div className="card" style={{
                maxWidth: '640px', width: '100%', padding: '0', position: 'relative',
                background: 'linear-gradient(145deg, var(--bg-card), var(--bg-dark))',
                border: '1px solid var(--accent)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
                borderRadius: '20px', overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))',
                    padding: '28px 30px 20px', borderBottom: '1px solid var(--glass-border)',
                    position: 'relative'
                }}>
                    <button onClick={onClose} style={{
                        position: 'absolute', top: '16px', right: '16px',
                        background: 'var(--glass)', border: '1px solid var(--glass-border)',
                        borderRadius: '50%', width: 32, height: 32, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-muted)', cursor: 'pointer'
                    }}>
                        <X size={16} />
                    </button>
                    <div style={{ fontSize: '2rem', marginBottom: '4px' }}>⛳</div>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.7rem', margin: '0 0 6px' }}>
                        Unlock PinPlaced Pro
                    </h2>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
                        Choose the plan that fits your game
                    </p>
                </div>

                {/* Tier Selector */}
                <div style={{ padding: '24px 30px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {tiers.map(tier => (
                        <div
                            key={tier.id}
                            onClick={() => setSelectedTier(tier.id)}
                            style={{
                                border: `2px solid ${selectedTier === tier.id ? tier.color : 'var(--glass-border)'}`,
                                borderRadius: '14px',
                                padding: '16px 20px',
                                cursor: 'pointer',
                                background: selectedTier === tier.id ? `rgba(${tier.id === 'event_pass' ? '96,165,250' : '212,175,55'},0.08)` : 'var(--glass)',
                                transition: 'all 0.2s ease',
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '14px'
                            }}
                        >
                            {tier.badge && (
                                <div style={{
                                    position: 'absolute', top: '-11px', right: '16px',
                                    background: tier.color, color: '#000',
                                    padding: '3px 12px', borderRadius: '999px',
                                    fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.5px'
                                }}>
                                    {tier.badge}
                                </div>
                            )}

                            {/* Radio dot */}
                            <div style={{
                                width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                                border: `2px solid ${selectedTier === tier.id ? tier.color : 'var(--glass-border)'}`,
                                background: selectedTier === tier.id ? tier.color : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                            }}>
                                {selectedTier === tier.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#000' }} />}
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: selectedTier === tier.id ? tier.color : 'var(--text-main)', fontWeight: 700, fontSize: '1rem' }}>
                                        <span style={{ color: tier.color }}>{tier.icon}</span>
                                        {tier.name}
                                    </div>
                                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: tier.color }}>
                                        {tier.price} <span style={{ fontWeight: 400, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{tier.period}</span>
                                    </div>
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 10px' }}>{tier.description}</p>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {tier.features.map(f => (
                                        <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--glass)', padding: '3px 8px', borderRadius: '999px', border: '1px solid var(--glass-border)' }}>
                                            <Check size={10} color={tier.color} />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div style={{ padding: '0 30px 28px' }}>
                    <button
                        onClick={handleCheckout}
                        disabled={isLoading}
                        className="btn"
                        style={{
                            width: '100%', padding: '15px', fontSize: '1.1rem', fontWeight: 700,
                            opacity: isLoading ? 0.7 : 1,
                            background: selected?.id === 'event_pass'
                                ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                                : 'var(--accent)',
                            color: '#000',
                            border: 'none'
                        }}
                    >
                        {isLoading ? 'Redirecting to checkout...' : (
                            selected?.id === 'event_pass'
                                ? `⚡ Get Event Pass — ${selected.price}`
                                : `👑 Go Pro Annual — ${selected.price}/yr`
                        )}
                    </button>
                    <div style={{ marginTop: '12px', textAlign: 'center' }}>
                        <a
                            href="/#pricing"
                            onClick={onClose}
                            style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}
                        >
                            Have a promo code? <span style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Enter it here</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
