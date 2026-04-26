"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';

export default function PrintCartSignsPage() {
    const params = useParams();
    const tournamentId = params?.tournamentId;

    const [teeTimes, setTeeTimes] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedRound, setSelectedRound] = useState(1);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [scheduleRes, settingsRes] = await Promise.all([
                    fetch(`/api/schedule?tournamentId=${tournamentId}`),
                    fetch(`/api/settings?tournamentId=${tournamentId}`)
                ]);
                const scheduleData = await scheduleRes.json();
                const settingsData = await settingsRes.json();
                
                setTeeTimes(Array.isArray(scheduleData) ? scheduleData : []);
                setSettings(settingsData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (tournamentId) loadData();
    }, [tournamentId]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="container fade-in" style={{ padding: '2rem' }}>Loading...</div>;

    const rounds = settings?.numberOfRounds 
        ? Array.from({ length: settings.numberOfRounds }, (_, i) => i + 1) 
        : [1];

    const currentTeeTimes = teeTimes.filter(t => t.round === selectedRound).sort((a, b) => a.time.localeCompare(b.time));

    // A group has up to 4 players. Split into carts of 2.
    const carts = [];
    currentTeeTimes.forEach(group => {
        const players = group.players || [];
        for (let i = 0; i < players.length; i += 2) {
            carts.push({
                time: group.time,
                players: players.slice(i, i + 2)
            });
        }
    });

    return (
        <>
            <style jsx global>{`
                @media print {
                    /* Hide global nav banner, sticky nav, footer, floating sign-in */
                    nav,
                    footer,
                    nav + div,
                    [class*="floating"],
                    [class*="FloatingSignIn"] {
                        display: none !important;
                    }
                    /* The title banner div sits above <nav> — target it by its direct parent */
                    body > div > div:first-child,
                    div[style*="border-bottom: 1px solid var(--accent)"] {
                        display: none !important;
                    }
                    @page {
                        size: letter portrait;
                        margin: 0.5cm;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-container {
                        padding: 0 !important;
                        margin: 0 !important;
                        max-width: 100% !important;
                    }
                    .signs-wrapper {
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    /* Each .print-page holds exactly 2 signs and fills one sheet */
                    .print-page {
                        display: flex !important;
                        flex-direction: column !important;
                        width: 100% !important;
                        height: 100vh !important;
                        break-after: page !important;
                        page-break-after: always !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                    }
                    .print-page:last-child {
                        break-after: avoid !important;
                        page-break-after: avoid !important;
                    }
                    .cart-sign {
                        flex: 1 !important;
                        width: 100% !important;
                        height: 50% !important;
                        max-height: 50% !important;
                        border-radius: 0 !important;
                        border: none !important;
                        border-bottom: 2px dashed #bbb !important;
                        background: transparent !important;
                        margin: 0 !important;
                        padding: 1.5rem 2rem !important;
                        box-sizing: border-box !important;
                    }
                    .print-page .cart-sign:last-child {
                        border-bottom: none !important;
                    }
                    .cart-sign h1 {
                        color: black !important;
                    }
                    .cart-sign .sub-text {
                        color: #555 !important;
                    }
                    .cart-sign .player-name {
                        color: black !important;
                        border-bottom: 2px solid #ddd !important;
                    }
                    .cart-sign-logo {
                        max-height: 80px !important;
                    }
                }
                /* Screen styles */
                .print-page {
                    margin-bottom: 2rem;
                }
                .cart-sign {
                    background: var(--bg-card);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius);
                    margin-bottom: 2rem;
                    padding: 3rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }
                .cart-sign-logo {
                    max-width: 150px;
                    max-height: 150px;
                    margin-bottom: 1rem;
                    object-fit: contain;
                }
            `}</style>
            
            <div className="container print-container fade-in" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
                <div className="no-print" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Link href={`/t/${tournamentId}/admin/settings`} style={{ color: 'var(--text-muted)' }}>
                                <ArrowLeft size={24} />
                            </Link>
                            <h1 className="section-title" style={{ margin: 0 }}>Cart Signs</h1>
                        </div>
                        <button onClick={handlePrint} className="btn" disabled={carts.length === 0}>
                            <Printer size={18} style={{ marginRight: '8px' }} />
                            Print Cart Signs
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                        {rounds.map(r => (
                            <button
                                key={r}
                                onClick={() => setSelectedRound(r)}
                                className={selectedRound === r ? 'btn' : 'btn-outline'}
                                style={{ padding: '0.5rem 1.5rem' }}
                            >
                                Round {r}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="signs-wrapper">
                    {carts.length === 0 ? (
                        <div className="no-print card" style={{ textAlign: 'center', padding: '3rem' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '1rem' }}>No tee times scheduled for Round {selectedRound}.</p>
                            <Link href={`/t/${tournamentId}/admin/schedule`} className="btn">
                                Generate Schedule First
                            </Link>
                        </div>
                    ) : (
                        // Group into pairs — each pair prints on one page
                        Array.from({ length: Math.ceil(carts.length / 2) }, (_, pageIndex) => {
                            const pair = carts.slice(pageIndex * 2, pageIndex * 2 + 2);
                            return (
                                <div key={pageIndex} className="print-page">
                                    {pair.map((cart, i) => (
                                        <div key={i} className="cart-sign">
                                            {settings?.logoUrl && (
                                                <img src={settings.logoUrl} alt="Tournament Logo" className="cart-sign-logo" />
                                            )}
                                            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', margin: '0 0 1rem 0', color: 'var(--accent)' }}>
                                                {settings?.tournamentName || 'Tournament'}
                                            </h1>
                                            <div className="sub-text" style={{ fontSize: '1.5rem', marginBottom: '2rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                                                Round {selectedRound} • Tee Time: {cart.time}
                                            </div>
                                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                {cart.players.map((p, pi) => (
                                                    <div key={pi} className="player-name" style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-main)', borderBottom: '2px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
                                                        {p.name}
                                                    </div>
                                                ))}
                                                {/* Empty slot for solo player */}
                                                {cart.players.length === 1 && (
                                                    <div className="player-name" style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-main)', borderBottom: '2px solid var(--glass-border)', paddingBottom: '0.75rem', opacity: 0.2 }}>
                                                        Open Seat
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </>
    );
}
