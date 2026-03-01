"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { Clock, Users, ChevronDown, ChevronUp } from 'lucide-react';

export default function CoursesList({ courses, teeTimes = [] }) {
    const [expandedCourseId, setExpandedCourseId] = useState(null);

    const toggleCourseDetails = (id) => {
        setExpandedCourseId(expandedCourseId === id ? null : id);
    };



    return (
        <div className="fade-in">
            <h1 className="section-title">The Courses</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
                {courses.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        No courses selected yet.
                    </div>
                )}
                {courses.map((course, index) => (
                    <div key={course.id} className="glass-panel" style={{
                        display: 'flex',
                        flexDirection: 'column', // Mobile first
                        gap: '2rem',
                        padding: '2rem',
                        overflow: 'hidden'
                    }}>
                        {course.image ? (
                            <div
                                style={{
                                    width: '100%',
                                    borderRadius: 'var(--radius)',
                                    overflow: 'hidden',
                                    height: '300px',
                                    cursor: 'pointer'
                                }}
                                onClick={() => toggleCourseDetails(course.id)}
                            >
                                <div style={{ position: 'relative', width: '100%', height: '200px' }}>
                                    <Image
                                        src={course.image}
                                        alt={course.name}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                        className="hover-zoom"
                                    />
                                </div>
                            </div>
                        ) : null}

                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <h2
                                    style={{
                                        fontSize: '2rem',
                                        color: 'var(--accent)',
                                        marginBottom: '1rem',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => toggleCourseDetails(course.id)}
                                    className="hover-underline"
                                >
                                    {course.name}
                                </h2>
                            </div>
                            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                                <span>Par: <strong style={{ color: 'var(--text-main)' }}>{course.par}</strong></span>
                                <span>Length: <strong style={{ color: 'var(--text-main)' }}>{course.length}</strong></span>
                            </div>

                            {course.playDates && course.playDates.length > 0 && (
                                <div style={{ marginBottom: '1.5rem', color: 'var(--accent)', fontWeight: 'bold' }}>
                                    Playing on: {course.playDates.map(d => {
                                        const [y, m, day] = d.split('-');
                                        return new Date(y, m - 1, day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
                                    }).join(', ')}
                                </div>
                            )}

                            {/* Tee Times for this Course */}
                            {(() => {
                                // Find which round this course is for
                                // course.playDates is derived from settings in parent
                                // But we also need to know the ROUND number to match teeTimes
                                // The paren logic: settings.roundCourses.forEach((id, idx) => ...) where idx+1 is round
                                // So let's check course.roundNumber (need to add this in parent first or infer here)

                                // Actually, simpler: we passed 'playDates' but not 'round'.
                                // Let's infer round from matching course ID in settings (not passed here).
                                // Alternative: Filter teeTimes by comparing... wait, teeTimes has 'round'. 
                                // We don't have 'round' on the course object here.

                                // Let's just display ALL tee times that match the course's play date? 
                                // No, teeTimes are by round number.
                                // We need the round number.

                                // Let's assume the parent 'CoursesPage' logic (which we edited) mapped dates but didn't attach round number.
                                // I'll update CoursesPage to attach 'round' to course object.
                                // For now, I'll write the display logic assuming `course.rounds` exists (array of round numbers).

                                // EDIT: I will rely on the parent component update I'll do next.
                                const courseRounds = course.rounds || [];
                                const relevantTimes = teeTimes.filter(t => courseRounds.includes(t.round));

                                if (relevantTimes.length === 0) return null;

                                return (
                                    <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-card)', borderRadius: 'var(--radius)', borderLeft: '4px solid var(--accent)' }}>
                                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Clock size={20} />
                                            Tee Times
                                        </h3>
                                        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                                            {relevantTimes.map(time => (
                                                <div key={time.id} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                                                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: 'var(--accent)' }}>
                                                        {time.time} - Round {time.round}
                                                    </div>
                                                    <div style={{ fontSize: '0.9rem' }}>
                                                        {time.players.map(p => p.name).join(', ')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                            <p style={{ marginBottom: '2rem', lineHeight: 1.8 }}>{course.description}</p>

                            <button
                                onClick={() => toggleCourseDetails(course.id)}
                                className="btn-outline"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '8px 16px',
                                    borderRadius: 'var(--radius)',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    marginBottom: '1rem'
                                }}
                            >
                                {expandedCourseId === course.id ? (
                                    <>Collapse Details <ChevronUp size={16} /></>
                                ) : (
                                    <>View Tee Details <ChevronDown size={16} /></>
                                )}
                            </button>

                            {/* Slide out expanded details */}
                            {expandedCourseId === course.id && (
                                <div style={{
                                    marginTop: '1rem',
                                    padding: '1.5rem',
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    borderRadius: 'var(--radius)',
                                    border: '1px solid rgba(212, 175, 55, 0.2)'
                                }}>
                                    <h3 style={{ marginBottom: '1rem', color: 'var(--accent)', fontSize: '1.2rem' }}>Tee Information</h3>

                                    <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.2)', color: 'var(--accent)' }}>
                                                    <th style={{ padding: '0.75rem' }}>Tee</th>
                                                    <th style={{ padding: '0.75rem' }}>Yardage</th>
                                                    <th style={{ padding: '0.75rem' }}>Rating</th>
                                                    <th style={{ padding: '0.75rem' }}>Slope</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {course.tees && course.tees.length > 0 ? (
                                                    course.tees.map((tee, i) => (
                                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                                            <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{tee.name}</td>
                                                            <td style={{ padding: '0.75rem' }}>{tee.yardage?.toLocaleString()}</td>
                                                            <td style={{ padding: '0.75rem' }}>{tee.rating}</td>
                                                            <td style={{ padding: '0.75rem' }}>{tee.slope}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                            No tee information available
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {course.holes && course.holes.length > 0 && course.holes.some(h => h && h.desc) && (
                                        <div>
                                            <h3 style={{ marginBottom: '1rem', color: 'var(--accent)', fontSize: '1.2rem' }}>Key Holes</h3>
                                            <div style={{ display: 'grid', gap: '1rem' }}>
                                                {course.holes.filter(h => h && h.desc).map((hole, i) => (
                                                    <div key={`${course.id}-hole-${hole.number}-${i}`} style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                            <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Hole {hole.number}</span>
                                                            <span style={{ color: 'var(--text-muted)' }}>Par {hole.par}</span>
                                                        </div>
                                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>{hole.desc}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}


                        </div>
                    </div>
                ))}
            </div>

            <style jsx global>{`
                .hover-zoom:hover {
                    transform: scale(1.05);
                }
                .hover-underline:hover {
                    text-decoration: underline;
                }
            `}</style>
        </div >
    );
}
