"use client";
import Image from 'next/image';
import Link from 'next/link';

import { Clock, Users } from 'lucide-react';

export default function CoursesList({ courses, teeTimes = [] }) {

    // Helper function to open course details in popup window
    const openCourseDetails = (course) => {
        const popup = window.open('', '_blank', 'width=700,height=700,scrollbars=yes,resizable=yes');
        if (popup) {
            popup.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${course.name} - Tee Details</title>
                    <style>
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                            color: #e0e0e0;
                            padding: 2rem;
                            line-height: 1.6;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            background: rgba(255, 255, 255, 0.05);
                            backdrop-filter: blur(10px);
                            border: 1px solid rgba(212, 175, 55, 0.2);
                            border-radius: 12px;
                            padding: 2rem;
                        }
                        h1 {
                            color: #d4af37;
                            font-size: 2rem;
                            margin-bottom: 1.5rem;
                            border-bottom: 2px solid #d4af37;
                            padding-bottom: 0.5rem;
                        }
                        .stats-grid {
                            display: grid;
                            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                            gap: 1rem;
                            margin-bottom: 2rem;
                            padding: 1rem;
                            background: rgba(0, 0, 0, 0.2);
                            border-radius: 8px;
                        }
                        .stat {
                            text-align: center;
                        }
                        .stat-label {
                            font-size: 0.85rem;
                            color: #999;
                            margin-bottom: 0.25rem;
                        }
                        .stat-value {
                            font-size: 1.5rem;
                            font-weight: bold;
                            color: #d4af37;
                        }
                        h2 {
                            color: #d4af37;
                            font-size: 1.5rem;
                            margin: 2rem 0 1rem;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 2rem;
                            background: rgba(0, 0, 0, 0.2);
                            border-radius: 8px;
                            overflow: hidden;
                        }
                        th {
                            background: rgba(212, 175, 55, 0.2);
                            color: #d4af37;
                            padding: 0.75rem;
                            text-align: left;
                            font-weight: 600;
                        }
                        td {
                            padding: 0.75rem;
                            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                        }
                        tr:last-child td {
                            border-bottom: none;
                        }
                        tr:hover {
                            background: rgba(212, 175, 55, 0.1);
                        }
                        .description {
                            padding: 1rem;
                            background: rgba(0, 0, 0, 0.2);
                            border-radius: 8px;
                            border-left: 3px solid #d4af37;
                            line-height: 1.8;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>${course.name}</h1>
                        
                        <div class="stats-grid">
                            <div class="stat">
                                <div class="stat-label">Par</div>
                                <div class="stat-value">${course.par}</div>
                            </div>
                            <div class="stat">
                                <div class="stat-label">Length</div>
                                <div class="stat-value">${course.length}</div>
                            </div>
                            <div class="stat">
                                <div class="stat-label">Rating</div>
                                <div class="stat-value">${course.rating}</div>
                            </div>
                            <div class="stat">
                                <div class="stat-label">Slope</div>
                                <div class="stat-value">${course.slope}</div>
                            </div>
                        </div>

                        <h2>Tee Information</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Tee</th>
                                    <th>Yardage</th>
                                    <th>Rating</th>
                                    <th>Slope</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${course.tees ? course.tees.map(tee => `
                                    <tr>
                                        <td><strong>${tee.name}</strong></td>
                                        <td>${tee.yardage.toLocaleString()}</td>
                                        <td>${tee.rating}</td>
                                        <td>${tee.slope}</td>
                                    </tr>
                                `).join('') : '<tr><td colspan="4" style="text-align: center; color: #999;">No tee information available</td></tr>'}
                            </tbody>
                        </table>

                        <h2>About</h2>
                        <div class="description">
                            ${course.description}
                        </div>
                    </div>
                </body>
                </html>
            `);
            popup.document.close();
        }
    };

    return (
        <div className="fade-in">
            <h1 className="section-title">The Courses</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
                {courses.map((course, index) => (
                    <div key={course.id} className="glass-panel" style={{
                        display: 'flex',
                        flexDirection: 'column', // Mobile first
                        gap: '2rem',
                        padding: '2rem',
                        overflow: 'hidden'
                    }}>
                        <div
                            style={{
                                width: '100%',
                                borderRadius: 'var(--radius)',
                                overflow: 'hidden',
                                height: '300px',
                                cursor: 'pointer'
                            }}
                            onClick={() => openCourseDetails(course)}
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

                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <h2
                                    style={{
                                        fontSize: '2rem',
                                        color: 'var(--accent)',
                                        marginBottom: '1rem',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => openCourseDetails(course)}
                                    className="hover-underline"
                                >
                                    {course.name}
                                </h2>
                                <Link
                                    href={`/play${course.rounds && course.rounds.length > 0 ? `?round=${course.rounds[0]}` : ''}`}
                                    className="btn"
                                >
                                    Enter Scores
                                </Link>
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
                                onClick={() => {
                                    const popup = window.open('', '_blank', 'width=700,height=700,scrollbars=yes,resizable=yes');
                                    if (popup) {
                                        popup.document.write(`
                                            <!DOCTYPE html>
                                            <html>
                                            <head>
                                                <title>${course.name} - Tee Details</title>
                                                <style>
                                                    * {
                                                        margin: 0;
                                                        padding: 0;
                                                        box-sizing: border-box;
                                                    }
                                                    body {
                                                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                                        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                                                        color: #e0e0e0;
                                                        padding: 2rem;
                                                        line-height: 1.6;
                                                    }
                                                    .container {
                                                        max-width: 600px;
                                                        margin: 0 auto;
                                                        background: rgba(255, 255, 255, 0.05);
                                                        backdrop-filter: blur(10px);
                                                        border: 1px solid rgba(212, 175, 55, 0.2);
                                                        border-radius: 12px;
                                                        padding: 2rem;
                                                    }
                                                    h1 {
                                                        color: #d4af37;
                                                        font-size: 2rem;
                                                        margin-bottom: 1.5rem;
                                                        border-bottom: 2px solid #d4af37;
                                                        padding-bottom: 0.5rem;
                                                    }
                                                    .stats-grid {
                                                        display: grid;
                                                        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                                                        gap: 1rem;
                                                        margin-bottom: 2rem;
                                                        padding: 1rem;
                                                        background: rgba(0, 0, 0, 0.2);
                                                        border-radius: 8px;
                                                    }
                                                    .stat {
                                                        text-align: center;
                                                    }
                                                    .stat-label {
                                                        font-size: 0.85rem;
                                                        color: #999;
                                                        margin-bottom: 0.25rem;
                                                    }
                                                    .stat-value {
                                                        font-size: 1.5rem;
                                                        font-weight: bold;
                                                        color: #d4af37;
                                                    }
                                                    h2 {
                                                        color: #d4af37;
                                                        font-size: 1.5rem;
                                                        margin: 2rem 0 1rem;
                                                    }
                                                    table {
                                                        width: 100%;
                                                        border-collapse: collapse;
                                                        margin-bottom: 2rem;
                                                        background: rgba(0, 0, 0, 0.2);
                                                        border-radius: 8px;
                                                        overflow: hidden;
                                                    }
                                                    th {
                                                        background: rgba(212, 175, 55, 0.2);
                                                        color: #d4af37;
                                                        padding: 0.75rem;
                                                        text-align: left;
                                                        font-weight: 600;
                                                    }
                                                    td {
                                                        padding: 0.75rem;
                                                        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                                                    }
                                                    tr:last-child td {
                                                        border-bottom: none;
                                                    }
                                                    tr:hover {
                                                        background: rgba(212, 175, 55, 0.1);
                                                    }
                                                    .description {
                                                        padding: 1rem;
                                                        background: rgba(0, 0, 0, 0.2);
                                                        border-radius: 8px;
                                                        border-left: 3px solid #d4af37;
                                                        line-height: 1.8;
                                                    }
                                                </style>
                                            </head>
                                            <body>
                                                <div class="container">
                                                    <h1>${course.name}</h1>
                                                    
                                                    <div class="stats-grid">
                                                        <div class="stat">
                                                            <div class="stat-label">Par</div>
                                                            <div class="stat-value">${course.par}</div>
                                                        </div>
                                                        <div class="stat">
                                                            <div class="stat-label">Length</div>
                                                            <div class="stat-value">${course.length}</div>
                                                        </div>
                                                        <div class="stat">
                                                            <div class="stat-label">Rating</div>
                                                            <div class="stat-value">${course.rating}</div>
                                                        </div>
                                                        <div class="stat">
                                                            <div class="stat-label">Slope</div>
                                                            <div class="stat-value">${course.slope}</div>
                                                        </div>
                                                    </div>

                                                    <h2>Tee Information</h2>
                                                    <table>
                                                        <thead>
                                                            <tr>
                                                                <th>Tee</th>
                                                                <th>Yardage</th>
                                                                <th>Rating</th>
                                                                <th>Slope</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            ${course.tees ? course.tees.map(tee => `
                                                                <tr>
                                                                    <td><strong>${tee.name}</strong></td>
                                                                    <td>${tee.yardage.toLocaleString()}</td>
                                                                    <td>${tee.rating}</td>
                                                                    <td>${tee.slope}</td>
                                                                </tr>
                                                            `).join('') : '<tr><td colspan="4" style="text-align: center; color: #999;">No tee information available</td></tr>'}
                                                        </tbody>
                                                    </table>

                                                    <h2>About</h2>
                                                    <div class="description">
                                                        ${course.description}
                                                    </div>
                                                </div>
                                            </body>
                                            </html>
                                        `);
                                        popup.document.close();
                                    }
                                }}
                                className="btn-outline"
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: 'var(--radius)',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                View Tee Details
                            </button>

                            {Array.isArray(course.holes) && course.holes.some(h => h && h.desc) && (
                                <div style={{ marginTop: '2rem' }}>
                                    <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Key Holes</h3>
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        {course.holes.filter(h => h && h.desc).slice(0, 2).map((hole, i) => (
                                            <div key={`${course.id}-hole-${hole.number}-${i}`} style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Hole {hole.number}</span>
                                                    <span>Par {hole.par}</span>
                                                </div>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{hole.desc}</p>
                                            </div>
                                        ))}
                                    </div>
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
        </div>
    );
}
