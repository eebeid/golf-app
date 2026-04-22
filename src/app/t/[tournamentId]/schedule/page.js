"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Calendar, Clock, MapPin, Users, CalendarPlus } from 'lucide-react';
import Image from 'next/image';
import { toDate } from 'date-fns-tz';

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
    const [timezone, setTimezone] = useState('America/New_York');
    const [settings, setSettings] = useState(null);

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

                if (settingsData?.showSchedule === false) {
                    window.location.href = `/t/${tournamentId}`;
                    return;
                }

                setTimezone(settingsData?.timezone || 'America/New_York');
                setSettings(settingsData);

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

    const generateTeeTimeGCalLink = (timeStr, course) => {
        try {
            // Determine the date for this round
            // If we have roundDates in settings, use that, otherwise default to today
            let roundDateStr = new Date().toISOString().split('T')[0];
            if (settings?.roundDates && Array.isArray(settings.roundDates) && settings.roundDates[selectedRound - 1]) {
                const rd = settings.roundDates[selectedRound - 1];
                if (rd.date) {
                    // rd.date is probably in YYYY-MM-DD format already
                    roundDateStr = rd.date.includes('T') ? rd.date.split('T')[0] : rd.date;
                }
            }

            // Parse the time string into 24-hour hours and minutes
            // Try 12-hour format first: "2:30 PM"
            let hours = 0;
            let minutes = 0;

            const match12 = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (match12) {
                hours = parseInt(match12[1], 10);
                minutes = match12[2];
                const ampm = match12[3].toUpperCase();

                if (ampm === 'PM' && hours < 12) hours += 12;
                if (ampm === 'AM' && hours === 12) hours = 0;
            } else {
                // Try 24-hour format: "14:30"
                const match24 = timeStr.match(/(\d+):(\d+)/);
                if (match24) {
                    hours = parseInt(match24[1], 10);
                    minutes = match24[2];
                } else {
                    return null; // Could not parse time
                }
            }

            const hoursStr = hours.toString().padStart(2, '0');

            // Construct the local ISO string
            const localString = `${roundDateStr}T${hoursStr}:${minutes}:00`;

            // Parse in the tournament timezone
            const exactDateObj = toDate(localString, { timeZone: timezone });

            // 4.5 hour round assumed
            const endDateObj = new Date(exactDateObj.getTime() + 4.5 * 60 * 60 * 1000);

            const formatIsoStr = (d) => {
                return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
            };

            const startStr = formatIsoStr(exactDateObj);
            const endStr = formatIsoStr(endDateObj);

            // Use the target timezone formatting to render a nice "Friday, Oct 5th" style date
            const { format } = require('date-fns');
            const displayDateStr = format(exactDateObj, 'EEE, MMM do');

            const text = encodeURIComponent(`${course?.name || 'Golf'} Tee Time`);
            const details = encodeURIComponent(`Round ${selectedRound} - ${displayDateStr}\nGolf tournament round at ${course?.name}`);
            const location = encodeURIComponent(course?.address || course?.name || 'Golf Course');

            return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    return (
        <div className="fade-in">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <img src="/images/schedule-icon.png" alt="Schedule" width={150} height={150} style={{ height: '150px', width: 'auto', borderRadius: 'var(--radius)', boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' }} />
            </div>
            <h1 className="section-title">Schedule &amp; Pairings</h1>

            {!loading && rounds.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '1.1rem' }}>No rounds have been configured yet. Contact the admin to setup this page in the settings.</p>
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
                            <p>No tee times scheduled for Round {selectedRound} yet. Contact the admin to setup this page in the settings.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                            {currentTimes.map((group, idx) => (
                                <div key={idx} className="card">
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        borderBottom: '1px solid var(--glass-border)',
                                        paddingBottom: '0.8rem',
                                        marginBottom: '1rem'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Clock size={20} style={{ color: 'var(--accent)' }} />
                                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{group.time}</span>
                                        </div>
                                        {(() => {
                                            const gCalLink = generateTeeTimeGCalLink(group.time, currentCourse);
                                            if (!gCalLink) return null;
                                            return (
                                                <a
                                                    href={gCalLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="Add to Google Calendar"
                                                    style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', background: 'rgba(212,175,55,0.1)', padding: '6px', borderRadius: '4px' }}
                                                >
                                                    <CalendarPlus size={18} />
                                                </a>
                                            );
                                        })()}
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
