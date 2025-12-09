import { getData } from '@/lib/data';

export default async function PrizesPage() {
    const prizeGroups = await getData('prizes');

    return (
        <div className="fade-in">
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

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '2rem'
                        }}>
                            {group.prizes.map((prize, pIndex) => (
                                <div key={pIndex} className="card" style={{
                                    textAlign: 'center',
                                    padding: '2rem',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--glass-border)'
                                }}>
                                    <div style={{
                                        height: '150px',
                                        width: '150px',
                                        margin: '0 auto 1.5rem auto',
                                        borderRadius: '50%',
                                        overflow: 'hidden',
                                        border: '3px solid var(--accent)'
                                    }}>
                                        <img src={prize.image} alt={prize.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>

                                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>{prize.title}</h3>
                                    <p style={{ color: 'var(--text-muted)' }}>{prize.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
