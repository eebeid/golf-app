"use client";

import React, { useMemo } from 'react';
import { Award, Flame, Star, Zap, Target, MinusCircle, AlertCircle } from 'lucide-react';

export default function StatsDashboard({ overallCounts, leaders }) {
    // Colors for our pie chart & UI
    const colors = {
        eagles: '#8b5cf6', // purple
        birdies: '#10b981', // green
        pars: '#3b82f6', // blue
        bogies: '#fef08a', // yellow/amber
        doubles: '#f97316', // orange
        triples: '#ef4444', // red
        blowups: '#7f1d1d'  // dark red / brown
    };

    const labels = {
        eagles: 'Eagles (or better)',
        birdies: 'Birdies',
        pars: 'Pars',
        bogies: 'Bogies',
        doubles: 'Double Bogies',
        triples: 'Triple Bogies',
        blowups: '+4 or worse'
    };

    // Prepare pie chart segments manually mapping SVGs path
    const pieData = useMemo(() => {
        const total = Object.values(overallCounts).reduce((a, b) => a + b, 0);
        if (total === 0) return [];

        let cumulativeAngle = 0;
        return Object.keys(overallCounts).map(key => {
            const value = overallCounts[key];
            const percentage = value / total;
            const angle = percentage * 360;

            // Start coordinates
            const startX = Math.cos((cumulativeAngle - 90) * Math.PI / 180);
            const startY = Math.sin((cumulativeAngle - 90) * Math.PI / 180);

            cumulativeAngle += angle;

            // End coordinates
            const endX = Math.cos((cumulativeAngle - 90) * Math.PI / 180);
            const endY = Math.sin((cumulativeAngle - 90) * Math.PI / 180);

            // Large arc flag
            const largeArcFlag = angle > 180 ? 1 : 0;

            // Fallback for full circle
            const pathData = percentage === 1
                ? `M 0 -1 A 1 1 0 1 1 0 1 A 1 1 0 1 1 0 -1`
                : `M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;

            return {
                key,
                value,
                label: labels[key],
                color: colors[key],
                percentage: (percentage * 100).toFixed(1),
                pathData
            };
        }).filter(d => d.value > 0);
    }, [overallCounts]);

    const totalHolesPlayed = Object.values(overallCounts).reduce((a, b) => a + b, 0);

    return (
        <div>
            {/* Stat Leaders Board */}
            <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={24} color="var(--accent)" /> Player Awards
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '4rem' }}>

                <LeaderCard title="Most Eagles" leader={leaders.eagles} icon={<Flame size={20} color={colors.eagles} />} color={colors.eagles} />
                <LeaderCard title="Most Birdies" leader={leaders.birdies} icon={<Star size={20} color={colors.birdies} />} color={colors.birdies} />
                <LeaderCard title="Most Pars" leader={leaders.pars} icon={<Zap size={20} color={colors.pars} />} color={colors.pars} />
                <LeaderCard title="Most Bogies" leader={leaders.bogies} icon={<Target size={20} color={colors.bogies} />} color={colors.bogies} />
                <LeaderCard title="Most Double Bogies" leader={leaders.doubles} icon={<MinusCircle size={20} color={colors.doubles} />} color={colors.doubles} />
                <LeaderCard title="Most Triple Bogies" leader={leaders.triples} icon={<AlertCircle size={20} color={colors.triples} />} color={colors.triples} />
            </div>

            {/* Overall Distribution Chart */}
            <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={24} color="var(--accent)" /> Total Tournament Breakdown
            </h2>

            {totalHolesPlayed === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No scores have been entered yet to display a breakdown.
                </div>
            ) : (
                <div className="card" style={{ padding: '2rem', display: 'flex', flexWrap: 'wrap', gap: '4rem', justifyContent: 'center', alignItems: 'center' }}>

                    {/* SVG Pie Chart */}
                    <svg viewBox="-1 -1 2 2" style={{ width: '100%', maxWidth: '300px', transform: 'rotate(0deg)' }}>
                        {pieData.map(slice => (
                            <path
                                key={slice.key}
                                d={slice.pathData}
                                fill={slice.color}
                                style={{ stroke: 'var(--bg-card)', strokeWidth: '0.02' }}
                            />
                        ))}
                    </svg>

                    {/* Legend */}
                    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr', flex: '1', minWidth: '250px' }}>
                        {pieData.map(slice => (
                            <div key={slice.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '15px', height: '15px', borderRadius: '4px', backgroundColor: slice.color }}></div>
                                    <span style={{ fontWeight: '600' }}>{slice.label}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)' }}>
                                    <span>{slice.value} <span style={{ fontSize: '0.8rem' }}>holes</span></span>
                                    <span style={{ width: '50px', textAlign: 'right', fontWeight: 'bold' }}>{slice.percentage}%</span>
                                </div>
                            </div>
                        ))}
                        <div style={{ textAlign: 'right', marginTop: '1rem', color: 'var(--text-muted)' }}>
                            Total Holes Logged: <strong>{totalHolesPlayed}</strong>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function LeaderCard({ title, leader, icon, color }) {
    if (!leader || leader.count === 0) return null; // Don't show if nobody has it

    return (
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: `2px solid ${color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {icon} {title}
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)', marginTop: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {leader.name}
            </div>
            <div style={{ fontSize: '1rem', color: color, fontWeight: 'bold' }}>
                {leader.count} <span style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: 'normal' }}>holes</span>
            </div>
        </div>
    );
}
