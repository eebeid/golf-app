"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2 } from 'lucide-react';
import ScorecardEditorModal from './ScorecardEditorModal';

export default function AdminScorecardTable({ cards, courses }) {
    const router = useRouter();
    const [selectedCard, setSelectedCard] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleEdit = (card) => {
        setSelectedCard(card);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        router.refresh(); // Re-fetch server data
    };

    const getCourseForCard = (card) => {
        if (!card || !courses) return null;
        return courses.find(c => c.id === card.courseId);
    };

    return (
        <>
            <div className="glass-panel" style={{ padding: '2rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem', color: 'var(--accent)' }}>Player</th>
                            <th style={{ padding: '1rem', color: 'var(--accent)' }}>Course</th>
                            <th style={{ padding: '1rem', color: 'var(--accent)' }}>Holes Played</th>
                            <th style={{ padding: '1rem', color: 'var(--accent)' }}>Total Score</th>
                            <th style={{ padding: '1rem', color: 'var(--accent)' }}>Date Started</th>
                            <th style={{ padding: '1rem', color: 'var(--accent)' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cards.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No scorecards found.
                                </td>
                            </tr>
                        ) : (
                            cards.map(card => (
                                <tr key={card.key} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '1rem' }}>{card.playerName}</td>
                                    <td style={{ padding: '1rem' }}>{card.courseName}</td>
                                    <td style={{ padding: '1rem' }}>{card.holesPlayed} / 18</td>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{card.totalScore}</td>
                                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                                        {new Date(card.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <button
                                            onClick={() => handleEdit(card)}
                                            className="btn-outline"
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                        >
                                            <Edit2 size={14} />
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && selectedCard && (
                <ScorecardEditorModal
                    scorecard={selectedCard}
                    course={getCourseForCard(selectedCard)}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                />
            )}
        </>
    );
}
