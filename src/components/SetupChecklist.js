"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';

export default function SetupChecklist({ basePath, stats }) {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        // Default to open if there are incomplete items, closed if all are complete
        const allCompleted = Object.values(stats).every(val => val === true);
        return allCompleted;
    });

    const checklistItems = [
        {
            id: 'name',
            title: 'Configure Tournament Name',
            desc: 'Give your tournament a custom name in Branding Settings',
            completed: stats.nameConfigured,
            tab: 'branding'
        },
        {
            id: 'courses',
            title: 'Add Courses & Coordinates',
            desc: 'Register at least one golf course with address details',
            completed: stats.coursesCount > 0,
            tab: 'courses'
        },
        {
            id: 'players',
            title: 'Register Players',
            desc: 'Add player profiles and emails to enable leaderboards and RSVPs',
            completed: stats.playersCount > 0,
            tab: 'players'
        },
        {
            id: 'lodging',
            title: 'Set Up Accommodations (Optional)',
            desc: 'Define lodging assignments for players',
            completed: stats.lodgingCount > 0,
            tab: 'accommodations'
        },
        {
            id: 'food',
            title: 'Add Dining & Restaurants (Optional)',
            desc: 'Provide restaurant options and reservation times',
            completed: stats.restaurantsCount > 0,
            tab: 'restaurants'
        },
        {
            id: 'activities',
            title: 'Create Trip Activities (Optional)',
            desc: 'Schedule outings, logistics, or dinners to track player RSVPs',
            completed: stats.activitiesCount > 0,
            tab: 'activities'
        },
        {
            id: 'payment',
            title: 'Configure Payment Info',
            desc: 'Provide Venmo, PayPal, or Zelle info so players can settle up',
            completed: stats.paymentConfigured,
            tab: 'payment'
        }
    ];

    const completedCount = checklistItems.filter(item => item.completed).length;
    const progressPercent = Math.round((completedCount / checklistItems.length) * 100);

    return (
        <div className="card glass-panel" style={{
            maxWidth: '600px',
            margin: '0 auto 2rem auto',
            padding: '1.25rem 1.5rem',
            borderLeft: '4px solid var(--accent)',
            background: 'rgba(212, 175, 55, 0.03)'
        }}>
            <div
                onClick={() => setIsCollapsed(!isCollapsed)}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none'
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🛠️ Tournament Setup Checklist
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {completedCount} of {checklistItems.length} setup tasks completed ({progressPercent}%)
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                    {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </div>
            </div>

            {/* Progress Bar */}
            <div style={{
                width: '100%',
                height: '6px',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '3px',
                marginTop: '0.8rem',
                overflow: 'hidden'
            }}>
                <div style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--accent) 0%, #a8871d 100%)',
                    transition: 'width 0.4s ease'
                }} />
            </div>

            {!isCollapsed && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.8rem',
                    marginTop: '1.2rem',
                    borderTop: '1px solid var(--glass-border)',
                    paddingTop: '1rem'
                }}>
                    {checklistItems.map(item => (
                        <Link
                            key={item.id}
                            href={`${basePath}/admin/settings?tab=${item.tab}`}
                            style={{
                                display: 'flex',
                                gap: '0.75rem',
                                alignItems: 'flex-start',
                                textDecoration: 'none',
                                padding: '0.5rem',
                                borderRadius: '8px',
                                background: 'rgba(255, 255, 255, 0.01)',
                                border: '1px solid transparent',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={e => {
                                e.currentTarget.style.background = 'rgba(212, 175, 55, 0.05)';
                                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.15)';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)';
                                e.currentTarget.style.borderColor = 'transparent';
                            }}
                        >
                            <div style={{ flexShrink: 0, marginTop: '2px' }}>
                                {item.completed ? (
                                    <CheckCircle2 size={18} style={{ color: 'var(--success, #2ec4b6)' }} />
                                ) : (
                                    <Circle size={18} style={{ color: 'var(--text-muted)' }} />
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                <span style={{
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    color: item.completed ? 'var(--text-muted)' : 'var(--text-main)',
                                    textDecoration: item.completed ? 'line-through' : 'none'
                                }}>
                                    {item.title}
                                </span>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    {item.desc}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
