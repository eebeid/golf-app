"use client";

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, Settings as SettingsIcon } from 'lucide-react';
import BudgetSettingsTab from '@/components/settings/BudgetSettingsTab';

export default function TournamentBudgetPage({ params }) {
    const { tournamentId } = use(params);
    const { data: session } = useSession();
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tournamentId) return;
        fetch(`/api/players?tournamentId=${tournamentId}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setPlayers(data);
            })
            .catch(err => console.error('Failed to load players:', err))
            .finally(() => setLoading(false));
    }, [tournamentId]);

    return (
        <div className="container fade-in" style={{ padding: '2rem 1rem', maxWidth: '1100px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Link
                        href={`/t/${tournamentId}`}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            color: 'var(--text-muted)',
                            textDecoration: 'none'
                        }}
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="section-title" style={{ margin: 0, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>💰</span> Tournament Budget & Expenses
                        </h1>
                        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Cost planner, player dues calculator & expense tracking
                        </p>
                    </div>
                </div>

                <Link
                    href={`/t/${tournamentId}/admin/settings?tab=budget`}
                    className="btn-outline"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                >
                    <SettingsIcon size={16} /> Open in Settings
                </Link>
            </div>

            {/* Main Budget Dashboard */}
            <BudgetSettingsTab
                tournamentId={tournamentId}
                players={players}
            />
        </div>
    );
}

