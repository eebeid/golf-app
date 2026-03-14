"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Trophy, DollarSign, Crown, ArrowLeft, ExternalLink, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SuperAdminClient({
    totalUsers, totalProUsers, totalTournaments, totalPlayers, mrr,
    recentSignups, recentTournaments, allTournaments
}) {
    const [activeTab, setActiveTab] = useState('overview');
    const [analyticsData, setAnalyticsData] = useState([]);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch('/api/analytics');
                if (res.ok) {
                    const json = await res.json();
                    if (json.data) setAnalyticsData(json.data);
                }
            } catch (error) {
                console.error("Error loading analytics:", error);
            } finally {
                setAnalyticsLoading(false);
            }
        };

        if (activeTab === 'overview') {
            fetchAnalytics();
        }
    }, [activeTab]);

    return (
        <div className="container fade-in" style={{ padding: '4rem 20px', maxWidth: '1200px', margin: '0 auto' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '2rem' }}>
                <ArrowLeft size={16} /> Back to App
            </Link>

            <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '0.5rem' }}>Super Admin Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.1rem' }}>Welcome back, Master Admin. Here is how the application is performing today.</p>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '3rem' }}>
                <button
                    onClick={() => setActiveTab('overview')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'overview' ? 'var(--accent)' : 'var(--text-muted)',
                        fontWeight: activeTab === 'overview' ? 'bold' : 'normal',
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        padding: '0.5rem 1rem',
                        borderBottom: activeTab === 'overview' ? '2px solid var(--accent)' : '2px solid transparent'
                    }}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('tournaments')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'tournaments' ? 'var(--accent)' : 'var(--text-muted)',
                        fontWeight: activeTab === 'tournaments' ? 'bold' : 'normal',
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        padding: '0.5rem 1rem',
                        borderBottom: activeTab === 'tournaments' ? '2px solid var(--accent)' : '2px solid transparent'
                    }}
                >
                    All Tournaments
                </button>
            </div>

            {activeTab === 'overview' && (
                <>
                    {/* Top Metrics Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
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
                    </div>

                    {/* Google Analytics Chart */}
                    <div className="card" style={{ padding: '2rem', marginBottom: '4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                            <Activity size={24} color="var(--accent)" />
                            <h3 style={{ margin: 0 }}>Traffic Overview (Last 30 Days)</h3>
                        </div>
                        <div style={{ width: '100%', height: 350 }}>
                            {analyticsLoading ? (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                    Loading Google Analytics...
                                </div>
                            ) : analyticsData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={analyticsData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                                        <YAxis stroke="var(--text-muted)" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                                            itemStyle={{ color: 'var(--text-main)' }}
                                        />
                                        <Line type="monotone" name="Page Views" dataKey="views" stroke="var(--accent)" strokeWidth={3} dot={{ r: 4, fill: "var(--accent)" }} activeDot={{ r: 8 }} />
                                        <Line type="monotone" name="Active Users" dataKey="users" stroke="var(--success)" strokeWidth={3} dot={{ r: 4, fill: "var(--success)" }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                    Analytics data unavialable. Is GA configured in environment variables?
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Activity Sections */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                        {/* Signups */}
                        <div className="card" style={{ padding: '2rem' }}>
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
                        </div>

                        {/* Tournaments */}
                        <div className="card" style={{ padding: '2rem' }}>
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
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'tournaments' && (
                <div className="card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
                    <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>All Tournaments Directory</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)' }}>
                                <th style={{ padding: '1rem 0.5rem' }}>Name</th>
                                <th style={{ padding: '1rem 0.5rem' }}>Created</th>
                                <th style={{ padding: '1rem 0.5rem' }}>Owner</th>
                                <th style={{ padding: '1rem 0.5rem' }}>Players</th>
                                <th style={{ padding: '1rem 0.5rem' }}>Courses</th>
                                <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allTournaments.map(t => (
                                <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem 0.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                                        {t.name}
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                                            ID: {t.slug}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>
                                        {new Date(t.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>
                                        <div style={{ color: t.owner ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                            {t.owner?.name || 'Anonymous'}
                                        </div>
                                        {t.owner?.email && (
                                            <div style={{ fontSize: '0.85rem' }}>{t.owner.email}</div>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem 0.5rem' }}>
                                        {t._count?.players || 0}
                                    </td>
                                    <td style={{ padding: '1rem 0.5rem' }}>
                                        {t._count?.courses || 0}
                                    </td>
                                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                                        <Link href={`/t/${t.slug}/admin/settings`} target="_blank" className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                                            Go to Admin <ExternalLink size={14} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {allTournaments.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No tournaments found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
