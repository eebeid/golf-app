"use client";

import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import UpgradeModal from '../UpgradeModal';

export default function PrintSettings({ tournamentId }) {
    const [canPrint, setCanPrint] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (tournamentId) {
            fetch(`/api/settings?tournamentId=${tournamentId}`)
                .then(res => res.json())
                .then(data => {
                    setCanPrint(data.canPrint || false);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error fetching settings for printing:', err);
                    setLoading(false);
                });
        }
    }, [tournamentId]);

    const handlePrintClick = (path) => {
        if (!canPrint) {
            setShowUpgradeModal(true);
            return;
        }
        window.open(path, '_blank');
    };

    if (loading) {
        return <div style={{ color: 'var(--text-muted)' }}>Loading print configurations...</div>;
    }

    return (
        <div className="card">
            <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Print & Export</h2>
            
            {!canPrint && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(96,165,250,0.1), rgba(96,165,250,0.02))',
                    border: '1px solid rgba(96,165,250,0.3)',
                    borderRadius: 'var(--radius)',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.8rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: '#60a5fa' }}>
                        <Lock size={18} />
                        Print & Export Features Locked
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Unlock printable custom cart signs (pre-formatted with player names, tee times, starting holes, and sponsors) and official handicap-dotted scorecards.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        <button className="btn" style={{ padding: '6px 16px', fontSize: '0.85rem', background: '#60a5fa', color: '#000' }} onClick={() => setShowUpgradeModal(true)}>
                            Unlock Event Pass ($19)
                        </button>
                        <button className="btn" style={{ padding: '6px 16px', fontSize: '0.85rem' }} onClick={() => setShowUpgradeModal(true)}>
                            Go Pro Annual ($49/yr)
                        </button>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div style={{ padding: '1.5rem', background: 'var(--bg-dark)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Cart Signs
                        {!canPrint && <Lock size={16} style={{ color: 'var(--text-muted)' }} />}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Print out custom cart signs for all players.</p>
                    <button className="btn" style={{ marginTop: 'auto' }} onClick={() => handlePrintClick(`/t/${tournamentId}/admin/print-cart-signs`)}>
                        Generate Cart Signs
                    </button>
                </div>
                <div style={{ padding: '1.5rem', background: 'var(--bg-dark)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Scorecards
                        {!canPrint && <Lock size={16} style={{ color: 'var(--text-muted)' }} />}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Print official scorecards with handicaps.</p>
                    <button className="btn" style={{ marginTop: 'auto' }} onClick={() => handlePrintClick(`/t/${tournamentId}/admin/print-scorecards`)}>
                        Generate Scorecards
                    </button>
                </div>
                <div style={{ padding: '1.5rem', background: 'var(--bg-dark)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Results
                        {!canPrint && <Lock size={16} style={{ color: 'var(--text-muted)' }} />}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Print the final tournament leaderboard.</p>
                    <button className="btn" style={{ marginTop: 'auto' }} onClick={() => handlePrintClick(`/t/${tournamentId}/leaderboard?print=true`)}>
                        Print Results
                    </button>
                </div>
                <div style={{ padding: '1.5rem', background: 'var(--bg-dark)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Statistics
                        {!canPrint && <Lock size={16} style={{ color: 'var(--text-muted)' }} />}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Print player statistics and hole-by-hole breakdown.</p>
                    <button className="btn" style={{ marginTop: 'auto' }} onClick={() => handlePrintClick(`/t/${tournamentId}/stats?print=true`)}>
                        Print Statistics
                    </button>
                </div>
            </div>

            <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} tournamentId={tournamentId} />
        </div>
    );
}
