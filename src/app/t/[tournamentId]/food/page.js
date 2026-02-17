import prisma from '@/lib/prisma';

export default async function FoodPage({ params }) {
    const slug = params.tournamentId;
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: { restaurants: true }
    });

    const restaurants = tournament?.restaurants || [];

    return (
        <div className="fade-in">
            <h1 className="section-title">Restaurants & Dining</h1>

            {restaurants.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No restaurants listed yet.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    {restaurants.map((place) => (
                        <div key={place.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <h2 style={{ color: 'var(--accent)', fontSize: '1.4rem', margin: 0 }}>{place.name}</h2>
                                {place.rating && <span style={{ background: 'var(--accent)', color: 'black', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>★ {place.rating}</span>}
                            </div>

                            {place.cuisine && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', fontStyle: 'italic' }}>{place.cuisine}</p>}

                            {place.address && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>{place.address}</p>}

                            {place.notes && <p style={{ marginBottom: '1.5rem', flex: 1, whiteSpace: 'pre-wrap' }}>{place.notes}</p>}

                            {place.url && (
                                <a
                                    href={place.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-outline"
                                    style={{ marginTop: 'auto', textAlign: 'center', textDecoration: 'none' }}
                                >
                                    View Menu / Website
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
