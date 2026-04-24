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
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (user) {
            isPro = user.isPro;
            tournaments = user.tournaments;
        }

        if (session.user.email) {
            const playerRecords = await prisma.player.findMany({
                where: { email: session.user.email },
                include: { tournament: true }
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
        <div className="container fade-in" style={{ padding: '4rem 20px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <div style={{ width: '250px', height: '250px', margin: '0 auto 1.5rem auto' }}>
                    <img
                        src="/images/pinplaced_primary_logo_transparent.png"
                        alt="PinPlaced Logo"
                        style={{ width: '250px', height: '250px', objectFit: 'contain' }}
                    />
                </div>
                <h1 style={{
                    fontFamily: 'var(--font-bodoni), serif',
                    fontSize: '2.8rem',
                    fontWeight: '600',
                    color: 'var(--accent)',
                    marginBottom: '0.5rem',
                    letterSpacing: '-0.02em',
                    lineHeight: '1.1'
                }}
                >
                    PinPlaced
                </h1>

                {!session ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3rem' }}>
                        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                            <p style={{ color: 'var(--text-main)', fontSize: '1.25rem', lineHeight: '1.8', marginBottom: '2rem' }}>
                                <strong>PinPlaced</strong> is the ultimate all-in-one golf tournament management platform. Designed for organizers and players alike, it streamlines everything from tee times and live leaderboards to lodging assignments and dinner tabs. Focus on your swing, and let PinPlaced handle the logistics.
                            </p>
                            <Link href="/api/auth/signin" className="btn" style={{ padding: '14px 40px', fontSize: '1.2rem', display: 'inline-block' }}>
                                Sign In to Start
                            </Link>
                        </div>

                        {/* Top 5 Features */}
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            gap: '1.5rem',
                            width: '100%',
                            marginTop: '1rem'
                        }}>
                            <div className="glass-panel" style={{ padding: '1.5rem', flex: '1 1 280px', maxWidth: '300px', textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏆</div>
                                <h3 style={{ color: 'var(--accent)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>Live Leaderboards</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                    Track real-time scores across the field with dynamic formats like Stroke Play, Stableford, and Ryder Cup.
                                </p>
                            </div>
                            <div className="glass-panel" style={{ padding: '1.5rem', flex: '1 1 280px', maxWidth: '300px', textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📅</div>
                                <h3 style={{ color: 'var(--accent)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>Comprehensive Scheduling</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                    Easily organize and distribute tee times, courses, and player pairings for every single round.
                                </p>
                            </div>
                            <div className="glass-panel" style={{ padding: '1.5rem', flex: '1 1 280px', maxWidth: '300px', textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏠</div>
                                <h3 style={{ color: 'var(--accent)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>Trip Logistics</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                    Manage lodging, room assignments, restaurant voting, and automatically split dining bills in one place.
                                </p>
                            </div>
                            <div className="glass-panel" style={{ padding: '1.5rem', flex: '1 1 280px', maxWidth: '300px', textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
                                <h3 style={{ color: 'var(--accent)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>Player Profiles & Stats</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                    Keep track of player handicaps, automatically pull course ratings, and view in-depth scoring statistics.
                                </p>
                            </div>
                            <div className="glass-panel" style={{ padding: '1.5rem', flex: '1 1 280px', maxWidth: '300px', textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚡</div>
                                <h3 style={{ color: 'var(--accent)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>Real-time Highlights</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                    Keep the entire group engaged on the clubhouse TV with live feeds detecting eagles, birdies, and impressive streaks.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
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
    );
}
