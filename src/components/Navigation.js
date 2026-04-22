
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Keep next/image for the logo
import { Menu, X, Edit3, Flag } from 'lucide-react'; // Add Edit3 for the Play icon
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import AuthButton from './AuthButton';

export default function Navigation({ tournamentId }) {
    const [isOpen, setIsOpen] = useState(false);
    const [settings, setSettings] = useState(null);
    const pathname = usePathname();
    const { data: session } = useSession();

    const basePath = tournamentId ? `/t/${tournamentId}` : '';
    const isAdmin = settings?.isAdmin || (session?.user?.id && settings?.ownerId && session.user.id === settings.ownerId);

    useEffect(() => {
        // Fetch settings to determine page visibility
        const fetchUrl = tournamentId
            ? `/api/settings?tournamentId=${tournamentId}`
            : '/api/settings';

        fetch(fetchUrl)
            .then(res => res.json())
            .then(data => setSettings(data))
            .catch(err => console.error('Error fetching settings:', err));
    }, [tournamentId]);

    const allNavItems = [
        { name: 'Lodging', path: `${basePath}/lodging`, visible: settings?.showAccommodations !== false },
        { name: 'Courses', path: `${basePath}/courses`, visible: settings?.showCourses !== false },
        { name: 'Schedule', path: `${basePath}/schedule`, visible: settings?.showSchedule !== false },
        { name: 'Restaurants', path: `${basePath}/food`, visible: settings?.showFood !== false },
        { name: 'Prizes', path: `${basePath}/prizes`, visible: settings?.showPrizes !== false },
        { name: 'Players', path: `${basePath}/players`, visible: settings?.showPlayers !== false },
        { name: 'Photos', path: `${basePath}/photos`, visible: !!settings?.showPhotos },
        { name: 'Leaderboard', path: `${basePath}/leaderboard`, visible: settings?.showLeaderboard !== false },
        { name: 'Stats', path: `${basePath}/stats`, visible: settings?.showStats !== false },
        { name: 'Recap', path: `${basePath}/recap`, visible: settings?.showStats !== false },
        { name: 'Chat', path: `${basePath}/chat`, visible: settings?.showChat !== false },
        { name: 'Scorecards', path: `${basePath}/admin/scorecards`, visible: settings?.showScorecards !== false },
        { name: 'Enter Scores', path: `${basePath}/admin/scores`, visible: settings?.showPlay !== false },
        { name: 'Pricing', path: `/#pricing`, visible: !tournamentId },
        { name: 'Settings', path: `${basePath}/admin/settings`, visible: isAdmin },
    ];

    const navItems = allNavItems.filter(item => item.visible);

    return (
        <>
            <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '15px 20px',
                textAlign: 'center',
                borderBottom: '1px solid var(--accent)',
                position: 'relative',
                zIndex: 101,
            }}>
                <h1 style={{
                    fontFamily: 'var(--font-bodoni), serif',
                    margin: 0,
                    color: 'var(--accent)',
                    fontSize: '1.8rem',
                    fontWeight: '600',
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                }}>
                    {settings?.tournamentName || "Golf Tournament"}
                </h1>
            </div>

            <nav className="glass-panel" style={{
                position: 'sticky',
                top: 20,
                zIndex: 100,
                margin: '20px',
                padding: '1rem 2rem'
            }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0 }}>
                    <Link href={basePath || '/'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)', textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', height: '64px', gap: '8px' }}>
                            <img
                                src={settings?.logoUrl || "/images/pinplaced_primary_logo_transparent.png"}
                                alt={settings?.tournamentName || "PinPlaced"}
                                style={{ width: 'auto', height: '48px', objectFit: 'contain' }}
                            />
                            {/* Brand name — show only if no custom tournament logo is set, OR on desktop */}
                            {!settings?.logoUrl && (
                                <span style={{
                                    fontFamily: 'var(--font-bodoni), serif',
                                    fontSize: '1.4rem',
                                    fontWeight: '600',
                                    letterSpacing: '-0.02em',
                                    display: 'block'
                                }}>
                                    PinPlaced
                                </span>
                            )}
                        </div>
                    </Link>

                    {/* Desktop Menu */}
                    <ul style={{ display: 'flex', gap: '2rem', marginLeft: '3rem' }} className="desktop-menu">
                        {navItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    href={item.path}
                                    target={item.target}
                                    rel={item.target === '_blank' ? "noopener noreferrer" : undefined}
                                    style={{
                                        color: item.highlight ? 'var(--accent)' : (pathname === item.path ? 'var(--accent)' : 'var(--text-main)'),
                                        fontWeight: item.highlight || pathname === item.path ? '600' : '400'
                                    }}
                                >
                                    {item.name}
                                </Link>
                            </li>
                        ))}
                        <li>
                            <AuthButton />
                        </li>
                    </ul>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-main)',
                            cursor: 'pointer',
                            display: 'none' // Hidden by default, shown in media query via CSS
                        }}
                        className="mobile-btn"
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {isOpen && (
                    <div
                        className="mobile-menu glass-panel"
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '10px',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                        }}
                    >
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                href={item.path}
                                target={item.target}
                                rel={item.target === '_blank' ? "noopener noreferrer" : undefined}
                                onClick={() => setIsOpen(false)}
                                style={{
                                    color: pathname === item.path ? 'var(--accent)' : 'var(--text-main)',
                                    fontSize: '1.1rem',
                                    padding: '0.5rem'
                                }}
                            >
                                {item.name}
                            </Link>
                        ))}

                        {session && (
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    signOut();
                                }}
                                style={{
                                    color: 'var(--text-main)',
                                    fontSize: '1.1rem',
                                    padding: '0.5rem',
                                    background: 'transparent',
                                    border: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    width: '100%',
                                    borderTop: '1px solid var(--glass-border)',
                                    marginTop: '0.5rem',
                                    paddingTop: '1rem'
                                }}
                            >
                                Sign Out
                            </button>
                        )}
                    </div>
                )}

                <style jsx>{`
                @media(max-width: 900px) {
                    .desktop-menu, .desktop-only {
                        display: none !important;
                    }
                    .mobile-btn {
                        display: block !important;
                    }
                }
            `}</style>
            </nav>
        </>
    );
}
