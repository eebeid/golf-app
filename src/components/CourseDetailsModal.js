"use client";

import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function CourseDetailsModal({ course, onClose }) {
    // Prevent background scroll when modal is open and handle escape key
    useEffect(() => {
        document.body.style.overflow = 'hidden';

        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    if (!course) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 9999,
            backdropFilter: 'blur(5px)'
        }} onClick={onClose}>
            <div
                className="glass-panel custom-scrollbar"
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '100%',
                    maxWidth: '600px',
                    maxHeight: '600px',
                    overflowY: 'auto',
                    padding: '1.5rem',
                    background: 'var(--bg-card)',
                }}
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                    }}
                >
                    <X size={24} />
                </button>

                <h2 style={{
                    fontSize: '1.5rem',
                    color: 'var(--accent)',
                    marginBottom: '1rem',
                    paddingRight: '2rem'
                }}>
                    {course.name}
                </h2>

                {/* Course Stats Summary */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                    gap: '0.75rem',
                    marginBottom: '1.25rem',
                    color: 'var(--text-muted)',
                    borderBottom: '1px solid var(--glass-border)',
                    paddingBottom: '0.75rem'
                }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>Par</div>
                        <strong style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>{course.par}</strong>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>Length</div>
                        <strong style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>{course.length}</strong>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>Rating</div>
                        <strong style={{ color: 'var(--accent)', fontSize: '1.1rem' }}>{course.rating}</strong>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>Slope</div>
                        <strong style={{ color: 'var(--accent)', fontSize: '1.1rem' }}>{course.slope}</strong>
                    </div>
                </div>

                {/* Tee Table */}
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>Tee Information</h3>
                <div style={{ overflowX: 'auto', marginBottom: '1.25rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                                <th style={{ padding: '0.5rem', color: 'var(--accent)' }}>Tee</th>
                                <th style={{ padding: '0.5rem', color: 'var(--accent)' }}>Yardage</th>
                                <th style={{ padding: '0.5rem', color: 'var(--accent)' }}>Rating</th>
                                <th style={{ padding: '0.5rem', color: 'var(--accent)' }}>Slope</th>
                            </tr>
                        </thead>
                        <tbody>
                            {course.tees && course.tees.map((tee, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '0.5rem', fontWeight: '500' }}>{tee.name}</td>
                                    <td style={{ padding: '0.5rem' }}>{tee.yardage.toLocaleString()}</td>
                                    <td style={{ padding: '0.5rem' }}>{tee.rating}</td>
                                    <td style={{ padding: '0.5rem' }}>{tee.slope}</td>
                                </tr>
                            ))}
                            {!course.tees && (
                                <tr>
                                    <td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No specific tee information available.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Description or extra info */}
                <div>
                    <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>About</h3>
                    <p style={{ lineHeight: 1.5, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{course.description}</p>
                </div>

            </div>
        </div>
    );
}
