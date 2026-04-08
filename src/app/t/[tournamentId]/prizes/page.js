
import prisma from '@/lib/prisma';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function PrizesPage({ params }) {
    const { tournamentId } = await params;
    const slug = tournamentId;

    const tournament = await prisma.tournament.findFirst({
        where: { OR: [{ id: tournamentId }, { slug: tournamentId }] }
    });

    const settings = await prisma.settings.findFirst({
        where: {
            tournament: {
                OR: [{ id: tournamentId }, { slug: tournamentId }]
            }
        }
    });

    const courses = tournament
        ? await prisma.course.findMany({ where: { tournamentId: tournament.id } })
        : [];

    const prizesTitle = settings?.prizesTitle || 'Tournament Prizes';

    if (settings?.showPrizes === false) {
        redirect(`/t/${tournamentId}`);
    }
    const prizes = (settings?.prizes && Array.isArray(settings.prizes)) ? settings.prizes : [];
    const closestToPin = (settings?.closestToPin && Array.isArray(settings.closestToPin)) ? settings.closestToPin : [];
    const longDrive = (settings?.longDrive && Array.isArray(settings.longDrive)) ? settings.longDrive : [];

    const getCourse = (courseId) => courses.find(c => c.id === courseId);

    const specialCardStyle = {
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        border: '1px solid rgba(212,175,55,0.3)',
        borderRadius: 'var(--radius)',
        background: 'rgba(212,175,55,0.05)'
    };

    return (
        <div className="fade-in">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <Image
                    src="/images/trophy.png"
                    alt="Tournament Trophy"
                    width={150}
                    height={150}
                    style={{
                        height: 'auto',
                        borderRadius: 'var(--radius)',
                        boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)'
                    }}
                />
            </div>
            <h1 className="section-title">{prizesTitle}</h1>

            {prizes.length === 0 && closestToPin.length === 0 && longDrive.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No prizes announced yet.
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>

                    {/* Regular prizes */}
                    {prizes.map((prize, index) => (
                        <div key={index} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <h3 style={{ color: 'var(--accent)', margin: 0, fontSize: '1.3rem' }}>{prize.title}</h3>
                            <div style={{ fontSize: '1rem', color: 'var(--text-main)', flex: 1 }}>{prize.description}</div>
                            {prize.value && (
                                <div style={{
                                    marginTop: '1rem',
                                    paddingTop: '1rem',
                                    borderTop: '1px solid var(--glass-border)',
                                    color: '#4ade80',
                                    fontWeight: 'bold',
                                    fontSize: '1.1rem'
                                }}>
                                    {prize.value}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Closest to Pin */}
                    {closestToPin.length > 0 && (
                        <div style={specialCardStyle}>
                            <h3 style={{ color: 'var(--accent)', margin: 0, fontSize: '1.3rem' }}>📍 Closest to Pin</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {closestToPin.map((entry, i) => {
                                    const course = getCourse(entry.courseId);
                                    return (
                                        <div key={i} style={{ fontSize: '0.95rem', color: 'var(--text-muted)', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                            <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Hole {entry.hole}</span>
                                            {course && <span>— {course.name}</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Long Drive */}
                    {longDrive.length > 0 && (
                        <div style={specialCardStyle}>
                            <h3 style={{ color: 'var(--accent)', margin: 0, fontSize: '1.3rem' }}>💥 Long Drive</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {longDrive.map((entry, i) => {
                                    const course = getCourse(entry.courseId);
                                    return (
                                        <div key={i} style={{ fontSize: '0.95rem', color: 'var(--text-muted)', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                            <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Hole {entry.hole}</span>
                                            {course && <span>— {course.name}</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}
