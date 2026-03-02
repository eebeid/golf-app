
import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function OrganizersPage() {
    // Fetch all users who have signed up
    const users = await prisma.user.findMany({
        orderBy: { email: 'asc' },
        include: { _count: { select: { tournaments: true } } }
    });

    return (
        <div className="container fade-in" style={{ padding: '4rem 20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 className="section-title" style={{ margin: 0 }}>Registered Organizers</h1>
                <Link href="/" className="btn-outline">
                    Back to Home
                </Link>
            </div>

            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                A list of all organizers utilizing the PinPlaced.
            </p>

            <div className="glass-panel" style={{ padding: '0' }}>
                {users.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>No available organizers found.</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>Name</th>
                                <th style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>Email</th>
                                <th style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', textAlign: 'right' }}>Tournaments</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            {user.image && (
                                                <img
                                                    src={user.image}
                                                    alt={user.name}
                                                    style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                                                />
                                            )}
                                            <span>{user.name || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{user.email}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <span style={{
                                            background: 'var(--accent)',
                                            color: '#000',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontSize: '0.85rem',
                                            fontWeight: 'bold'
                                        }}>
                                            {user._count.tournaments}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
