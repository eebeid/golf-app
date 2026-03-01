
import prisma from '@/lib/prisma';
import TournamentList from '@/components/TournamentList';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
    const session = await getServerSession(authOptions);
    let tournaments = [];

    if (session?.user?.id) {
        tournaments = await prisma.tournament.findMany({
            where: { ownerId: session.user.id },
            orderBy: { createdAt: 'desc' }
        });
    }

    return (
        <div className="container fade-in" style={{ padding: '4rem 20px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <div style={{ position: 'relative', width: '250px', height: '250px', margin: '0 auto 1.5rem auto' }}>
                    <Image
                        src="/images/logo.png"
                        alt="Golf App Logo"
                        fill
                        style={{ objectFit: 'contain' }}
                        priority
                    />
                </div>
                <h1 className="section-title">Golf Tournament Manager</h1>

                {!session ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', lineHeight: '1.6' }}>
                            The ultimate tool for organizing your golf trips. Track scores, manage schedules, and calculate leaderboards with ease.
                        </p>
                        <Link href="/api/auth/signin" className="btn" style={{ padding: '12px 32px', fontSize: '1.1rem' }}>
                            Sign In to Start
                        </Link>
                    </div>
                ) : (
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '2rem' }}>
                            Welcome back, {session.user.name?.split(' ')[0] || 'Golfer'}! Manage your tournaments below.
                        </p>
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

                {session && tournaments.length === 0 && (
                    <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                        You haven't created any tournaments yet.
                    </div>
                )}

                <TournamentList initialTournaments={tournaments} />
            </div>

            <div style={{ marginTop: '5rem', textAlign: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
                <Link href="/organizers" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
                    View All Registered Organizers
                </Link>
            </div>
        </div>
    );
}
