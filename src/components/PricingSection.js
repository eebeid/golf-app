"use client";

import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import Link from 'next/link';

export default function PricingSection({ session, isPro }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleCheckout = async (tier) => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier })
            });
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
                <h2 style={{ fontSize: '2.5rem', color: 'var(--accent)', marginBottom: '1rem' }}>
                    Choose Your Plan
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                    Take your golf trips to the next level with dynamic formats, live leaderboards, and trip logistics.
                </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', alignItems: 'stretch' }}>
                {/* Free Tier */}
                <div className="card" style={{ flex: '1 1 250px', maxWidth: '350px', background: 'var(--bg-dark)', padding: '2.5rem', borderRadius: '16px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Free</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem', color: 'var(--text-main)' }}>$0</div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', fontSize: '1rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '15px', flexGrow: 1 }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={20} color="var(--success)" /> Create 1 event</li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={20} color="var(--success)" /> Up to 4 players</li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.4 }}><X size={20} /> Advanced tournament features</li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.4 }}><X size={20} /> Live leaderboards</li>
                    </ul>

                    {!session ? (
                        <Link href="/api/auth/signin" className="btn" style={{ display: 'block', textAlign: 'center', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-main)', padding: '12px', marginTop: 'auto' }}>
                            Start for Free
                        </Link>
                    ) : (
                        <button disabled style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: 'none', borderRadius: '8px', cursor: 'not-allowed', marginTop: 'auto' }}>
                            Current Plan
                        </button>
                    )}
                </div>

                {/* Event Pass Tier */}
                <div className="card" style={{ flex: '1 1 250px', maxWidth: '350px', background: 'var(--bg-card)', padding: '2.5rem', borderRadius: '16px', border: '1px solid var(--accent)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Event Pass</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem', color: 'var(--text-main)' }}>$39 <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>/ event</span></div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', fontSize: '1rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '15px', flexGrow: 1 }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={20} color="var(--success)" /> <strong>Full tournament features</strong></li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={20} color="var(--success)" /> Valid for 1 exclusive event</li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={20} color="var(--success)" /> Unlimited players</li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={20} color="var(--success)" /> Live leaderboards & scoring</li>
                    </ul>

                    {!session ? (
                        <Link href="/api/auth/signin" className="btn" style={{ display: 'block', textAlign: 'center', background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '12px', marginTop: 'auto' }}>
                            Sign in to Buy
                        </Link>
                    ) : (
                        <button onClick={() => handleCheckout('event_pass')} disabled={isLoading} className="btn" style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', marginTop: 'auto', opacity: isLoading ? 0.7 : 1 }}>
                            {isLoading ? 'Loading...' : 'Buy Pass'}
                        </button>
                    )}
                </div>

                {/* Pro Annual Tier */}
                <div className="card" style={{ flex: '1 1 250px', maxWidth: '350px', background: 'linear-gradient(145deg, var(--bg-card), var(--bg-dark))', padding: '2.5rem', borderRadius: '16px', border: '2px solid var(--accent)', boxShadow: '0 10px 40px rgba(212, 175, 55, 0.15)', position: 'relative', transform: 'scale(1.02)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: 'var(--bg-dark)', padding: '6px 16px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Most Popular
                    </div>

                    <h3 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: 'var(--accent)' }}>Pro Annual</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem', color: 'var(--text-main)' }}>$79 <span style={{ fontSize: '1.2rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>/ yr</span></div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', fontSize: '1rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '15px', flexGrow: 1 }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={20} color="var(--accent)" /> <strong>Unlimited events</strong></li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={20} color="var(--accent)" /> <strong>Everything in Event Pass</strong></li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={20} color="var(--accent)" /> Annual comprehensive planning</li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={20} color="var(--accent)" /> Priority support</li>
                    </ul>

                    {!session ? (
                        <Link href="/api/auth/signin" className="btn" style={{ display: 'block', textAlign: 'center', padding: '15px', fontSize: '1.1rem', fontWeight: 'bold', marginTop: 'auto' }}>
                            Sign in to Upgrade
                        </Link>
                    ) : (
                        <button
                            onClick={() => handleCheckout('pro_annual')}
                            disabled={isLoading}
                            className="btn"
                            style={{ width: '100%', padding: '15px', fontSize: '1.1rem', fontWeight: 'bold', opacity: isLoading ? 0.7 : 1, marginTop: 'auto' }}
                        >
                            {isLoading ? 'Redirecting...' : 'Upgrade Now'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
