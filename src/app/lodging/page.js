import { getData } from '@/lib/data';
import Link from 'next/link';

export default async function LodgingPage() {
    const lodging = await getData('lodging');

    return (
        <div className="fade-in">
            <h1 className="section-title">Accommodations</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {lodging.map((place) => (
                    <div key={place.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ height: '200px', width: '100%' }}>
                            <img src={place.image} alt={place.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <h2 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>{place.name}</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', height: '60px', overflow: 'hidden' }}>{place.description}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                                {place.details && (
                                    <a href={place.details} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.8rem', textDecoration: 'none' }}>
                                        Details
                                    </a>
                                )}
                                {place.mapUrl && (
                                    <a href={place.mapUrl} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.8rem', textDecoration: 'none' }}>
                                        Directions
                                    </a>
                                )}
                            </div>
                            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {place.amenities.map(am => (
                                    <span key={am} style={{ fontSize: '0.75rem', background: 'var(--bg-dark)', padding: '4px 8px', borderRadius: '4px' }}>{am}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}