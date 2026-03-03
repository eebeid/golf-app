"use client";

import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import Link from 'next/link';

export default function PricingSection({ session, isPro }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleCheckout = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/stripe/checkout', { method: 'POST' });
            if (res.ok) {
                const { url } = await res.json();
                if (url) window.location.href = url;
            } else {
                alert('Failed to initiate checkout.');
                setIsLoading(false);
            }
        } catch (error) {
            console.error(error);
            alert('Error initiating checkout.');
            setIsLoading(false);
        }
    };

    if (isPro) {
        return (
            <div style={{ marginTop: '4rem', padding: '2rem', textAlign: 'center', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                <h2 style={{ color: 'var(--accent)', fontSize: '1.8rem', marginBottom: '10px' }}>You are a PinPlaced Pro! 🏆</h2>
                <p style={{ color: 'var(--text-main)' }}>Thank you for subscribing. You have unlimited access to all premium features.</p>
            </div>
        );
    }

    return (
        <div style={{ marginTop: '5rem', marginBottom: '3rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '2.5rem', color: 'var(--accent)', marginBottom: '1rem', fontFamily: 'var(--font-brush), cursive' }}>
                    Unlock PinPlaced Pro
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                    Take your golf trips to the next level with unlimited tournaments, players, and live leaderboards.
                </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', alignItems: 'stretch' }}>
                {/* Free Tier */}
                <div className="card" style={{ flex: '1 1 300px', maxWidth: '400px', background: 'var(--bg-dark)', padding: '2.5rem', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                    <h3 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Free</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: 'var(--text-muted)' }}>$0 <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>/ mo</span></div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', fontSize: '1rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={20} color="var(--success)" /> Up to 4 Players</li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={20} color="var(--success)" /> 1 Tournament</li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={20} color="var(--success)" /> Basic UI Access</li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.4 }}><X size={20} /> Live Leaderboards</li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.4 }}><X size={20} /> Photo Galleries</li>
                    </ul>

                    {!session ? (
                        <Link href="/api/auth/signin" className="btn" style={{ display: 'block', textAlign: 'center', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-main)', padding: '12px' }}>
                            Start for Free
                        </Link>
                    ) : (
                        <button disabled style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: 'none', borderRadius: '8px', cursor: 'not-allowed' }}>
                            Current Plan
                        </button>
                    )}
                </div>

                {/* Pro Tier */}
                <div className="card" style={{ flex: '1 1 300px', maxWidth: '400px', background: 'linear-gradient(145deg, var(--bg-card), var(--bg-dark))', padding: '2.5rem', borderRadius: '16px', border: '1px solid var(--accent)', boxShadow: '0 10px 40px rgba(212, 175, 55, 0.15)', position: 'relative', transform: 'scale(1.02)' }}>
                    <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: 'var(--bg-dark)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Most Popular
                    </div>

                    <h3 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: 'var(--accent)' }}>Pro</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem', color: 'var(--text-main)' }}>$19 <span style={{ fontSize: '1.2rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>/ mo</span></div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', fontSize: '1rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={20} color="var(--accent)" /> <strong>Unlimited Players</strong></li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={20} color="var(--accent)" /> <strong>Unlimited Tournaments</strong></li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={20} color="var(--accent)" /> <strong>Live Leaderboards</strong></li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={20} color="var(--accent)" /> <strong>Photo Galleries & Chat</strong></li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={20} color="var(--accent)" /> Priority Support</li>
                    </ul>

                    {!session ? (
                        <Link href="/api/auth/signin" className="btn" style={{ display: 'block', textAlign: 'center', padding: '15px', fontSize: '1.1rem', fontWeight: 'bold' }}>
                            Sign in to Upgrade
                        </Link>
                    ) : (
                        <button
                            onClick={handleCheckout}
                            disabled={isLoading}
                            className="btn"
                            style={{ width: '100%', padding: '15px', fontSize: '1.1rem', fontWeight: 'bold', opacity: isLoading ? 0.7 : 1 }}
                        >
                            {isLoading ? 'Redirecting...' : 'Upgrade Now'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
