import React, { useState, useEffect } from 'react';

export default function BrandingSettingsTab({ tournamentId }) {
    const [tournamentName, setTournamentName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [backgroundColor, setBackgroundColor] = useState('#0a1a0f');
    const [logoPreview, setLogoPreview] = useState(null);
    const [savingBranding, setSavingBranding] = useState(false);
    const [brandingMessage, setBrandingMessage] = useState('');

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
            }
        } catch (error) {
            console.error('Error fetching branding settings:', error);
        }
    };

    const handleSaveBranding = async () => {
        setSavingBranding(true);
        setBrandingMessage('');

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId,
                    tournamentName,
                    logoUrl,
                    backgroundColor
                })
            });

            if (res.ok) {
                setBrandingMessage('Branding saved!');
                setTimeout(() => setBrandingMessage(''), 3000);
            } else {
                setBrandingMessage('Error saving branding');
            }
        } catch (error) {
            console.error('Error saving branding:', error);
            setBrandingMessage('Error saving branding');
        } finally {
            setSavingBranding(false);
        }
    };

    return (
        <div className="card">
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

                            // Compress image
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                const img = new Image();
                                img.onload = () => {
                                    const canvas = document.createElement('canvas');
                                    let width = img.width;
                                    let height = img.height;
                                    const maxSize = 200;

                                    // Resize
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

            <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
        </div>
    );
}
