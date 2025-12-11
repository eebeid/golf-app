"use client";

export default function CoursesList({ courses }) {

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
                            <img src={course.image} alt={course.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} className="hover-zoom" />
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
                                <a href={`/courses/${course.id}/score`} className="btn">Enter Scores</a>
                            </div>
                            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                                <span>Par: <strong style={{ color: 'var(--text-main)' }}>{course.par}</strong></span>
                                <span>Length: <strong style={{ color: 'var(--text-main)' }}>{course.length}</strong></span>
                            </div>
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
