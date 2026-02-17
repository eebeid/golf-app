"use client";

import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

export default function ScorecardEditorModal({ scorecard, course, onClose, onSave }) {
    const [scores, setScores] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (scorecard) {
            setScores({ ...scorecard.scores });
        }
    }, [scorecard]);

    // Prevent background scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const handleChange = (hole, value) => {
        setScores(prev => ({
            ...prev,
            [hole]: parseInt(value) || 0
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            // Process all scores
            const updates = [];

            // Loop through holes 1-18
            for (let i = 1; i <= 18; i++) {
                const newScore = scores[i];
                // Check if we need to save (score > 0) or delete (existing score but now empty/0)
                const hasExisting = scorecard.scores && scorecard.scores[i];

                if (newScore > 0 || hasExisting) {
                    updates.push(fetch('/api/scores', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            playerId: scorecard.playerId,
                            courseId: scorecard.courseId,
                            hole: i,
                            score: newScore || 0 // Send 0 to trigger delete if empty
                        }),
                    }));
                }
            }

            if (updates.length > 0) {
                await Promise.all(updates);
                onSave(); // Refresh parent data
                onClose();
            } else {
                setError("No valid scores to save.");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to save scores. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (!scorecard || !course) return null;

    const FrontNine = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const BackNine = [10, 11, 12, 13, 14, 15, 16, 17, 18];

    const renderHoleInput = (holeNum) => {
        const par = course.holes?.find(h => h.number === holeNum)?.par || '-';
        return (
            <div key={holeNum} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)'
            }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hole {holeNum}</label>
                <div style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>Par {par}</div>
                <input
                    type="number"
                    min="1"
                    max="15"
                    value={scores[holeNum] || ''}
                    onChange={(e) => handleChange(holeNum, e.target.value)}
                    style={{
                        width: '50px',
                        padding: '0.5rem',
                        textAlign: 'center',
                        borderRadius: '4px',
                        border: '1px solid var(--glass-border)',
                        background: 'var(--bg-dark)',
                        color: 'var(--text-main)',
                        fontSize: '1.2rem',
                        fontWeight: 'bold'
                    }}
                />
            </div>
        );
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 9999,
            backdropFilter: 'blur(5px)'
        }} onClick={onClose}>
            <div
                className="glass-panel custom-scrollbar"
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '95%',
                    maxWidth: '800px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    padding: '2rem',
                    background: 'var(--bg-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', color: 'var(--accent)', margin: 0 }}>Edit Scorecard</h2>
                        <p style={{ color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                            {scorecard.playerName} - {scorecard.courseName}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {error && (
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        borderRadius: '8px',
                        color: '#fca5a5',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div>
                        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Front Nine</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                            {FrontNine.map(hole => renderHoleInput(hole))}
                        </div>
                    </div>
                    <div>
                        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Back Nine</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                            {BackNine.map(hole => renderHoleInput(hole))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button
                        onClick={onClose}
                        className="btn-outline"
                        style={{ padding: '0.8rem 1.5rem', borderRadius: '8px' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="btn"
                        disabled={saving}
                        style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', opacity: saving ? 0.7 : 1 }}
                    >
                        {saving ? 'Saving...' : (
                            <>
                                <Save size={18} style={{ marginRight: '0.5rem' }} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>

            <style jsx>{`
                @media (max-width: 768px) {
                    div[style*="grid-template-columns: 1fr 1fr"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
