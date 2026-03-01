import prisma from '@/lib/prisma';

export default async function FoodPage({ params }) {
    const slug = params.tournamentId;
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: { restaurants: true }
    });

    const restaurants = tournament?.restaurants || [];

    const formatDateTime = (dtStr) => {
        if (!dtStr) return '';
        if (!dtStr.includes('T')) return dtStr;
        const [datePart, timePart] = dtStr.split('T');
        const [year, month, day] = datePart.split('-');
        let [hours, minutes] = timePart.split(':');
        let h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${month}/${day}/${year} at ${h}:${minutes} ${ampm}`;
    };

    const getGoogleCalendarUrl = (place) => {
        if (!place.date || !place.date.includes('T')) return null;

        const startDate = new Date(place.date);

        // Assume dinner/reservation lasts 2 hours
        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

        const formatIsoStr = (d) => {
            return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
        };

        const startStr = formatIsoStr(startDate);
        const endStr = formatIsoStr(endDate);

        const text = encodeURIComponent(`Reservation at ${place.name}`);
        const details = encodeURIComponent(place.notes || `Dinner reservation for ${tournament.name}`);
        const location = encodeURIComponent(place.address || place.name);

        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
    };

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

                            {place.date && (
                                <p style={{ marginBottom: '0.5rem' }}>
                                    <a
                                        href={getGoogleCalendarUrl(place) || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: 'var(--accent)', fontSize: '0.95rem', fontWeight: 'bold', textDecoration: 'none' }}
                                    >
                                        📅 {formatDateTime(place.date)}
                                    </a>
                                </p>
                            )}

                            {place.address && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.address)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: 'var(--text-main)', fontSize: '0.9rem', textDecoration: 'underline' }}
                                    >
                                        📍 Get Directions: {place.address}
                                    </a>
                                </div>
                            )}

                            {place.phone && (
                                <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                    📞 <a href={`tel:${place.phone.replace(/[^0-9+]/g, '')}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{place.phone}</a>
                                </p>
                            )}

                            {place.lat && place.lng && (
                                <div style={{ width: '100%', height: '200px', marginBottom: '1.5rem', borderRadius: '8px', overflow: 'hidden' }}>
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        loading="lazy"
                                        allowFullScreen
                                        referrerPolicy="no-referrer-when-downgrade"
                                        src={`https://www.google.com/maps/embed/v1/place?key=${process.env.GOOGLE_MAPS_API_KEY}&q=${place.lat},${place.lng}`}
                                    ></iframe>
                                </div>
                            )}

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
