
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ArrowRight, Loader, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';

export default function TournamentList({ initialTournaments }) {
    const { data: session } = useSession();
    const [tournaments, setTournaments] = useState(initialTournaments);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const router = useRouter();

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setLoading(true);
        try {
            const res = await fetch('/api/tournaments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });

            if (res.ok) {
                const tournament = await res.json();
                router.push(`/t/${tournament.slug}`);
            } else {
                alert('Failed to create tournament');
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            setLoading(false);
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
                        <button
                            onClick={() => setDeletingId(null)}
                            className="btn-outline"
                            style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => confirmDelete(t.id)}
                            className="btn"
                            style={{ flex: 1, padding: '0.5rem', background: '#ff6b6b', borderColor: '#ff6b6b', fontSize: '0.9rem' }}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <Link key={t.id} href={`/t/${t.slug}`} className="card" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'all 0.3s ease', position: 'relative' }}>
                {t.ownerId && session?.user?.id === t.ownerId && (
                    <button
                        onClick={(e) => handleDeleteClick(e, t.id)}
                        className="btn-icon"
                        style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            zIndex: 10,
                            background: 'rgba(255, 0, 0, 0.1)',
                            color: 'red',
                            padding: '4px',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                        title="Delete Tournament"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
                <div>
                    <h2 style={{ fontSize: '1.4rem', color: 'var(--accent)', marginBottom: '0.5rem', paddingRight: '2rem' }}>{t.name}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Created: {new Date(t.createdAt).toLocaleDateString()}
                        {t.ownerId && session?.user?.id === t.ownerId && <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--accent)' }}>(Owner)</span>}
                    </p>
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                    Enter Tournament <ArrowRight size={16} />
                </div>
            </Link>
        );
    };

    const CreateCard = () => (
        !isCreating ? (
            <button
                onClick={() => session ? setIsCreating(true) : signIn('google')}
                className="card"
                style={{
                    border: '2px dashed var(--glass-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '150px',
                    cursor: 'pointer',
                    background: 'transparent',
                    color: 'var(--text-muted)'
                }}
            >
                <Plus size={40} style={{ marginBottom: '1rem', opacity: session ? 1 : 0.5 }} />
                <span>{session ? 'Create New Tournament' : 'Sign In to Create Tournament'}</span>
            </button>
        ) : (
            <div className="card" style={{ border: '1px solid var(--accent)' }}>
                <h3 style={{ marginBottom: '1rem' }}>New Tournament</h3>
                <form onSubmit={handleCreate}>
                    <input
                        type="text"
                        placeholder="Tournament Name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.8rem',
                            borderRadius: '8px',
                            border: '1px solid var(--glass-border)',
                            background: 'var(--bg-dark)',
                            color: 'var(--text-main)',
                            marginBottom: '1rem'
                        }}
                        autoFocus
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={() => { setIsCreating(false); setLoading(false); }}
                            className="btn-outline"
                            style={{ flex: 1, padding: '0.6rem' }}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn"
                            style={{ flex: 1, padding: '0.6rem' }}
                            disabled={loading}
                        >
                            {loading ? <Loader className="animate-spin" size={18} /> : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        )
    );

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {/* Always show CreateCard if session exists, OR if we want to encourage sign in */}
            <CreateCard />
            {tournaments.map(t => <TournamentCard key={t.id} t={t} />)}
        </div>
    );
}
