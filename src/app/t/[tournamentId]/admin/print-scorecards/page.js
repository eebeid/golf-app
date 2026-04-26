"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Printer, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function PrintScorecardsPage() {
    const params = useParams();
    const tournamentId = params?.tournamentId;

    const [players, setPlayers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [settings, setSettings] = useState(null);
    const [teeTimes, setTeeTimes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRound, setSelectedRound] = useState(1);

    useEffect(() => {
        const loadData = async () => {
            if (!tournamentId) return;

            try {
                const [pRes, cRes, sRes, tRes] = await Promise.all([
                    fetch(`/api/players?tournamentId=${tournamentId}`),
                    fetch(`/api/courses?tournamentId=${tournamentId}`),
                    fetch(`/api/settings?tournamentId=${tournamentId}`),
                    fetch(`/api/schedule?tournamentId=${tournamentId}`)
                ]);

                if (pRes.ok) setPlayers(await pRes.json());
                if (cRes.ok) setCourses(await cRes.json());
                if (sRes.ok) setSettings(await sRes.json());
                if (tRes.ok) setTeeTimes(await tRes.json());

            } catch (err) {
                console.error("Failed to load data", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [tournamentId]);

    if (loading) return <div className="fade-in" style={{ padding: '4rem', textAlign: 'center' }}><Loader2 className="animate-spin" /> Loading data...</div>;

    const rounds = Array.from({ length: settings?.numberOfRounds || 0 }, (_, i) => i + 1);
    const currentCourseId = settings?.roundCourses?.[selectedRound - 1];
    const currentCourse = courses.find(c => c.id === currentCourseId);
    const currentGroups = teeTimes
        .filter(t => t.round === selectedRound)
        .sort((a, b) => a.time.localeCompare(b.time));

    const calculateStrokes = (player, course, roundNum) => {
        if (!player || !course) return Array(18).fill(0);

        // 1. Get Course Handicap (CH)
        let ch = Math.round(player.handicapIndex || 0);

        // Check dynamic courseData or legacy columns
        const cd = player.courseData?.[course.id] || {};
        if (cd.hcp !== undefined) {
            ch = cd.hcp;
        } else {
            const cName = course.name.toLowerCase();
            if (cName.includes('plantation')) ch = player.hcpPlantation || ch;
            else if (cName.includes('river')) ch = player.hcpRiver || ch;
            else if (cName.includes('royal') || cName.includes('rnk')) ch = player.hcpRNK || ch;
        }

        // 2. Apply Round Percentage
        const hcpPctStr = settings?.roundHandicaps?.[roundNum - 1];
        if (hcpPctStr) {
            const pct = parseFloat(hcpPctStr);
            if (!isNaN(pct)) {
                ch = Math.round(ch * (pct / 100));
            }
        }
        // 3. Apply max handicap cap (after percentage)
        if (settings?.maxHandicap != null && ch > settings.maxHandicap) {
            ch = settings.maxHandicap;
        }

        // 3. Distribute over 18 holes
        const strokesPerHole = Array(18).fill(0);
        const holes = course.holes || [];

        // Determine the player's tee to use for handicap indexes
        let playerTeeName = cd.tee || null;
        let selectedTee = null;
        if (playerTeeName && Array.isArray(course.tees)) {
            selectedTee = course.tees.find(t => t.name === playerTeeName);
        }

        for (let i = 0; i < 18; i++) {
            const holeNum = i + 1;
            const holeData = holes.find(h => h.number === holeNum);
            let si = holeData?.handicapIndex || 18;

            // If the player's tee has specific handicaps defined, use those instead
            if (selectedTee && Array.isArray(selectedTee.handicaps)) {
                const teeHcp = selectedTee.handicaps.find(h => h.hole === holeNum);
                if (teeHcp && teeHcp.index) {
                    si = parseInt(teeHcp.index) || si;
                }
            }

            const base = Math.floor(ch / 18);
            const remainder = ch % 18;
            strokesPerHole[i] = base + (si <= remainder ? 1 : 0);
        }

        return strokesPerHole;
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fade-in">
            {/* Header / UI Controls (Hidden on Print) */}
            <div className="no-print" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <Link href={`/t/${tournamentId}/admin/settings`} style={{ color: 'var(--text-muted)' }}>
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="section-title" style={{ margin: 0 }}>Print Scorecards</h1>
                </div>

                <div className="card" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {rounds.map(r => (
                            <button
                                key={r}
                                onClick={() => setSelectedRound(r)}
                                className={selectedRound === r ? 'btn' : 'btn-outline'}
                                style={{ padding: '0.5rem 1rem' }}
                            >
                                Round {r}
                            </button>
                        ))}
                    </div>
                    <button onClick={handlePrint} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Printer size={20} />
                        Print All Groups
                    </button>
                </div>

                {!currentCourse && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No course assigned to Round {selectedRound} in settings.
                    </div>
                )}
            </div>

            {/* Printable Area */}
            <div className="print-container">
                {currentGroups.map((group, gIdx) => (
                    <div key={group.id} className="printable-scorecard" style={{
                        pageBreakAfter: 'always',
                        marginBottom: '40px',
                        padding: '20px',
                        background: '#fff',
                        color: '#000',
                        fontFamily: 'sans-serif',
                        border: '2px solid #000',
                        borderRadius: '0'
                    }}>
                        {/* Scorecard Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                            <div>
                                <h2 style={{ margin: 0, textTransform: 'uppercase', fontSize: '1.4rem' }}>{settings?.tournamentName || 'Tournament Scorecard'}</h2>
                                <h3 style={{ margin: '5px 0', fontSize: '1rem', color: '#444' }}>Round {selectedRound} — {currentCourse?.name}</h3>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Tee Time: {group.time}</div>
                                <div style={{ fontSize: '0.8rem' }}>Group {gIdx + 1}</div>
                            </div>
                        </div>

                        {/* Holes Table */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f0f0f0' }}>
                                    <th style={cellStyle}>HOLE</th>
                                    {Array.from({ length: 9 }, (_, i) => (
                                        <th key={i + 1} style={cellStyleSmall}>{i + 1}</th>
                                    ))}
                                    <th style={cellStyleSmall}>OUT</th>
                                    {Array.from({ length: 9 }, (_, i) => (
                                        <th key={i + 10} style={cellStyleSmall}>{i + 10}</th>
                                    ))}
                                    <th style={cellStyleSmall}>IN</th>
                                    <th style={cellStyleSmall}>TOT</th>
                                </tr>
                                <tr>
                                    <th style={cellStyle}>SI</th>
                                    {Array.from({ length: 9 }, (_, i) => {
                                        const h = currentCourse?.holes?.find(hd => hd.number === (i + 1));
                                        return <th key={i + 1} style={cellStyleSmall}>{h?.handicapIndex || '-'}</th>;
                                    })}
                                    <th style={cellStyleSmall}>-</th>
                                    {Array.from({ length: 9 }, (_, i) => {
                                        const h = currentCourse?.holes?.find(hd => hd.number === (i + 10));
                                        return <th key={i + 10} style={cellStyleSmall}>{h?.handicapIndex || '-'}</th>;
                                    })}
                                    <th style={cellStyleSmall}>-</th>
                                    <th style={cellStyleSmall}>-</th>
                                </tr>
                                <tr style={{ borderBottom: '2px solid #000' }}>
                                    <th style={cellStyle}>PAR</th>
                                    {Array.from({ length: 9 }, (_, i) => {
                                        const h = currentCourse?.holes?.find(hd => hd.number === (i + 1));
                                        return <th key={i + 1} style={cellStyleSmall}>{h?.par || '4'}</th>;
                                    })}
                                    <th style={cellStyleSmall}>{currentCourse?.holes?.slice(0, 9).reduce((a, b) => a + (b.par || 0), 0) || '36'}</th>
                                    {Array.from({ length: 9 }, (_, i) => {
                                        const h = currentCourse?.holes?.find(hd => hd.number === (i + 10));
                                        return <th key={i + 10} style={cellStyleSmall}>{h?.par || '4'}</th>;
                                    })}
                                    <th style={cellStyleSmall}>{currentCourse?.holes?.slice(9, 18).reduce((a, b) => a + (b.par || 0), 0) || '36'}</th>
                                    <th style={cellStyleSmall}>{currentCourse?.holes?.reduce((a, b) => a + (b.par || 0), 0) || '72'}</th>
                                </tr>
                                {/* Closest to Pin row */}
                                {(() => {
                                    const ctpHoles = (settings?.closestToPin || []).filter(e => String(e.courseId) === String(currentCourse?.id));
                                    if (ctpHoles.length === 0) return null;
                                    return (
                                        <tr style={{ backgroundColor: '#fffbe6' }}>
                                            <th style={{ ...cellStyle, fontSize: '0.7rem', whiteSpace: 'nowrap' }}>🎯 CTP</th>
                                            {Array.from({ length: 9 }, (_, i) => {
                                                const isCTP = ctpHoles.some(e => e.hole === i + 1);
                                                return <th key={i + 1} style={{ ...cellStyleSmall, color: isCTP ? '#b8600a' : 'transparent', fontWeight: 'bold' }}>{isCTP ? '🎯' : '·'}</th>;
                                            })}
                                            <th style={cellStyleSmall} />
                                            {Array.from({ length: 9 }, (_, i) => {
                                                const isCTP = ctpHoles.some(e => e.hole === i + 10);
                                                return <th key={i + 10} style={{ ...cellStyleSmall, color: isCTP ? '#b8600a' : 'transparent', fontWeight: 'bold' }}>{isCTP ? '🎯' : '·'}</th>;
                                            })}
                                            <th style={cellStyleSmall} />
                                            <th style={cellStyleSmall} />
                                        </tr>
                                    );
                                })()}
                                {/* Long Drive row */}
                                {(() => {
                                    const ldHoles = (settings?.longDrive || []).filter(e => String(e.courseId) === String(currentCourse?.id));
                                    if (ldHoles.length === 0) return null;
                                    return (
                                        <tr style={{ backgroundColor: '#eef6ff' }}>
                                            <th style={{ ...cellStyle, fontSize: '0.7rem', whiteSpace: 'nowrap' }}>💨 LD</th>
                                            {Array.from({ length: 9 }, (_, i) => {
                                                const isLD = ldHoles.some(e => e.hole === i + 1);
                                                return <th key={i + 1} style={{ ...cellStyleSmall, color: isLD ? '#1a56a0' : 'transparent', fontWeight: 'bold' }}>{isLD ? '💨' : '·'}</th>;
                                            })}
                                            <th style={cellStyleSmall} />
                                            {Array.from({ length: 9 }, (_, i) => {
                                                const isLD = ldHoles.some(e => e.hole === i + 10);
                                                return <th key={i + 10} style={{ ...cellStyleSmall, color: isLD ? '#1a56a0' : 'transparent', fontWeight: 'bold' }}>{isLD ? '💨' : '·'}</th>;
                                            })}
                                            <th style={cellStyleSmall} />
                                            <th style={cellStyleSmall} />
                                        </tr>
                                    );
                                })()}
                            </thead>
                            <tbody>
                                {group.players.map(p => {
                                    const fullPlayer = players.find(fp => fp.id === p.id);
                                    const strokes = calculateStrokes(fullPlayer, currentCourse, selectedRound);
                                    return (
                                        <tr key={p.id}>
                                            <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 'bold', fontSize: '0.85rem', width: '120px' }}>
                                                {p.name}
                                            </td>
                                            {strokes.slice(0, 9).map((s, i) => (
                                                <td key={i} style={cellStyleSmall}>
                                                    <div style={{ position: 'relative', height: '100%', width: '100%', minHeight: '30px' }}>
                                                        {s > 0 && <span style={dotStyle}>{Array(s).fill('•').join('')}</span>}
                                                    </div>
                                                </td>
                                            ))}
                                            <td style={cellStyleSmall}></td>
                                            {strokes.slice(9, 18).map((s, i) => (
                                                <td key={i + 9} style={cellStyleSmall}>
                                                    <div style={{ position: 'relative', height: '100%', width: '100%', minHeight: '30px' }}>
                                                        {s > 0 && <span style={dotStyle}>{Array(s).fill('•').join('')}</span>}
                                                    </div>
                                                </td>
                                            ))}
                                            <td style={cellStyleSmall}></td>
                                            <td style={cellStyleSmall}></td>
                                        </tr>
                                    );
                                })}
                                {/* Add two blank rows for markers or other purposes */}
                                <tr>
                                    <td style={{ ...cellStyle, height: '30px' }}></td>
                                    {Array.from({ length: 21 }, (_, i) => <td key={i} style={cellStyleSmall}></td>)}
                                </tr>
                            </tbody>
                        </table>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: '10px', color: '#666' }}>
                            <div>• Dots indicate handicap strokes &nbsp;|&nbsp; 🎯 Closest to Pin hole &nbsp;|&nbsp; 💨 Long Drive hole</div>
                            <div>Scored via PinPlaced</div>
                        </div>
                    </div>
                ))}

                {currentGroups.length === 0 && (
                    <div className="no-print" style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                        No groups found for Round {selectedRound}. Go to Schedule to create them.
                    </div>
                )}
            </div>

            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: #fff !important; margin: 0; padding: 0; }
                    .print-container { padding: 0 !important; width: 100% !important; }
                    .printable-scorecard { 
                        box-shadow: none !important; 
                        border: 2px solid #000 !important;
                        margin: 0 !important;
                        page-break-after: always;
                    }
                }
                .printable-scorecard { box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
            `}</style>
        </div>
    );
}

const cellStyle = {
    border: '1px solid #000',
    padding: '8px 4px',
    textAlign: 'center',
    fontSize: '0.8rem'
};

const cellStyleSmall = {
    border: '1px solid #000',
    padding: '4px',
    textAlign: 'center',
    fontSize: '0.8rem',
    minWidth: '25px'
};

const dotStyle = {
    position: 'absolute',
    top: '2px',
    right: '4px',
    fontSize: '1.2rem',
    lineHeight: 1,
    color: '#000'
};
