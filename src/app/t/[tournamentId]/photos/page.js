import { getData } from '@/lib/data';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import Link from 'next/link';
import Image from 'next/image';
import { Upload } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PhotosPage() {
    const photos = await getData('photos');

    return (
        <div className="fade-in">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <Image src="/images/photos-icon.png" alt="Photos" width={150} height={150} style={{ height: 'auto', borderRadius: 'var(--radius)', boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
                <div>
                    <h1 className="section-title">Tournament Gallery</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Share your best moments!</p>
                </div>

                {/* Helper for desktop users who can't scan */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Link href="/photos/upload" className="btn-outline">
                        <Upload size={18} style={{ marginRight: '8px' }} />
                        Upload Here
                    </Link>
                    <div className="glass-panel" style={{ padding: '0.5rem' }}>
                        <QRCodeDisplay />
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {photos.map((photo) => (
                    <div key={photo.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ height: '250px' }}>
                            <div style={{ position: 'relative', width: '100%', height: '300px' }}>
                                <Image
                                    src={photo.url}
                                    alt={photo.caption}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                />
                            </div>
                        </div>
                        {photo.caption && (
                            <div style={{ padding: '1rem' }}>
                                <p style={{ fontSize: '0.9rem' }}>{photo.caption}</p>
                            </div>
                        )}
                    </div>
                ))}
                {photos.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No photos yet. Be the first to upload!</p>}
            </div>
        </div>
    );
}
