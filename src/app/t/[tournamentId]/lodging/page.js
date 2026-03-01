import prisma from '@/lib/prisma';
import Image from 'next/image';
import { MapPin, Globe, Calendar, Users } from 'lucide-react';

export default async function LodgingPage({ params }) {
    const mapsKey = process.env.GOOGLE_MAPS_API_KEY || '';

    const slug = params.tournamentId;
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: {
            lodging: {
                orderBy: { name: 'asc' },
                include: {
                    players: {
                        include: { player: { select: { id: true, name: true } } }
                    }
                }
            }
        }
    });

    const lodgings = tournament?.lodging || [];

    return (
        <div className="fade-in">
            <h1 className="section-title">Accommodations</h1>

            {lodgings.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏨</div>
                    <p style={{ fontSize: '1.1rem' }}>No accommodations listed yet.</p>
                    <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Check back later or contact the tournament organizer.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
                    {lodgings.map((place) => (
                        <div key={place.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid var(--glass-border)' }}>

                            {/* Header image or gradient banner */}
                            {place.image ? (
                                <div style={{ height: '200px', width: '100%', position: 'relative' }}>
                                    <Image
                                        src={place.image}
                                        alt={place.name}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                    />
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,14,26,0.8) 0%, transparent 60%)' }} />
                                </div>
                            ) : (
                                <div style={{ height: '100px', background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                                    🏨
                                </div>
                            )}

                            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                                {/* Title + unit */}
                                <div>
                                    <h2 style={{ color: 'var(--accent)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.2rem', lineHeight: 1.3 }}>{place.name}</h2>
                                    {place.unitNumber && (
                                        <span style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '20px', padding: '0.15rem 0.65rem', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>
                                            {place.unitNumber}
                                        </span>
                                    )}
                                </div>

                                {/* Address */}
                                {place.address && (
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                        <MapPin size={15} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textDecoration: 'none', lineHeight: 1.4 }}
                                        >
                                            {place.address}
                                        </a>
                                    </div>
                                )}

                                {/* Embedded Google Map */}
                                {place.address && mapsKey && (
                                    <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--glass-border)', height: '200px' }}>
                                        <iframe
                                            width="100%"
                                            height="200"
                                            style={{ border: 0, display: 'block' }}
                                            loading="lazy"
                                            allowFullScreen
                                            referrerPolicy="no-referrer-when-downgrade"
                                            src={`https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=${encodeURIComponent(place.address)}&zoom=15`}
                                        />
                                    </div>
                                )}

                                {/* Notes */}
                                {place.notes && (
                                    <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                                        {place.notes}
                                    </p>
                                )}

                                {/* Check-in / Check-out */}
                                {(place.checkIn || place.checkOut) && (
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        {place.checkIn && (
                                            <div style={{ flex: 1, background: 'rgba(212,175,55,0.07)', borderRadius: '8px', padding: '0.6rem 0.75rem', border: '1px solid rgba(212,175,55,0.15)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                                                    <Calendar size={11} /> Check-in
                                                </div>
                                                <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.9rem' }}>{place.checkIn}</div>
                                            </div>
                                        )}
                                        {place.checkOut && (
                                            <div style={{ flex: 1, background: 'rgba(212,175,55,0.07)', borderRadius: '8px', padding: '0.6rem 0.75rem', border: '1px solid rgba(212,175,55,0.15)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                                                    <Calendar size={11} /> Check-out
                                                </div>
                                                <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.9rem' }}>{place.checkOut}</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Players staying here */}
                                {place.players?.length > 0 && (
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
                                            <Users size={12} /> Staying Here
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                            {place.players.map(lp => (
                                                <span
                                                    key={lp.player.id}
                                                    style={{
                                                        background: 'rgba(212,175,55,0.12)',
                                                        border: '1px solid rgba(212,175,55,0.25)',
                                                        borderRadius: '20px',
                                                        padding: '0.25rem 0.75rem',
                                                        fontSize: '0.85rem',
                                                        color: 'var(--text-main)',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    🏌️ {lp.player.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Website button */}
                                {place.url && (
                                    <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                                        <a
                                            href={place.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-outline"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none', width: '100%' }}
                                        >
                                            <Globe size={15} /> Visit Website
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