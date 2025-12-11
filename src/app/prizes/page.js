import { getData } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function PrizesPage() {
    const prizeGroups = await getData('prizes');

    return (
        <div className="fade-in">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <img
                    src="/images/trophy.png"
                    alt="Tournament Trophy"
                    style={{
                        width: '150px',
                        height: 'auto',
                        borderRadius: 'var(--radius)',
                        boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)'
                    }}
                />
            </div>
            <h1 className="section-title">Tournament Prizes</h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
                {prizeGroups.map((group, gIndex) => (
                    <div key={gIndex}>
                        <h2 style={{
                            color: 'var(--accent)',
                            fontSize: '2rem',
                            marginBottom: '2rem',
                            borderBottom: '1px solid var(--glass-border)',
                            paddingBottom: '1rem'
                        }}>
                            {group.course}
                        </h2>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{
                                width: '100%',
                                borderCollapse: 'separate',
                                borderSpacing: '0 0.5rem',
                                color: 'var(--text-main)'
                            }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--accent)', borderBottom: '1px solid var(--glass-border)' }}>Prize</th>
                                        <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--accent)', borderBottom: '1px solid var(--glass-border)' }}>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {group.prizes.map((prize, pIndex) => (
                                        <tr key={pIndex} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)' }}>
                                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>{prize.title}</td>
                                            <td style={{ padding: '1rem', borderTopRightRadius: 'var(--radius)', borderBottomRightRadius: 'var(--radius)' }}>{prize.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
