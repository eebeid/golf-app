import prisma from '@/lib/prisma';
import Image from 'next/image';
import { format, toZonedTime } from 'date-fns-tz';

export default async function FoodPage({ params }) {
    const slug = params.tournamentId;
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: { restaurants: true, settings: true }
    });

    let restaurants = tournament?.restaurants || [];

    // Sort restaurants chronologically
    restaurants.sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1; // push no-date to end
        if (!b.date) return -1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    const timezone = tournament?.settings?.timezone || 'America/New_York';

    const formatDateTime = (dtStr) => {
        if (!dtStr) return '';
        if (!dtStr.includes('T')) return dtStr;
        try {
            const date = new Date(dtStr);
            const zonedDate = toZonedTime(date, timezone);
            return format(zonedDate, "MM/dd/yyyy 'at' h:mm a");
        } catch (e) {
            return dtStr;
        }
    };

    const getGoogleCalendarUrl = (place) => {
        if (!place.date || !place.date.includes('T')) return null;

        try {
            const dateObj = new Date(place.date);
            const zonedStartDate = toZonedTime(dateObj, timezone);
            const zonedEndDate = new Date(zonedStartDate.getTime() + 2 * 60 * 60 * 1000);

            // Format directly into the timezone-less exact ISO string that Google expects 
            // combined with the Z denoting UTC, since we want to lock the event to these exact hours
            // Actually, the safest way for Google Calendar is to use the exact UTC time and let Google handle it.
            // Since place.date is saved in local time (e.g. 2024-05-15T18:30) natively interpreted as UTC by the string parser,
            // we should parse it assuming it IS in the tournament's timezone, then convert to UTC for Google.

            // Re-parse the literal string as being within the specific timezone
            const [datePart, timePart] = place.date.split('T');
            const [year, month, day] = datePart.split('-');
            const [hours, minutes] = timePart.split(':');

            // Construct a string that explicitly includes the timezone
            // Note: doing intense date math here. 
            // For Google Calendar, if we pass YYYYMMDDTHHMMSSZ, it is strictly UTC.
            return generateGCalLink(place, year, month, day, hours, minutes, timezone, tournament.name);
        } catch (e) {
            return null;
        }
    };

    // Helper to keep the logic clean
    const generateGCalLink = (place, year, month, day, hours, minutes, tz, tName) => {
        // We use Intl.DateTimeFormat to figure out the timezone offset at this specific date
        // Since JS doesn't have a native way to create a Date IN a timezone, we construct it:
        const localString = `${year}-${month}-${day}T${hours}:${minutes}:00`;

        // Use a library helper if available, otherwise just format the dates in the target TZ
        // Since we have date-fns-tz we can do this:
        const { toDate } = require('date-fns-tz');
        const exactDateObj = toDate(localString, { timeZone: tz });
        const endDateObj = new Date(exactDateObj.getTime() + 2 * 60 * 60 * 1000);

        const formatIsoStr = (d) => {
            return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
        };

        const startStr = formatIsoStr(exactDateObj);
        const endStr = formatIsoStr(endDateObj);

        const text = encodeURIComponent(`Reservation at ${place.name}`);
        const details = encodeURIComponent(place.notes || `Dinner reservation for ${tName}`);
        const location = encodeURIComponent(place.address || place.name);

        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
    };

    return (
        <div className="fade-in">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <Image
                    src="/images/food-icon.png"
                    alt="Restaurants & Dining"
                    width={150}
                    height={150}
                    style={{
                        height: 'auto',
                        borderRadius: 'var(--radius)',
                        boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)'
                    }}
                />
            </div>
            <h1 className="section-title">Restaurants &amp; Dining</h1>

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
