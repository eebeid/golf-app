"use client";

import { useState, useEffect } from 'react';
import { Upload, Save, Trash2, Users, Calendar, Image as ImageIcon, Loader2, X } from 'lucide-react';

export default function ScorecardUploadPage({ params }) {
    const { tournamentId } = params;

    // Data State
    const [players, setPlayers] = useState([]);
    const [settings, setSettings] = useState(null);
    const [existingScorecards, setExistingScorecards] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [image, setImage] = useState(null); // File object
    const [preview, setPreview] = useState(null); // Object URL
    const [base64Image, setBase64Image] = useState(null); // For upload

    const [selectedRound, setSelectedRound] = useState(1);
    const [selectedPlayers, setSelectedPlayers] = useState(['', '', '', '']); // 4 slots
    const [isSaving, setIsSaving] = useState(false);

    // Load Initial Data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [playersRes, settingsRes, cardsRes] = await Promise.all([
                    fetch(`/api/players?tournamentId=${tournamentId}`),
                    fetch(`/api/settings?tournamentId=${tournamentId}`),
                    fetch(`/api/scorecards?tournamentId=${tournamentId}`)
                ]);

                if (playersRes.ok) setPlayers(await playersRes.json());
                if (settingsRes.ok) setSettings(await settingsRes.json());
                if (cardsRes.ok) setExistingScorecards(await cardsRes.json());
            } catch (e) {
                console.error("Failed to load data", e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [tournamentId]);

    // Handle Image Selection
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Create Preview
        if (preview) URL.revokeObjectURL(preview);
        setPreview(URL.createObjectURL(file));
        setImage(file);

        // Convert to Base64 for storage
        const reader = new FileReader();
        reader.onloadend = () => {
            setBase64Image(reader.result);
        };
        reader.readAsDataURL(file);
    };

    // Update Player Selection
    const handlePlayerSelect = (index, playerId) => {
        const newSelection = [...selectedPlayers];
        newSelection[index] = playerId;
        setSelectedPlayers(newSelection);
    };

    // Save Scorecard
    const handleSave = async () => {
        if (!base64Image) {
            alert("Please select an image.");
            return;
        }

        // Filter out empty player selections
        const validPlayerIds = selectedPlayers.filter(id => id);
        if (validPlayerIds.length === 0) {
            if (!confirm("No players selected. Save anyway?")) return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/scorecards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId,
                    round: selectedRound,
                    imageUrl: base64Image,
                    playerIds: validPlayerIds
                })
            });

            if (res.ok) {
                const newCard = await res.json();

                // Parse the metadata manually if the API returns the raw Photo object
                // The API returns the raw photo, but our list expects parsed metadata.
                // We'll just reload the list or optimistically add it.
                // Optimistic add needs parsing logic:
                const addedCard = {
                    id: newCard.id,
                    imageUrl: newCard.url,
                    round: selectedRound,
                    playerIds: validPlayerIds,
                    createdAt: new Date().toISOString()
                };

                setExistingScorecards(prev => [addedCard, ...prev]);

                // Reset Form
                setImage(null);
                setPreview(null);
                setBase64Image(null);
                setSelectedPlayers(['', '', '', '']);
                alert("Scorecard uploaded successfully!");
            } else {
                alert("Failed to upload scorecard.");
            }
        } catch (e) {
            console.error(e);
            alert("Error uploading scorecard.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this scorecard?")) return;

        try {
            const res = await fetch(`/api/scorecards?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setExistingScorecards(prev => prev.filter(c => c.id !== id));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const getPlayerName = (id) => {
        const p = players.find(p => p.id === id);
        return p ? p.name : 'Unknown';
    };

    if (loading) return <div className="fade-in" style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="animate-spin" /> Loading...</div>;

    const roundCount = settings?.numberOfRounds || 1;
    const rounds = Array.from({ length: roundCount }, (_, i) => i + 1);

    return (
        <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="section-title" style={{ margin: 0 }}>Scorecard Uploads</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>

                {/* Upload Form */}
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Upload size={20} />
                        Upload New Card
                    </h3>

                    {/* Image Input */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Scorecard Image</label>
                        {preview ? (
                            <div style={{ position: 'relative', marginBottom: '1rem', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                                <img src={preview} alt="Preview" style={{ width: '100%', display: 'block' }} />
                                <button
                                    onClick={() => { setPreview(null); setImage(null); setBase64Image(null); }}
                                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', padding: '5px', cursor: 'pointer' }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div style={{
                                border: '2px dashed var(--glass-border)',
                                borderRadius: 'var(--radius)',
                                padding: '2rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                background: 'rgba(255,255,255,0.02)'
                            }} onClick={() => document.getElementById('sc-upload').click()}>
                                <ImageIcon size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                                <div style={{ color: 'var(--text-muted)' }}>Click to select image</div>
                            </div>
                        )}
                        <input id="sc-upload" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                    </div>

                    {/* Round Selection */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={16} /> Round
                        </label>
                        <select
                            value={selectedRound}
                            onChange={(e) => setSelectedRound(parseInt(e.target.value))}
                            style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius)', background: 'var(--bg-dark)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}
                        >
                            {rounds.map(r => <option key={r} value={r}>Round {r}</option>)}
                        </select>
                    </div>

                    {/* Player Selection */}
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={16} /> Tag Players (Max 4)
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            {selectedPlayers.map((playerId, idx) => (
                                <select
                                    key={idx}
                                    value={playerId}
                                    onChange={(e) => handlePlayerSelect(idx, e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius)', background: 'var(--bg-dark)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}
                                >
                                    <option value="">-- Slot {idx + 1} --</option>
                                    {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving || !base64Image}
                        className="btn"
                        style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', background: 'var(--success, #22c55e)' }}
                    >
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                        {isSaving ? 'Uploading...' : 'Upload Scorecard'}
                    </button>

                </div>

                {/* Instructions / Info */}
                <div style={{ color: 'var(--text-muted)' }}>
                    <div className="card" style={{ height: '100%' }}>
                        <h3>Instructions</h3>
                        <ul style={{ paddingLeft: '1.5rem', marginTop: '1rem', lineHeight: '1.6' }}>
                            <li>Upload a clear photo of the scorecard.</li>
                            <li>Select the associated round.</li>
                            <li>Tag up to 4 players whose scores are on this card.</li>
                            <li>These images will be saved for verification and record keeping.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* List Existing */}
            <h2 className="section-title">Uploaded Scorecards</h2>
            {existingScorecards.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {existingScorecards.map(card => (
                        <div key={card.id || Math.random()} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div style={{ height: '200px', overflow: 'hidden', background: '#000', position: 'relative' }}>
                                <img src={card.imageUrl} alt="Scorecard" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                <div style={{ position: 'absolute', top: 0, left: 0, padding: '5px 10px', background: 'var(--accent)', color: '#000', fontWeight: 'bold', borderBottomRightRadius: 'var(--radius)' }}>
                                    Round {card.round}
                                </div>
                            </div>
                            <div style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                                    {card.playerIds && card.playerIds.map(pid => (
                                        <span key={pid} style={{ fontSize: '0.8rem', background: 'var(--bg-dark)', padding: '2px 8px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                                            {getPlayerName(pid)}
                                        </span>
                                    ))}
                                    {(!card.playerIds || card.playerIds.length === 0) && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No players tagged</span>}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {new Date(card.createdAt).toLocaleDateString()}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(card.id)}
                                        style={{ background: 'none', border: 'none', color: 'var(--error, #ef4444)', cursor: 'pointer', padding: '5px' }}
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', border: '1px dashed var(--glass-border)', borderRadius: 'var(--radius)' }}>
                    No scorecards uploaded yet.
                </div>
            )}

        </div>
    );
}
