import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Users, Trophy, DollarSign, Crown, ArrowLeft } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function SuperAdminPage() {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email?.toLowerCase() || '';
    const allowedAdmins = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];

    // Ensure only Edmond or allowed super admins can view this page
    if (!session || (email !== 'edebeid@gmail.com' && !allowedAdmins.includes(email))) {
        return (
            <div className="container" style={{ padding: '6rem 20px', textAlign: 'center' }}>
                <h1 style={{ color: 'var(--accent)' }}>Access Denied</h1>
                <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>You do not have permission to view the Super Admin dashboard.</p>
                <Link href="/" className="btn" style={{ marginTop: '2rem', display: 'inline-block' }}>
                    Return Home
                </Link>
            </div>
        );
    }

    // Fetch Analytics Data
    const totalUsers = await prisma.user.count();
    const totalProUsers = await prisma.user.count({ where: { isPro: true } });
    const totalTournaments = await prisma.tournament.count();
    const totalPlayers = await prisma.player.count();

    // MRR Calculation
    const mrr = totalProUsers * 19;

    // Fetch Recent Activity
    const recentSignups = await prisma.user.findMany({
        take: 5,
        orderBy: { id: 'desc' },
        select: { id: true, name: true, email: true, isPro: true }
    });

    const recentTournaments = await prisma.tournament.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, createdAt: true, owner: { select: { name: true, email: true } } }
    });

    return (
        <div className="container fade-in" style={{ padding: '4rem 20px', maxWidth: '1200px', margin: '0 auto' }} >
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '2rem' }}>
                <ArrowLeft size={16} /> Back to App
            </Link>

            <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '0.5rem' }}>Super Admin Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1.1rem' }}>Welcome back, Master Admin. Here is how PinPlaced is performing today.</p>

            {/* Top Metrics Grid */}
            < div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>

                <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--text-main)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>Total Users</h3>
                        <Users size={24} color="var(--text-muted)" />
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{totalUsers}</div>
                </div>

                <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>Pro Subscribers</h3>
                        <Crown size={24} color="var(--accent)" />
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>{totalProUsers}</div>
                </div>

                <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--success)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>Estimated MRR</h3>
                        <DollarSign size={24} color="var(--success)" />
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)' }}>${mrr}/mo</div>
                </div>

                <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--text-main)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>Total Tournaments</h3>
                        <Trophy size={24} color="var(--text-muted)" />
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{totalTournaments}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>With {totalPlayers} total players</div>
                </div>

            </div >

            {/* Recent Activity Sections */}
            < div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>

                {/* Signups */}
                < div className="card" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>Recent Signups</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {recentSignups.map(u => (
                            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{u.name || 'Unknown'}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.email}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {u.isPro && <span style={{ background: 'rgba(212,175,55,0.2)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>PRO</span>}
                                </div>
                            </div>
                        ))}
                        {recentSignups.length === 0 && <span style={{ color: 'var(--text-muted)' }}>No recent signups.</span>}
                    </div>
                </div >

                {/* Tournaments */}
                < div className="card" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>Recent Tournaments</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {recentTournaments.map(t => (
                            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{t.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>By: {t.owner?.name || t.owner?.email}</div>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    {new Date(t.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                        {recentTournaments.length === 0 && <span style={{ color: 'var(--text-muted)' }}>No recent tournaments.</span>}
                    </div>
                </div >

            </div >

        </div >
    );
}
