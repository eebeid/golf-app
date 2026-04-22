"use client";

import React from 'react';
import { X, Check } from 'lucide-react';

export default function UpgradeModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    const handleCheckout = async () => {
        try {
            const res = await fetch('/api/stripe/checkout', { method: 'POST' });
            if (res.ok) {
                const { url } = await res.json();
                if (url) window.location.href = url;
            } else {
                alert('Failed to initiate checkout.');
            }
        } catch (error) {
            console.error(error);
            alert('Error initiating checkout.');
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '20px'
        }}>
            <div className="card" style={{
                maxWidth: '600px', width: '100%', padding: '30px', position: 'relative',
                background: 'linear-gradient(145deg, var(--bg-card), var(--bg-dark))',
                border: '1px solid var(--accent)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: '15px', right: '15px',
                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
                }}>
                    <X size={24} />
                </button>

                <h2 style={{ color: 'var(--accent)', fontSize: '2rem', textAlign: 'center', marginBottom: '10px' }}>
                    PinPlaced Pro
                </h2>
                <p style={{ textAlign: 'center', color: 'var(--text-main)', marginBottom: '30px', fontSize: '1.1rem' }}>
                    Unlock the full potential of your golf trip with PinPlaced Pro for just <strong style={{ color: 'var(--success)' }}>$19/mo</strong>.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                    <div style={{ background: 'var(--bg-dark)', padding: '20px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                        <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', marginBottom: '15px', color: 'var(--text-muted)' }}>Free</h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--success)" /> Up to 4 Players</li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--success)" /> 1 Tournament</li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--success)" /> Basic UI Access</li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.3 }}><X size={16} /> Live Leaderboards</li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.3 }}><X size={16} /> Photo Galleries</li>
                        </ul>
                    </div>
                    <div style={{ background: 'rgba(212, 175, 55, 0.05)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.5)' }}>
                        <h3 style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.3)', paddingBottom: '10px', marginBottom: '15px', color: 'var(--accent)' }}>Pro</h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--accent)" /> <strong>Unlimited Players</strong></li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--accent)" /> <strong>Unlimited Tournaments</strong></li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--accent)" /> <strong>Live Leaderboards</strong></li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--accent)" /> <strong>Photo Galleries & Chat</strong></li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="var(--accent)" /> Priority Support</li>
                        </ul>
                    </div>
                </div>

                <button
                    onClick={handleCheckout}
                    style={{ width: '100%', padding: '15px', fontSize: '1.2rem', fontWeight: 'bold' }}
                    className="btn"
                >
                    Upgrade for $19 / mo
                </button>

                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <a 
                        href="/#pricing" 
                        onClick={onClose}
                        style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textDecoration: 'none' }}
                    >
                        Have a beta tester code? <span style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Enter it here</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
