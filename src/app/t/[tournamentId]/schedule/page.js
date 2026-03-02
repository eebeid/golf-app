"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import Image from 'next/image';

export default function SchedulePage() {
    const params = useParams();
    const tournamentId = params?.tournamentId;

    const [rounds, setRounds] = useState([]);
    const [selectedRound, setSelectedRound] = useState(1);
    const [teeTimes, setTeeTimes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState([]);

    // Map round number to course if possible (using settings data)
    const [courseMapping, setCourseMapping] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            if (!tournamentId) return;

            try {
                const [sRes, setRes, cRes] = await Promise.all([
                    fetch(`/api/schedule?tournamentId=${tournamentId}`),
                    fetch(`/api/settings?tournamentId=${tournamentId}`),
                    fetch(`/api/courses?tournamentId=${tournamentId}`)
                ]);

                const sData = await sRes.json();
                const settingsData = await setRes.json();
                const cData = await cRes.json();

                setCourses(cData);
                if (Array.isArray(sData)) {
                    setTeeTimes(sData);
                } else {
                    setTeeTimes([]);
                }

                if (settingsData && settingsData.numberOfRounds) {
                    setRounds(Array.from({ length: settingsData.numberOfRounds }, (_, i) => i + 1));
                }

                // Map courses
                const mapping = {};
                if (settingsData && settingsData.roundCourses) {
                    settingsData.roundCourses.forEach((id, idx) => {
                        // Ensure loose or strict equality works (API might return string id)
                        mapping[idx + 1] = cData.find(c => c.id == id);
                    });
                }
                setCourseMapping(mapping);

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [tournamentId]);

    const currentTimes = teeTimes
        .filter(t => t.round === selectedRound)
        .sort((a, b) => a.time.localeCompare(b.time));

    const currentCourse = courseMapping[selectedRound];

    return (
        <div className="fade-in">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <Image src="/images/schedule-icon.png" alt="Schedule" width={150} height={150} style={{ height: 'auto', borderRadius: 'var(--radius)', boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' }} />
            </div>
            <h1 className="section-title">Schedule &amp; Pairings</h1>

            {!loading && rounds.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No rounds have been configured yet.
                </div>
            )}

            {rounds.length > 0 && (
                <>
                    {/* Round Tabs */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '10px' }}>
                        {rounds.map(r => (
                            <button
                                key={r}
                                onClick={() => setSelectedRound(r)}
                                className={selectedRound === r ? 'btn' : 'btn-outline'}
                                style={{ minWidth: '100px' }}
                            >
                                Round {r}
                            </button>
                        ))}
                    </div>

                    {/* Course Info */}
                    {currentCourse && (
                        <div className="card" style={{ marginBottom: '2rem', background: 'var(--bg-card)', borderLeft: '4px solid var(--accent)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                <MapPin style={{ color: 'var(--accent)' }} />
                                <h2 style={{ margin: 0 }}>{currentCourse.name}</h2>
                            </div>
                            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                <span>Par {currentCourse.par}</span>
                                {currentCourse.tees && currentCourse.tees[0] && (
                                    <span>{currentCourse.tees[0].yardage.toLocaleString()} yards (Back)</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tee Times Grid */}
                    {loading ? (
                        <div className="spinner"></div>
                    ) : currentTimes.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            <Calendar size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p>No tee times scheduled for Round {selectedRound} yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                            {currentTimes.map((group, idx) => (
                                <div key={idx} className="card">
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        borderBottom: '1px solid var(--glass-border)',
                                        paddingBottom: '0.8rem',
                                        marginBottom: '1rem'
                                    }}>
                                        <Clock size={20} style={{ color: 'var(--accent)' }} />
                                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{group.time}</span>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                        {group.players.map(p => (
                                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                <div style={{
                                                    width: '30px',
                                                    height: '30px',
                                                    borderRadius: '50%',
                                                    background: 'var(--bg-dark)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.8rem',
                                                    color: 'var(--text-muted)'
                                                }}>
                                                    <Users size={14} />
                                                </div>
                                                <span>{p.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
