"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, ArrowRight, Loader2, AlertCircle, Sparkles } from 'lucide-react';

function JoinContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialCode = (searchParams.get('code') || searchParams.get('ppid') || '').toUpperCase();
    const errorParam = searchParams.get('error');

    const [code, setCode] = useState(initialCode);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(
        errorParam === 'not_found' && initialCode
            ? `No tournament found with code "${initialCode}". Please double check with your organizer.`
            : ''
    );

    const handleJoin = async (e) => {
        e.preventDefault();
        const clean = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
        if (!clean) return;

        setLoading(true);
        setErrorMessage('');

        try {
            const res = await fetch('/api/tournaments/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ppid: clean })
            });

            const data = await res.json();
            if (res.ok && data.tournament) {
                // Save access flag and redirect straight to tournament
                if (typeof window !== 'undefined') {
                    localStorage.setItem(`pinplaced_ppid_${data.tournament.id}`, clean);
                }
                router.push(`/t/${data.tournament.slug}`);
            } else {
                setErrorMessage(data.error || 'Tournament code not found. Please check with your leader.');
            }
        } catch (err) {
            console.error('Join error:', err);
            setErrorMessage('Unable to connect. Please check your internet connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1rem'
        }}>
            <div className="card glass-panel fade-in" style={{
                maxWidth: '460px',
                width: '100%',
                padding: '2.5rem 2rem',
                textAlign: 'center',
                border: '1px solid var(--accent)'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(212, 175, 55, 0.15)',
                    border: '2px solid var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem auto',
                    color: 'var(--accent)'
                }}>
                    <KeyRound size={30} />
                </div>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(212,175,55,0.1)', padding: '4px 12px', borderRadius: '20px', marginBottom: '0.75rem' }}>
                    <Sparkles size={14} color="var(--accent)" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em' }}>PINPLACED ID (PPID)</span>
                </div>

                <h1 style={{
                    fontFamily: 'var(--font-bodoni), serif',
                    fontSize: '1.8rem',
                    color: '#fff',
                    margin: '0 0 0.5rem 0'
                }}>
                    Enter Tournament PPID
                </h1>

                <p style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem',
                    marginBottom: '1.75rem',
                    lineHeight: '1.5'
                }}>
                    Got a tournament code from your trip leader? Enter it below to unlock the schedule, leaderboard, and live scoring.
                </p>

                {errorMessage && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 14px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid #ef4444',
                        borderRadius: '8px',
                        color: '#fca5a5',
                        fontSize: '0.85rem',
                        marginBottom: '1.25rem',
                        textAlign: 'left'
                    }}>
                        <AlertCircle size={18} style={{ flexShrink: 0 }} />
                        <span>{errorMessage}</span>
                    </div>
                )}

                <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="e.g. PEBBLE26"
                            maxLength={16}
                            autoFocus
                            required
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                fontSize: '1.4rem',
                                fontWeight: 700,
                                textAlign: 'center',
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                background: 'rgba(0,0,0,0.4)',
                                border: '2px solid rgba(212, 175, 55, 0.4)',
                                borderRadius: '10px',
                                color: 'var(--accent)',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !code.trim()}
                        className="btn"
                        style={{
                            width: '100%',
                            padding: '14px',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontWeight: 700
                        }}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Finding Tournament...
                            </>
                        ) : (
                            <>
                                Enter Tournament
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
                        ← Back to PinPlaced Home
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function JoinPage() {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading...</div>}>
            <JoinContent />
        </Suspense>
    );
}

