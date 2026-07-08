import React, { useState, useEffect } from 'react';
import UpgradeModal from '../UpgradeModal';
import { Trash2, Lock, Plus } from 'lucide-react';

export default function BrandingSettingsTab({ tournamentId }) {
    const [tournamentName, setTournamentName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [backgroundColor, setBackgroundColor] = useState('#0a1a0f');
    const [logoPreview, setLogoPreview] = useState(null);
    const [savingBranding, setSavingBranding] = useState(false);
    const [brandingMessage, setBrandingMessage] = useState('');

    const [isPro, setIsPro] = useState(false);
    const [sponsorLogos, setSponsorLogos] = useState([]);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    useEffect(() => {
        if (tournamentId) {
            fetchSettings();
        }
    }, [tournamentId]);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`/api/settings?tournamentId=${tournamentId}`);
            if (res.ok) {
                const data = await res.json();
                setTournamentName(data.tournamentName || 'Golf Tournament');
                setLogoUrl(data.logoUrl || '');
                setLogoPreview(data.logoUrl || null);
                setBackgroundColor(data.backgroundColor || '#0a1a0f');
                setIsPro(data.isPro || false);
                setSponsorLogos(Array.isArray(data.sponsorLogos) ? data.sponsorLogos : []);
            }
        } catch (error) {
            console.error('Error fetching branding settings:', error);
        }
    };

    const handleSaveBranding = async () => {
        setSavingBranding(true);
        setBrandingMessage('');

        try {
            const payload = {
                tournamentId,
                tournamentName,
                logoUrl,
                backgroundColor
            };

            // Only append sponsor logos if Pro
            if (isPro) {
                payload.sponsorLogos = sponsorLogos;
            }

            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setBrandingMessage('Branding saved!');
                setTimeout(() => setBrandingMessage(''), 3000);
            } else {
                const errData = await res.json();
                setBrandingMessage(errData?.error || 'Error saving branding');
            }
        } catch (error) {
            console.error('Error saving branding:', error);
            setBrandingMessage('Error saving branding');
        } finally {
            setSavingBranding(false);
        }
    };

    const handleSponsorUpload = async (e) => {
        if (!isPro) {
            setShowUpgradeModal(true);
            return;
        }

        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newLogos = [...sponsorLogos];

        for (const file of files) {
            await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;
                        const maxSize = 250;

                        if (width > height) {
                            if (width > maxSize) {
                                height = Math.round((height * maxSize) / width);
                                width = maxSize;
                            }
                        } else {
                            if (height > maxSize) {
                                width = Math.round((width * maxSize) / height);
                                height = maxSize;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        const dataUrl = canvas.toDataURL('image/png');
                        newLogos.push(dataUrl);
                        resolve();
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        setSponsorLogos(newLogos);
    };

    const handleDeleteSponsor = (indexToDelete) => {
        setSponsorLogos(sponsorLogos.filter((_, idx) => idx !== indexToDelete));
    };

    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Branding</h2>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Tournament Name</label>
                    <input
                        type="text"
                        value={tournamentName}
                        onChange={(e) => setTournamentName(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--glass-border)',
                            background: 'var(--bg-dark)',
                            color: 'var(--text-main)',
                            fontSize: '1rem'
                        }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Logo</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {logoPreview && (
                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent)' }}>
                                <img src={logoPreview} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;

                                const reader = new FileReader();
                                reader.onload = (event) => {
                                    const img = new Image();
                                    img.onload = () => {
                                        const canvas = document.createElement('canvas');
                                        let width = img.width;
                                        let height = img.height;
                                        const maxSize = 200;

                                        if (width > height) {
                                            if (width > maxSize) {
                                                height = Math.round((height * maxSize) / width);
                                                width = maxSize;
                                            }
                                        } else {
                                            if (height > maxSize) {
                                                width = Math.round((width * maxSize) / height);
                                                height = maxSize;
                                            }
                                        }

                                        canvas.width = width;
                                        canvas.height = height;
                                        const ctx = canvas.getContext('2d');
                                        ctx.drawImage(img, 0, 0, width, height);

                                        const dataUrl = canvas.toDataURL('image/png');
                                        setLogoUrl(dataUrl);
                                        setLogoPreview(dataUrl);
                                    };
                                    img.src = event.target.result;
                                };
                                reader.readAsDataURL(file);
                            }}
                            style={{ color: 'var(--text-muted)' }}
                        />
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Logo will be resized and compressed automatically.
                    </p>
                </div>

                <div style={{ marginTop: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 'bold' }}>Background Color</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        {[
                            { name: 'Forest (Original)', color: '#0a1a0f' },
                            { name: 'Navy', color: '#0a122a' },
                            { name: 'Burgundy', color: '#2a0a0b' },
                            { name: 'Charcoal', color: '#1a1a1b' },
                            { name: 'Slate', color: '#1e293b' },
                            { name: 'Midnight', color: '#0f172a' },
                            { name: 'Emerald', color: '#064e4b' },
                            { name: 'Plum', color: '#2d1b36' },
                            { name: 'Ocean', color: '#0c4a6e' }
                        ].map((swatch) => (
                            <div
                                key={swatch.color}
                                onClick={() => setBackgroundColor(swatch.color)}
                                style={{
                                    width: '45px',
                                    height: '45px',
                                    borderRadius: '8px',
                                    backgroundColor: swatch.color,
                                    cursor: 'pointer',
                                    border: backgroundColor === swatch.color ? '3px solid var(--accent)' : '1px solid var(--glass-border)',
                                    boxShadow: backgroundColor === swatch.color ? '0 0 10px var(--accent-glow)' : 'none',
                                    transition: 'all 0.2s ease'
                                }}
                                title={swatch.name}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Sponsor Logos Section */}
            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', marginBottom: '0.5rem' }}>
                    Sponsor Logos
                    {!isPro && <Lock size={16} style={{ color: 'var(--text-muted)' }} />}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    Upload partner and sponsor logos to display on screens and print sheets. (Requires Pro)
                </p>

                {!isPro ? (
                    <div style={{
                        position: 'relative',
                        background: 'rgba(212, 175, 55, 0.03)',
                        border: '1px dashed rgba(212, 175, 55, 0.3)',
                        borderRadius: 'var(--radius)',
                        padding: '3rem 2rem',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            fontSize: '2.5rem',
                            color: 'var(--accent)',
                            filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.3))'
                        }}>
                            🤝
                        </div>
                        <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>Monetize Your Tournament</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '400px' }}>
                            Sell sponsorships to local businesses! Upload their logos to rotate on the mobile live-scoring screen, widescreen TV leaderboards, and print documents.
                        </p>
                        <button
                            onClick={() => setShowUpgradeModal(true)}
                            className="btn"
                            style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}
                        >
                            Unlock Sponsor Showcase
                        </button>
                    </div>
                ) : (
                    <div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                            {sponsorLogos.map((url, idx) => (
                                <div key={idx} style={{
                                    position: 'relative',
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    border: '1px solid var(--glass-border)',
                                    background: 'var(--bg-dark)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '8px'
                                }}>
                                    <img src={url} alt={`Sponsor ${idx + 1}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                    <button
                                        onClick={() => handleDeleteSponsor(idx)}
                                        style={{
                                            position: 'absolute',
                                            top: '4px',
                                            right: '4px',
                                            background: 'rgba(239, 68, 68, 0.9)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '4px',
                                            padding: '4px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        title="Remove sponsor logo"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}

                            <label style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '8px',
                                border: '2px dashed var(--glass-border)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                background: 'rgba(255,255,255,0.02)',
                                transition: 'all 0.2s ease'
                            }} className="hover-accent">
                                <Plus size={20} />
                                <span style={{ fontSize: '0.75rem', marginTop: '4px' }}>Add Logo</span>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleSponsorUpload}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Supports PNG, JPG. Automatically optimized.
                        </p>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={handleSaveBranding}
                    className="btn"
                    disabled={savingBranding}
                    style={{ minWidth: '150px' }}
                >
                    {savingBranding ? 'Saving...' : 'Save Branding'}
                </button>
                {brandingMessage && (
                    <span style={{
                        color: brandingMessage.includes('Error') ? '#ff6b6b' : 'var(--accent)',
                        fontWeight: 'bold'
                    }}>
                        {brandingMessage}
                    </span>
                )}
            </div>

            <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
        </div>
    );
}
