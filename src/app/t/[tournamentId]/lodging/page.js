import prisma from '@/lib/prisma';
import Image from 'next/image';

export default async function LodgingPage({ params }) {
    const slug = params.tournamentId;
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: { lodging: true }
    });

    const lodgings = tournament?.lodging || [];

    return (
        <div className="fade-in">
            <h1 className="section-title">Accommodations</h1>
            {lodgings.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No accommodations listed yet.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    {lodgings.map((place) => (
                        <div key={place.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            {place.image && (
                                <div style={{ height: '200px', width: '100%', position: 'relative' }}>
                                    <Image
                                        src={place.image}
                                        alt={place.name}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                    />
                                </div>
                            )}
                            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <h2 style={{ color: 'var(--accent)', marginBottom: '0.5rem', fontSize: '1.3rem' }}>{place.name}</h2>
                                {place.address && <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>{place.address}</p>}
                                {place.notes && <p style={{ marginBottom: '1.5rem', flex: 1 }}>{place.notes}</p>}

                                {place.url && (
                                    <div style={{ marginTop: 'auto' }}>
                                        <a
                                            href={place.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-outline"
                                            style={{ display: 'inline-block', textDecoration: 'none', width: '100%', textAlign: 'center' }}
                                        >
                                            Visit Website
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}