"use client";

import React, { useMemo, useState } from 'react';
import { Award, Flame, Star, Zap, Target, MinusCircle, AlertCircle, TrendingUp } from 'lucide-react';

const COLORS = {
    eagles: '#8b5cf6',
    birdies: '#10b981',
    pars: '#3b82f6',
    bogies: '#fef08a',
    doubles: '#f97316',
    triples: '#ef4444',
    blowups: '#7f1d1d',
};

const LABELS = {
    eagles: 'Eagles (or better)',
    birdies: 'Birdies',
    pars: 'Pars',
    bogies: 'Bogies',
    doubles: 'Double Bogies',
    triples: 'Triple Bogies',
    blowups: '+4 or worse',
};

const ICONS = {
    eagles: (c) => <Flame size={18} color={c} />,
    birdies: (c) => <Star size={18} color={c} />,
    pars: (c) => <Zap size={18} color={c} />,
    bogies: (c) => <Target size={18} color={c} />,
    doubles: (c) => <MinusCircle size={18} color={c} />,
    triples: (c) => <AlertCircle size={18} color={c} />,
    blowups: (c) => <AlertCircle size={18} color={c} />,
};

// ── Pie (vanilla SVG, no dep) ─────────────────────────────────────────────────
function PieChart({ counts }) {
    const pieData = useMemo(() => {
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        if (total === 0) return [];
        let angle = 0;
        return Object.keys(counts).map(key => {
            const value = counts[key];
            const pct = value / total;
            const sweep = pct * 360;
            const sx = Math.cos((angle - 90) * Math.PI / 180);
            const sy = Math.sin((angle - 90) * Math.PI / 180);
            angle += sweep;
            const ex = Math.cos((angle - 90) * Math.PI / 180);
            const ey = Math.sin((angle - 90) * Math.PI / 180);
            const path = pct === 1
                ? `M 0 -1 A 1 1 0 1 1 0 1 A 1 1 0 1 1 0 -1`
                : `M 0 0 L ${sx} ${sy} A 1 1 0 ${sweep > 180 ? 1 : 0} 1 ${ex} ${ey} Z`;
            return { key, value, path, pct: (pct * 100).toFixed(1) };
        }).filter(d => d.value > 0);
    }, [counts]);

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total === 0) return (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            No scores recorded yet.
        </div>
    );

    return (
        <div className="card" style={{ padding: '2rem', display: 'flex', flexWrap: 'wrap', gap: '3rem', justifyContent: 'center', alignItems: 'center' }}>
            <svg viewBox="-1 -1 2 2" style={{ width: '100%', maxWidth: '240px' }}>
                {pieData.map(s => (
                    <path key={s.key} d={s.path} fill={COLORS[s.key]} style={{ stroke: 'var(--bg-card)', strokeWidth: '0.02' }} />
                ))}
            </svg>
            <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {pieData.map(s => (
                    <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: 12, height: 12, borderRadius: 3, background: COLORS[s.key] }} />
                            <span style={{ fontSize: '0.87rem', fontWeight: 500 }}>{LABELS[s.key]}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            <span>{s.value} holes</span>
                            <span style={{ width: 44, textAlign: 'right', fontWeight: 'bold', color: 'var(--text-main)' }}>{s.pct}%</span>
                        </div>
                    </div>
                ))}
                <div style={{ textAlign: 'right', marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Total Holes Logged: <strong style={{ color: 'var(--text-main)' }}>{total}</strong>
                </div>
            </div>
        </div>
    );
}

// ── Leader cards grid ─────────────────────────────────────────────────────────
function LeadersGrid({ leaders }) {
    const cards = Object.entries(leaders).filter(([, l]) => l.count > 0);
    if (cards.length === 0) return (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1.5rem' }}>
            No leaders yet — scores are still coming in.
        </div>
    );
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
            {cards.map(([cat, leader]) => (
                <div key={cat} className="card" style={{ padding: '1rem', borderTop: `2px solid ${COLORS[cat]}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
                        {ICONS[cat](COLORS[cat])} Most {LABELS[cat]}
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {leader.name}
                    </div>
                    <div style={{ fontSize: '0.95rem', color: COLORS[cat], fontWeight: 'bold', marginTop: '4px' }}>
                        {leader.count} <span style={{ fontSize: '0.75rem', fontWeight: 'normal', opacity: 0.8 }}>holes</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Scoring trend (simple bar chart, no dep) ──────────────────────────────────
function ScoringTrend({ scoringTrend }) {
    const hasData = scoringTrend.some(r => r.avgScore !== null);
    if (!hasData) return null;

    const values = scoringTrend.filter(r => r.avgScore !== null).map(r => r.avgScore);
    const minV = Math.min(...values) - 2;
    const maxV = Math.max(...values) + 2;
    const range = maxV - minV || 1;

    return (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="var(--accent)" /> Avg Score Per Round
            </h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: 120 }}>
                {scoringTrend.map(({ round, avgScore }) => {
                    const heightPct = avgScore !== null ? ((avgScore - minV) / range) * 80 + 10 : 0;
                    return (
                        <div key={round} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                            {avgScore !== null && (
                                <span style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 'bold' }}>{avgScore}</span>
                            )}
                            <div
                                style={{
                                    width: '100%',
                                    height: avgScore !== null ? `${heightPct}%` : 0,
                                    minHeight: avgScore !== null ? 8 : 0,
                                    background: 'linear-gradient(180deg, var(--accent), #b8962e)',
                                    borderRadius: '4px 4px 0 0',
                                    transition: 'height 0.5s ease',
                                }}
                            />
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{round}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function StatsDashboard({ overallCounts, overallLeaders, roundStats, numberOfRounds, scoringTrend }) {
    const [activeTab, setActiveTab] = useState('overall');

    const tabs = [
        { id: 'overall', label: 'Overall' },
        ...Array.from({ length: numberOfRounds }, (_, i) => ({ id: `round-${i + 1}`, label: `Round ${i + 1}` })),
    ];

    const currentCounts = activeTab === 'overall'
        ? overallCounts
        : roundStats[parseInt(activeTab.split('-')[1])]?.counts || overallCounts;

    const currentLeaders = activeTab === 'overall'
        ? overallLeaders
        : roundStats[parseInt(activeTab.split('-')[1])]?.leaders || overallLeaders;

    return (
        <div>
            {/* Tab bar */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '8px 18px',
                            borderRadius: '20px',
                            border: activeTab === tab.id ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
                            background: activeTab === tab.id ? 'rgba(212,175,55,0.15)' : 'transparent',
                            color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            fontWeight: activeTab === tab.id ? '600' : '400',
                            fontSize: '0.88rem',
                            transition: 'all 0.15s',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Round scoring trend (overall tab only) */}
            {activeTab === 'overall' && numberOfRounds > 1 && (
                <ScoringTrend scoringTrend={scoringTrend} />
            )}

            {/* Player Awards */}
            <h2 style={{ fontSize: '1.3rem', color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={22} color="var(--accent)" />
                {activeTab === 'overall' ? 'Tournament Leaders' : `${tabs.find(t => t.id === activeTab)?.label} Leaders`}
            </h2>
            <LeadersGrid leaders={currentLeaders} />

            {/* Score distribution pie */}
            <h2 style={{ fontSize: '1.3rem', color: 'var(--text-main)', margin: '2rem 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={22} color="var(--accent)" /> Score Breakdown
            </h2>
            <PieChart counts={currentCounts} />
        </div>
    );
}
