"use client";

import { useState, useEffect } from 'react';
import { Trophy, Star, AlertCircle, Bird, Target, ThumbsUp } from 'lucide-react';

export default function HighlightsFeed({ tournamentId }) {
    const [highlights, setHighlights] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tournamentId) return;

        const fetchHighlights = async () => {
            try {
                // Fetch players and scores to generate highlights dynamically
                // In a real production app, you might have a dedicated /api/highlights endpoint
                // For now, we'll derive them client-side or server-side if we build that route.
                // Let's assume we build a simple API for it or derive it here.

                // Let's use a new API route we will create: /api/highlights
                const res = await fetch(`/api/highlights?tournamentId=${tournamentId}`);
                if (res.ok) {
                    const data = await res.json();
                    setHighlights(data);
                }
            } catch (error) {
                console.error("Failed to fetch highlights", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHighlights();
        const interval = setInterval(fetchHighlights, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [tournamentId]);

    if (loading) return <div className="p-4 text-center text-muted">Loading highlights...</div>;

    if (highlights.length === 0) {
        return (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.05)' }}>
                <Star className="mx-auto mb-2 text-muted" />
                <p className="text-muted">No highlights yet. Start playing!</p>
            </div>
        );
    }

    const getIcon = (type) => {
        switch (type) {
            case 'birdie': return <Bird size={20} color="#4ade80" />;
            case 'eagle': return <Trophy size={20} color="#fbbf24" />;
            case 'streak': return <Star size={20} color="#60a5fa" />;
            case 'blowup': return <AlertCircle size={20} color="#f87171" />; // Triple bogey or worse
            default: return <ThumbsUp size={20} color="var(--text-main)" />;
        }
    };

    return (
        <div className="card fade-in" style={{ padding: 0, overflow: 'hidden', maxHeight: '400px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Target size={18} color="var(--accent)" />
                    Tournament Feed
                </h3>
            </div>

            <div style={{ overflowY: 'auto', padding: '0.5rem' }} className="custom-scrollbar">
                {highlights.map((item, idx) => (
                    <div key={idx} style={{
                        padding: '0.8rem',
                        borderBottom: idx < highlights.length - 1 ? '1px solid var(--glass-border)' : 'none',
                        display: 'flex',
                        gap: '1rem',
                        alignItems: 'start',
                        animationDelay: `${idx * 0.1}s`
                    }} className="fade-in">
                        <div style={{
                            background: 'var(--bg-dark)',
                            padding: '8px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--glass-border)'
                        }}>
                            {getIcon(item.type)}
                        </div>
                        <div>
                            <p style={{ margin: '0 0 0.2rem 0', fontWeight: 'bold', fontSize: '0.95rem' }}>
                                {item.player}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                {item.message}
                            </p>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.7 }}>
                                {item.timeAgo}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Simple styling helper
const styles = `
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.1);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.2);
}
`;
