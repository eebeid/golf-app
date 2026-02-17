
import prisma from '@/lib/prisma';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function PrizesPage({ params }) {
    const { tournamentId } = params;

    const settings = await prisma.settings.findFirst({
        where: {
            tournament: {
                OR: [{ id: tournamentId }, { slug: tournamentId }]
            }
        }
    });

    const prizesTitle = settings?.prizesTitle || 'Tournament Prizes';
    const prizes = (settings?.prizes && Array.isArray(settings.prizes)) ? settings.prizes : [];

    return (
        <div className="fade-in">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <Image
                    src="/images/trophy.png"
                    alt="Tournament Trophy"
                    width={150}
                    height={150}
                    style={{
                        height: 'auto',
                        borderRadius: 'var(--radius)',
                        boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)'
                    }}
                />
            </div>
            <h1 className="section-title">{prizesTitle}</h1>

            {prizes.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No prizes announced yet.
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                    {prizes.map((prize, index) => (
                        <div key={index} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <h3 style={{ color: 'var(--accent)', margin: 0, fontSize: '1.3rem' }}>{prize.title}</h3>
                            <div style={{ fontSize: '1rem', color: 'var(--text-main)', flex: 1 }}>{prize.description}</div>
                            {prize.value && (
                                <div style={{
                                    marginTop: '1rem',
                                    paddingTop: '1rem',
                                    borderTop: '1px solid var(--glass-border)',
                                    color: '#4ade80',
                                    fontWeight: 'bold',
                                    fontSize: '1.1rem'
                                }}>
                                    {prize.value}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
