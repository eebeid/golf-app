"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Navigation() {
    const [isOpen, setIsOpen] = useState(false);
    const [settings, setSettings] = useState(null);
    const pathname = usePathname();

    useEffect(() => {
        // Fetch settings to determine page visibility
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => setSettings(data))
            .catch(err => console.error('Error fetching settings:', err));
    }, []);

    const allNavItems = [
        { name: 'Home', path: '/', visible: true },
        { name: 'Lodging', path: '/lodging', visible: settings?.showAccommodations !== false },
        { name: 'Courses', path: '/courses', visible: true },
        { name: 'Food', path: '/food', visible: settings?.showFood !== false },
        { name: 'Prizes', path: '/prizes', visible: true },
        { name: 'Players', path: '/players', visible: true },
        { name: 'Photos', path: '/photos', visible: !!settings?.showPhotos },
        { name: 'Leaderboard', path: '/leaderboard', visible: true },
        { name: 'Chat', path: 'https://groupme.com/join_group/112131184/5MyOtVkv', visible: true, target: '_blank' },
        { name: 'Scorecards', path: '/admin/scorecards', visible: true },
        { name: 'Settings', path: '/admin/settings', visible: true },
    ];

    const navItems = allNavItems.filter(item => item.visible);

    return (
        <nav className="glass-panel" style={{
            position: 'sticky',
            top: 20,
            zIndex: 100,
            margin: '0 20px',
            padding: '1rem 2rem'
        }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0 }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                    <div style={{ position: 'relative', width: '40px', height: '40px', overflow: 'hidden', borderRadius: '50%' }}>
                        <Image
                            src={settings?.logoUrl || "/images/williamsburg-logo.jpg"}
                            alt={settings?.tournamentName || "Williamsburg Championship"}
                            fill
                            style={{ objectFit: 'cover' }}
                        />
                    </div>
                    <span className="desktop-only" style={{ fontSize: '1.2rem' }}>
                        {settings?.tournamentName || "Williamsburg Championship"}
                    </span>
                </Link>

                {/* Desktop Menu */}
                <ul style={{ display: 'flex', gap: '2rem' }} className="desktop-menu">
                    {navItems.map((item) => (
                        <li key={item.path}>
                            <Link
                                href={item.path}
                                target={item.target}
                                rel={item.target === '_blank' ? "noopener noreferrer" : undefined}
                                style={{
                                    color: pathname === item.path ? 'var(--accent)' : 'var(--text-main)',
                                    fontWeight: pathname === item.path ? '600' : '400'
                                }}
                            >
                                {item.name}
                            </Link>
                        </li>
                    ))}
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
                </div>
            )}

            <style jsx>{`
        @media (max-width: 900px) {
          .desktop-menu, .desktop-only {
            display: none !important;
          }
          .mobile-btn {
            display: block !important;
          }
        }
      `}</style>
        </nav>
    );
}
