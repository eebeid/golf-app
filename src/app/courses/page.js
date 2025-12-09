import { getData } from '@/lib/data';

export default async function CoursesPage() {
    const courses = await getData('courses');

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
                        <div style={{ width: '100%', borderRadius: 'var(--radius)', overflow: 'hidden', height: '300px' }}>
                            <img src={course.image} alt={course.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <h2 style={{ fontSize: '2rem', color: 'var(--accent)', marginBottom: '1rem' }}>{course.name}</h2>
                                <a href={`/courses/${course.id}/score`} className="btn">Enter Scores</a>
                            </div>
                            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                                <span>Par: <strong style={{ color: 'var(--text-main)' }}>{course.par}</strong></span>
                                <span>Length: <strong style={{ color: 'var(--text-main)' }}>{course.length}</strong></span>
                            </div>
                            <p style={{ marginBottom: '2rem', lineHeight: 1.8 }}>{course.description}</p>

                            {course.holes && course.holes.length > 0 && (
                                <div>
                                    <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Key Holes</h3>
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        {course.holes.map(hole => (
                                            <div key={hole.number} style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius)' }}>
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
        </div>
    );
}
