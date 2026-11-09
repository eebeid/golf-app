import prisma from '@/lib/prisma';
import packageJson from '../../package.json';
import TournamentList from '@/components/TournamentList';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from 'next/link';
import AuthButton from '@/components/AuthButton';
import { isSuperAdmin } from "@/lib/admin";

import PricingSection from '@/components/PricingSection';

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
    const session = await getServerSession(authOptions);
    let isPro = false;
    let tournaments = [];
    let participantTournaments = [];

    if (session?.user?.id) {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                tournaments: {
                    include: { settings: true },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (user) {
            isPro = true; // All features open during Public Beta
            tournaments = user.tournaments;
        }

        if (session.user.email) {
            const playerRecords = await prisma.player.findMany({
                where: { 
                    email: {
                        equals: session.user.email,
                        mode: 'insensitive'
                    }
                },
                include: {
                    tournament: {
                        include: { settings: true }
                    }
                }
            });

            // Filter out null tournaments and tournaments the user already owns
            participantTournaments = playerRecords
                .filter(p => p.tournament && p.tournament.ownerId !== session.user.id)
                .map(p => p.tournament)
                // Deduplicate in case they are registered multiple times (rare but possible)
                .filter((t, index, self) => index === self.findIndex((t2) => t2.id === t.id));
        }
    }

    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
            <div className="hero-gradient-bg" />
            <div className="container fade-in" style={{ padding: '4rem 20px', maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <div className="fade-in" style={{ width: '260px', height: '260px', margin: '0 auto 1.5rem auto', animationDelay: '0.1s' }}>
                        <img
                            src="/images/pinplaced_dashboard_hero.jpg"
                            alt="PinPlaced Logo"
                            fetchPriority="high"
                            width={260}
                            height={260}
                            style={{
                                width: '260px',
                                height: '260px',
                                objectFit: 'cover',
                                borderRadius: '24px',
                                boxShadow: '0 16px 40px rgba(0,0,0,0.65), 0 0 25px rgba(212, 175, 55, 0.25)',
                                border: '1.5px solid rgba(212, 175, 55, 0.35)'
                            }}
                        />
                    </div>
                    <h1 className="text-gradient fade-in" style={{
                        fontFamily: 'var(--font-bodoni), serif',
                        fontSize: '3.5rem',
                        fontWeight: '700',
                        marginBottom: '0.8rem',
                        letterSpacing: '-0.02em',
                        lineHeight: '1.2',
                        animationDelay: '0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px'
                    }}>
                        PinPlaced
                        <span style={{
                            background: 'linear-gradient(135deg, var(--accent), #f59e0b)',
                            color: '#000',
                            fontSize: '0.9rem',
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                            lineHeight: 1,
                            fontFamily: 'sans-serif'
                        }}>
                            BETA
                        </span>
                    </h1>

                    <div className="fade-in" style={{ animationDelay: '0.25s', marginBottom: '1.5rem' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))',
                            border: '1px solid var(--accent)',
                            padding: '8px 20px',
                            borderRadius: '999px',
                            color: 'var(--accent)',
                            fontSize: '0.95rem',
                            fontWeight: 'bold',
                            boxShadow: '0 0 15px rgba(212,175,55,0.2)'
                        }}>
                            <span>🚀</span>
                            <span>Public Beta — All Pro Features Free & Unlocked!</span>
                        </div>
                    </div>

                    {!session ? (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3rem', animationDelay: '0.3s' }}>
                            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.3rem', lineHeight: '1.8', marginBottom: '2.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                    <strong>PinPlaced</strong> is the ultimate all-in-one golf tournament management platform. Designed for organizers and players alike, it streamlines everything from tee times and live leaderboards to lodging assignments and dinner tabs. Focus on your swing, and let PinPlaced handle the logistics.
                                </p>
                                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <Link href="/api/auth/signin" className="btn" style={{ padding: '16px 48px', fontSize: '1.3rem', boxShadow: '0 8px 24px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2)' }}>
                                        Sign In to Start
                                    </Link>
                                    <Link href="/guide" className="btn-outline glass-panel" style={{ padding: '16px 48px', fontSize: '1.3rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)' }}>
                                        📖 View User Guide
                                    </Link>
                                </div>
                            </div>

                            {/* Top 5 Features */}
                            <div className="fade-in" style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                                gap: '2rem',
                                width: '100%',
                                marginTop: '2rem',
                                animationDelay: '0.5s'
                            }}>
                                <div className="glass-panel" style={{ padding: '2rem 1.5rem', flex: '1 1 280px', maxWidth: '320px', textAlign: 'center' }}>
                                    <div className="icon-float" style={{ fontSize: '2.5rem', marginBottom: '1.2rem', display: 'inline-block' }}>🏆</div>
                                    <h3 style={{ color: 'var(--accent)', marginBottom: '0.8rem', fontSize: '1.3rem' }}>Live Leaderboards</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: '1.6' }}>
                                        Track real-time scores across the field with dynamic formats like Stroke Play, Stableford, and Ryder Cup.
                                    </p>
                                </div>
                                <div className="glass-panel" style={{ padding: '2rem 1.5rem', flex: '1 1 280px', maxWidth: '320px', textAlign: 'center' }}>
                                    <div className="icon-float" style={{ fontSize: '2.5rem', marginBottom: '1.2rem', display: 'inline-block' }}>📅</div>
                                    <h3 style={{ color: 'var(--accent)', marginBottom: '0.8rem', fontSize: '1.3rem' }}>Comprehensive Scheduling</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: '1.6' }}>
                                        Easily organize and distribute tee times, courses, and player pairings for every single round.
                                    </p>
                                </div>
                                <div className="glass-panel" style={{ padding: '2rem 1.5rem', flex: '1 1 280px', maxWidth: '320px', textAlign: 'center' }}>
                                    <div className="icon-float" style={{ fontSize: '2.5rem', marginBottom: '1.2rem', display: 'inline-block' }}>🏠</div>
                                    <h3 style={{ color: 'var(--accent)', marginBottom: '0.8rem', fontSize: '1.3rem' }}>Trip Logistics</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: '1.6' }}>
                                        Manage lodging, room assignments, restaurant voting, and automatically split dining bills in one place.
                                    </p>
                                </div>
                                <div className="glass-panel" style={{ padding: '2rem 1.5rem', flex: '1 1 280px', maxWidth: '320px', textAlign: 'center' }}>
                                    <div className="icon-float" style={{ fontSize: '2.5rem', marginBottom: '1.2rem', display: 'inline-block' }}>📊</div>
                                    <h3 style={{ color: 'var(--accent)', marginBottom: '0.8rem', fontSize: '1.3rem' }}>Player Profiles & Stats</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: '1.6' }}>
                                        Keep track of player handicaps, automatically pull course ratings, and view in-depth scoring statistics.
                                    </p>
                                </div>
                                <div className="glass-panel" style={{ padding: '2rem 1.5rem', flex: '1 1 280px', maxWidth: '320px', textAlign: 'center' }}>
                                    <div className="icon-float" style={{ fontSize: '2.5rem', marginBottom: '1.2rem', display: 'inline-block' }}>⚡</div>
                                    <h3 style={{ color: 'var(--accent)', marginBottom: '0.8rem', fontSize: '1.3rem' }}>Real-time Highlights</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: '1.6' }}>
                                        Keep the entire group engaged on the clubhouse TV with live feeds detecting eagles, birdies, and impressive streaks.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem', animationDelay: '0.3s' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', margin: 0 }}>
                                Welcome back, {session.user.name?.split(' ')[0] || 'Golfer'}! Manage your tournaments below.
                            </p>
                            <AuthButton />
                        </div>
                    )}
                </div>

            {/* Dashboard Content */}
            <div style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', margin: 0 }}>
                        {session ? 'My Tournaments' : 'Get Started'}
                    </h2>
                </div>

                {session && tournaments.length === 0 && participantTournaments.length === 0 && (
                    <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                        You haven't created or joined any tournaments yet.
                    </div>
                )}

                <TournamentList 
                    initialTournaments={tournaments} 
                    participantTournaments={participantTournaments} 
                    isPro={isPro} 
                />
            </div>

            {/* Grouped Features Table */}
            <div style={{ marginTop: '5rem', marginBottom: '3rem', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h2 style={{ fontSize: '2.2rem', color: 'var(--accent)', marginBottom: '0.8rem', fontFamily: 'var(--font-bodoni), serif' }}>
                        Features & Capabilities
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                        PinPlaced delivers tournament-grade tools for players and organizers alike, grouped by function.
                    </p>
                </div>

                <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid var(--glass-border)', background: 'var(--bg-card)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '2px solid var(--glass-border)' }}>
                                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 'bold', color: 'var(--accent)', width: '25%' }}>Category</th>
                                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 'bold', color: 'var(--text-main)', width: '25%' }}>Feature</th>
                                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 'bold', color: 'var(--text-muted)' }}>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                {
                                    category: "🏆 Tournament Play & Scoring",
                                    items: [
                                        { name: "Live Leaderboards", desc: "Track real-time scores across the field with formats like Stroke Play, Stableford, and Ryder Cup." },
                                        { name: "Pairings & Tee Times", desc: "Easily configure round-by-round player groupings, starting tee boxes, and schedules." },
                                        { name: "GHIN Integration", desc: "Sync official handicaps automatically and compute course handicap index adjustments instantly." },
                                        { name: "Printable Scorecards", desc: "Export professionally formatted, printable scorecard PDFs customized for each group." }
                                    ]
                                },
                                {
                                    category: "📅 Logistics & Trip Planners",
                                    items: [
                                        { name: "Accommodations & Rooms", desc: "Assign lodging arrangements, room selection details, and house configurations." },
                                        { name: "Restaurant Voting", desc: "Coordinate group dinners by polling participants on restaurants, dates, and times." },
                                        { name: "Cost Planner & Cost Sharing", desc: "Keep track of tournament budgets, dining tabs, payouts, and deposit collections." },
                                        { name: "Tee Sheets & Schedules", desc: "Outline entire daily trip schedules, courses, tee times, and post-round activities." }
                                    ]
                                },
                                {
                                    category: "⚡ Engagement & Customization",
                                    items: [
                                        { name: "Live Highlights Feed", desc: "Project eagles, birdies, and hot scoring streaks live onto clubhouse wide screens." },
                                        { name: "Custom Branding", desc: "Customize tournament logo displays and course-specific theme color settings." },
                                        { name: "Sponsor Showcases", desc: "Incorporate rotating partner logos on scoring menus, cart signs, and leaderboards." },
                                        { name: "Live Group Chat", desc: "Engage participants with a built-in messaging screen for smack talk and updates." }
                                    ]
                                }
                            ].map((group, groupIdx) => (
                                group.items.map((item, itemIdx) => (
                                    <tr 
                                        key={item.name} 
                                        style={{ 
                                            borderBottom: '1px solid var(--glass-border)', 
                                            background: groupIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                                            transition: 'background-color 0.2s ease'
                                        }}
                                    >
                                        {itemIdx === 0 && (
                                            <td 
                                                rowSpan={group.items.length} 
                                                style={{ 
                                                    padding: '20px', 
                                                    fontWeight: 'bold', 
                                                    color: 'var(--accent)', 
                                                    verticalAlign: 'top',
                                                    borderRight: '1px solid var(--glass-border)',
                                                    background: 'rgba(212,175,55,0.02)'
                                                }}
                                            >
                                                {group.category}
                                            </td>
                                        )}
                                        <td style={{ padding: '16px 20px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                                            {item.name}
                                        </td>
                                        <td style={{ padding: '16px 20px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                            {item.desc}
                                        </td>
                                    </tr>
                                ))
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <PricingSection session={session} isPro={isPro} />

            <div style={{ marginTop: '5rem', textAlign: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    <a href="mailto:support@blueechostudios.com" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                        Contact Support
                    </a>
                </div>
                {isSuperAdmin(session?.user?.email) && (
                    <Link href="/organizers" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
                        View All Registered Organizers
                    </Link>
                )}
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', opacity: 0.5 }}>
                    PinPlaced app created by Blue Echo Studios, LLC
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', opacity: 0.3 }}>
                    v{packageJson.version}
                </div>
            </div>
        </div>
        </div>
    );
}
