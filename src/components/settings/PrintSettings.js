"use client";

import React from 'react';

export default function PrintSettings({ tournamentId }) {
    return (
        <div className="card">
            <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Print & Export</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                Generate printable PDFs for your tournament materials.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div style={{ padding: '1.5rem', background: 'var(--bg-dark)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--accent)' }}>Cart Signs</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Print out custom cart signs for all players.</p>
                    <button className="btn" style={{ marginTop: 'auto' }} onClick={() => window.open(`/t/${tournamentId}/admin/print-cart-signs`, '_blank')}>Generate Cart Signs</button>
                </div>
                <div style={{ padding: '1.5rem', background: 'var(--bg-dark)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--accent)' }}>Scorecards</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Print official scorecards with handicaps.</p>
                    <button className="btn" style={{ marginTop: 'auto' }} onClick={() => window.open(`/t/${tournamentId}/admin/print-scorecards`, '_blank')}>Generate Scorecards</button>
                </div>
                <div style={{ padding: '1.5rem', background: 'var(--bg-dark)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--accent)' }}>Results</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Print the final tournament leaderboard.</p>
                    <button className="btn" style={{ marginTop: 'auto' }} onClick={() => window.open(`/t/${tournamentId}/leaderboard?print=true`, '_blank')}>Print Results</button>
                </div>
                <div style={{ padding: '1.5rem', background: 'var(--bg-dark)', borderRadius: 'var(--radius)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--accent)' }}>Statistics</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Print player statistics and hole-by-hole breakdown.</p>
                    <button className="btn" style={{ marginTop: 'auto' }} onClick={() => window.open(`/t/${tournamentId}/stats?print=true`, '_blank')}>Print Statistics</button>
                </div>
            </div>
        </div>
    );
}
