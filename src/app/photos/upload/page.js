"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, Image as ImageIcon, Camera } from 'lucide-react';

export default function UploadPage() {
    const [caption, setCaption] = useState('');
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const router = useRouter();

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show preview immediately
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
    };

    const compressImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1200;
                    const MAX_HEIGHT = 1200;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG with 0.7 quality
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('file-upload');
        const file = fileInput?.files?.[0];

        if (!file) {
            alert("Please select a photo first");
            return;
        }

        setLoading(true);

        try {
            const compressedBase64 = await compressImage(file);

            await fetch('/api/photos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: compressedBase64, caption })
            });

            router.push('/photos');
            router.refresh();
        } catch (err) {
            console.error(err);
            alert("Failed to upload photo. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in" style={{ maxWidth: '500px', margin: '0 auto', paddingBottom: '2rem' }}>
            <h1 className="section-title">Upload Photo</h1>
            <form onSubmit={handleSubmit} className="card">

                {/* File Input Area */}
                <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <input
                        type="file"
                        id="file-upload"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />

                    <label
                        htmlFor="file-upload"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1rem',
                            cursor: 'pointer',
                            padding: '2rem',
                            border: '2px dashed var(--glass-border)',
                            borderRadius: 'var(--radius)',
                            background: 'rgba(0,0,0,0.2)',
                            transition: 'all 0.2s'
                        }}
                        className="hover-effect"
                    >
                        {preview ? (
                            <div style={{ position: 'relative', width: '100%', maxHeight: '300px', overflow: 'hidden', borderRadius: 'var(--radius)' }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={preview} alt="Preview" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} className="preview-overlay">
                                    <div className="btn-outline" style={{ background: '#000' }}>Change Photo</div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <UploadCloud size={48} style={{ color: 'var(--accent)' }} />
                                <div>
                                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Choose a Photo</p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>From your library or take a new one</p>
                                </div>
                            </>
                        )}
                    </label>
                </div>

                {/* Caption Input */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Caption (Optional)</label>
                    <input
                        type="text"
                        placeholder="Great shot on hole 9!"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--glass-border)',
                            background: 'var(--bg-dark)',
                            color: 'var(--text-main)',
                            fontSize: '1rem'
                        }}
                    />
                </div>

                <button
                    type="submit"
                    className="btn"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    disabled={loading || !preview}
                >
                    {loading ? (
                        <>Uploading...</>
                    ) : (
                        <>
                            <Camera size={20} />
                            Post Photo
                        </>
                    )}
                </button>
            </form>

            <style jsx>{`
                .preview-overlay:hover {
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    );
}
