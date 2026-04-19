"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ArrowRight, Loader, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';
import UpgradeModal from './UpgradeModal';
import TripSetupWizard from './TripSetupWizard';

export default function TournamentList({ initialTournaments, isPro = false }) {
    const { data: session } = useSession();
    const [tournaments, setTournaments] = useState(initialTournaments);
    const [deletingId, setDeletingId] = useState(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [wizardTournament, setWizardTournament] = useState(null); // { id: slug, name }
    const [creatingNew, setCreatingNew] = useState(false);
    const router = useRouter();

    const handleCreateClick = async () => {
        if (!session) { signIn('google'); return; }
        if (!isPro && tournaments.length >= 1) { setShowUpgradeModal(true); return; }

        // Create a stub tournament immediately to get the slug, then open the wizard
        setCreatingNew(true);
        try {
            const res = await fetch('/api/tournaments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'New Tournament' }),
            });
            if (res.ok) {
                const t = await res.json();
                setTournaments(prev => [t, ...prev]);
                setWizardTournament({ id: t.slug, name: '' });
            } else {
                alert('Failed to create tournament. Please try again.');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setCreatingNew(false);
        }
    };

    const handleDeleteClick = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        setDeletingId(id);
    };

    const confirmDelete = async (id) => {
        try {
            const res = await fetch(`/api/tournaments/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setTournaments(tournaments.filter(t => t.id !== id));
                setDeletingId(null);
            } else {
                alert('Failed to delete tournament');
            }
        } catch (err) {
            console.error(err);
            alert('Error deleting tournament');
        }
    };

    const TournamentCard = ({ t }) => {
        const isConfirming = deletingId === t.id;

        if (isConfirming) {
            return (
                <div className="card" style={{ border: '1px solid #ff6b6b', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem', textAlign: 'center', minHeight: '150px' }}>
                    <h3 style={{ color: '#ff6b6b', margin: 0 }}>Delete Tournament?</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>This cannot be undone.</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => setDeletingId(null)} className="btn-outline" style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}>
                            Cancel
                        </button>
                        <button onClick={() => confirmDelete(t.id)} className="btn" style={{ flex: 1, padding: '0.5rem', background: '#ff6b6b', borderColor: '#ff6b6b', fontSize: '0.9rem' }}>
                            Delete
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <Link href={`/t/${t.slug}`} className="card" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'all 0.3s ease', position: 'relative' }}>
                {/* Delete button — owners only */}
                {t.ownerId && session?.user?.id === t.ownerId && (
                    <button
                        onClick={(e) => handleDeleteClick(e, t.id)}
                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,0,0,0.1)', color: 'red', padding: '4px', borderRadius: '4px', border: 'none', cursor: 'pointer', zIndex: 10 }}
                        title="Delete Tournament"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
                <div>
                    <h2 style={{ fontSize: '1.4rem', color: 'var(--accent)', marginBottom: '0.5rem', paddingRight: '2.5rem' }}>{t.name}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Created: {new Date(t.createdAt).toLocaleDateString()}
                        {t.ownerId && session?.user?.id === t.ownerId && (
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--accent)' }}>(Owner)</span>
                        )}
                    </p>
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                    Enter Tournament <ArrowRight size={16} />
                </div>
            </Link>
        );
    };

    return (
        <div>
            <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

            {/*
              Wizard — only opened right after a brand-new tournament is created.
              Closing early redirects to admin settings so setup can be completed there.
            */}
            <TripSetupWizard
                isOpen={!!wizardTournament}
                onClose={() => {
                    if (wizardTournament?.id) router.push(`/t/${wizardTournament.id}/admin/settings`);
                    setWizardTournament(null);
                }}
                onSuccess={() => router.push(`/t/${wizardTournament?.id}`)}
                tournamentId={wizardTournament?.id}
                tournamentName={wizardTournament?.name}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {/* Create-new card */}
                <button
                    onClick={handleCreateClick}
                    disabled={creatingNew}
                    className="card"
                    style={{
                        border: '2px dashed var(--glass-border)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        minHeight: '150px',
                        cursor: creatingNew ? 'wait' : 'pointer',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                    }}
                >
                    {creatingNew
                        ? <Loader className="animate-spin" size={32} style={{ marginBottom: '1rem', opacity: 0.6 }} />
                        : <Plus size={40} style={{ marginBottom: '1rem', opacity: session ? 1 : 0.5 }} />
                    }
                    <span>
                        {!session ? 'Sign In to Create Tournament' : creatingNew ? 'Setting up…' : 'Create New Tournament'}
                    </span>
                </button>

                {tournaments.map(t => <TournamentCard key={t.id} t={t} />)}
            </div>
        </div>
    );
}
