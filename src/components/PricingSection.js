"use client";

import React, { useState } from 'react';
import { Check, X, Zap, Crown, Gift } from 'lucide-react';
import Link from 'next/link';

export default function PricingSection({ session, isPro }) {
    const [isLoading, setIsLoading] = useState(null); // track which button is loading

    const handleCheckout = async (tier) => {
        setIsLoading(tier);
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
                setIsLoading(null);
            }
        } catch (error) {
            console.error(error);
            alert('Error initiating checkout.');
            setIsLoading(null);
        }
    };

    if (isPro) {
        return (
            <div style={{ marginTop: '4rem', padding: '2.5rem', textAlign: 'center', background: 'rgba(212, 175, 55, 0.08)', borderRadius: '16px', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                <Crown size={40} color="var(--accent)" style={{ marginBottom: '12px' }} />
                <h2 style={{ color: 'var(--accent)', fontSize: '1.8rem', marginBottom: '10px' }}>You're PinPlaced Pro 🏆</h2>
                <p style={{ color: 'var(--text-muted)' }}>You have unlimited access to all premium features across every tournament.</p>
            </div>
        );
    }

    const plans = [
        {
            id: 'free',
            icon: <Gift size={22} />,
            name: 'Free',
            price: '$0',
            period: '',
            accent: 'var(--text-muted)',
            description: 'Try it out with your first tournament.',
            features: [
                { text: 'Create 1 tournament', included: true },
                { text: 'Unlimited players', included: true },
                { text: 'Basic scoring & leaderboard', included: true },
                { text: 'Budget tracker & cost planners', included: true },
                { text: 'Printable PDFs & cart signs', included: false },
                { text: 'Custom branding & sponsor logos', included: false },
            ],
            cta: session ? 'Current Plan' : 'Start for Free',
            disabled: !!session,
            href: !session ? '/api/auth/signin' : null,
        },
        {
            id: 'event_pass',
            icon: <Zap size={22} />,
            name: 'Event Pass',
            price: '$19',
            period: 'one-time',
            accent: '#60a5fa',
            badge: 'Most Popular',
            description: 'One payment, one unforgettable tournament.',
            features: [
                { text: 'Printable PDFs & cart signs', included: true },
                { text: 'Budget tracker & cost planners', included: true },
                { text: 'Live scoring & leaderboard', included: true },
                { text: 'Never expires', included: true },
                { text: 'Custom branding & sponsor logos', included: false },
            ],
            cta: 'Get Event Pass',
        },
        {
            id: 'pro_annual',
            icon: <Crown size={22} />,
            name: 'Pro Annual',
            price: '$49',
            period: '/ yr',
            accent: 'var(--accent)',
            badge: 'Best Value',
            description: 'For leagues, clubs, and dedicated organizers.',
            features: [
                { text: 'Unlimited tournaments', included: true },
                { text: 'Printable PDFs & cart signs', included: true },
                { text: 'Custom branding & sponsor logos', included: true },
                { text: 'Budget tracker & cost planners', included: true },
                { text: 'Live scoring & leaderboard', included: true },
                { text: 'Priority support', included: true },
            ],
            cta: 'Go Pro Annual',
        },
    ];

    return (
        <div id="pricing" style={{ marginTop: '5rem', marginBottom: '3rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '2.5rem', color: 'var(--accent)', marginBottom: '1rem' }}>
                    Simple, Honest Pricing
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                    No monthly subscriptions you'll forget about. Pay once per trip or go annual for unlimited events.
                </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center', alignItems: 'stretch' }}>
                {plans.map(plan => {
                    const isSelected = plan.id === 'pro_annual'; // default highlight
                    return (
                        <div
                            key={plan.id}
                            className="card"
                            style={{
                                flex: '1 1 260px', maxWidth: '340px',
                                padding: '2rem',
                                borderRadius: '18px',
                                border: plan.id === 'pro_annual' ? `2px solid ${plan.accent}` : '1px solid var(--glass-border)',
                                background: plan.id === 'pro_annual'
                                    ? 'linear-gradient(145deg, var(--bg-card), var(--bg-dark))'
                                    : plan.id === 'event_pass'
                                        ? 'linear-gradient(145deg, rgba(96,165,250,0.06), var(--bg-dark))'
                                        : 'var(--bg-dark)',
                                boxShadow: plan.id === 'pro_annual' ? '0 10px 40px rgba(212,175,55,0.15)' : 'none',
                                transform: plan.id === 'pro_annual' ? 'scale(1.03)' : 'none',
                                display: 'flex', flexDirection: 'column', position: 'relative'
                            }}
                        >
                            {plan.badge && (
                                <div style={{
                                    position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)',
                                    background: plan.accent, color: plan.id === 'pro_annual' ? 'var(--bg-dark)' : '#000',
                                    padding: '4px 14px', borderRadius: '999px',
                                    fontSize: '0.72rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {plan.badge}
                                </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', color: plan.accent }}>
                                {plan.icon}
                                <h3 style={{ margin: 0, fontSize: '1.4rem', color: plan.accent }}>{plan.name}</h3>
                            </div>

                            <div style={{ marginBottom: '6px' }}>
                                <span style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>{plan.price}</span>
                                {plan.period && <span style={{ fontSize: '1rem', color: 'var(--text-muted)', marginLeft: '4px' }}>{plan.period}</span>}
                            </div>

                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{plan.description}</p>

                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
                                {plan.features.map(f => (
                                    <li key={f.text} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', opacity: f.included ? 1 : 0.35, fontSize: '0.9rem', color: f.included ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                        {f.included
                                            ? <Check size={16} color={plan.accent} style={{ flexShrink: 0, marginTop: 2 }} />
                                            : <X size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                                        }
                                        {f.text}
                                    </li>
                                ))}
                            </ul>

                            {plan.href ? (
                                <Link href={plan.href} className="btn" style={{
                                    display: 'block', textAlign: 'center',
                                    background: 'transparent', border: '1px solid var(--text-muted)',
                                    color: 'var(--text-main)', padding: '12px', marginTop: 'auto'
                                }}>
                                    {plan.cta}
                                </Link>
                            ) : plan.disabled ? (
                                <button disabled style={{
                                    width: '100%', padding: '12px', marginTop: 'auto',
                                    background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)',
                                    border: 'none', borderRadius: '8px', cursor: 'not-allowed', fontWeight: 600
                                }}>
                                    {plan.cta}
                                </button>
                            ) : !session ? (
                                <Link href="/api/auth/signin" className="btn" style={{
                                    display: 'block', textAlign: 'center', padding: '13px',
                                    fontSize: '1rem', fontWeight: 700, marginTop: 'auto',
                                    background: plan.id === 'event_pass' ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : undefined,
                                    border: 'none'
                                }}>
                                    Sign in to {plan.id === 'event_pass' ? 'Get Event Pass' : 'Upgrade'}
                                </Link>
                            ) : (
                                <button
                                    onClick={() => handleCheckout(plan.id)}
                                    disabled={isLoading === plan.id}
                                    className="btn"
                                    style={{
                                        width: '100%', padding: '13px', fontSize: '1rem', fontWeight: 700,
                                        marginTop: 'auto', opacity: isLoading === plan.id ? 0.7 : 1,
                                        background: plan.id === 'event_pass' ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : undefined,
                                        border: 'none'
                                    }}
                                >
                                    {isLoading === plan.id ? 'Redirecting...' : plan.id === 'event_pass' ? `⚡ ${plan.cta}` : `👑 ${plan.cta}`}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Features Comparison Table */}
            <div style={{ marginTop: '4rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)', fontSize: '0.95rem' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '2px solid var(--glass-border)' }}>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: 'bold', color: 'var(--text-main)' }}>Features</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)' }}>Free</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontWeight: 'bold', color: '#60a5fa' }}>Event Pass ($19)</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent)' }}>Pro Annual ($49)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { name: 'Tournaments Limit', free: '1 Event', pass: '1 Event', pro: 'Unlimited' },
                            { name: 'Max Players per Event', free: 'Unlimited', pass: 'Unlimited', pro: 'Unlimited' },
                            { name: 'Live Scoring & Leaderboard', free: '✅', pass: '✅', pro: '✅' },
                            { name: 'Budget & Cost Trackers', free: '✅', pass: '✅', pro: '✅' },
                            { name: 'Lodging & Accommodation Planner', free: '✅', pass: '✅', pro: '✅' },
                            { name: 'Printable PDFs (Cart Signs & Custom Scorecards)', free: '❌', pass: '✅', pro: '✅' },
                            { name: 'Custom Branding (Tournament Logo & Colors)', free: '❌', pass: '❌', pro: '✅' },
                            { name: 'Rotating Sponsor Showcase', free: '❌', pass: '❌', pro: '✅' },
                        ].map((row, idx) => (
                            <tr key={row.name} style={{ borderBottom: '1px solid var(--glass-border)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                                <td style={{ padding: '14px 16px', fontWeight: 'bold', color: 'var(--text-main)' }}>{row.name}</td>
                                <td style={{ padding: '14px 16px', textAlign: 'center', color: row.free === '❌' ? 'var(--text-muted)' : 'var(--text-main)' }}>{row.free}</td>
                                <td style={{ padding: '14px 16px', textAlign: 'center', color: row.pass === '❌' ? 'var(--text-muted)' : 'var(--text-main)' }}>{row.pass}</td>
                                <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--text-main)' }}>{row.pro}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Promo Code */}
            {!isPro && session && (
                <div style={{ marginTop: '3rem', textAlign: 'center', maxWidth: '400px', margin: '3rem auto 0' }}>
                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            Have a beta tester or promo code?
                        </p>
                        <PromoCodeRedeemer />
                    </div>
                </div>
            )}
        </div>
    );
}

function PromoCodeRedeemer() {
    const [code, setCode] = useState('');
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');

    const handleRedeem = async (e) => {
        e.preventDefault();
        if (!code.trim()) return;
        setStatus('loading');
        try {
            const res = await fetch('/api/user/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code.trim() })
            });
            const data = await res.json();
            if (res.ok) {
                setStatus('success');
                setMessage(data.message || 'Code redeemed successfully!');
                setTimeout(() => window.location.reload(), 1500);
            } else {
                setStatus('error');
                setMessage(data.error || 'Invalid code');
            }
        } catch {
            setStatus('error');
            setMessage('Network error, please try again.');
        }
    };

    if (status === 'success') {
        return <div style={{ color: 'var(--success)', fontWeight: 'bold' }}>{message}</div>;
    }

    return (
        <form onSubmit={handleRedeem} style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
            <input
                type="text"
                placeholder="Enter Code"
                value={code}
                onChange={e => setCode(e.target.value)}
                style={{
                    flex: 1, padding: '8px 12px', borderRadius: '8px',
                    border: '1px solid var(--glass-border)', background: 'var(--bg-dark)',
                    color: 'var(--text-main)', fontSize: '0.9rem'
                }}
            />
            <button type="submit" className="btn" disabled={status === 'loading'} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                {status === 'loading' ? '...' : 'Redeem'}
            </button>
            {status === 'error' && (
                <div style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '0.5rem', width: '100%', textAlign: 'center', position: 'absolute', bottom: '-22px', left: 0 }}>
                    {message}
                </div>
            )}
        </form>
    );
}
