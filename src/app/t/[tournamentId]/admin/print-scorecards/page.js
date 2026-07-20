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
        const numHoles = course?.holes?.length || 18;
        if (!player || !course) return Array(numHoles).fill(0);

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

        // 3. Distribute over holes
        const strokesPerHole = Array(numHoles).fill(0);
        const holes = course.holes || [];

        // Determine the player's tee to use for handicap indexes
        let playerTeeName = cd.tee || null;
        let selectedTee = null;
        if (playerTeeName && Array.isArray(course.tees)) {
            selectedTee = course.tees.find(t => t.name === playerTeeName);
        }

        for (let i = 0; i < numHoles; i++) {
            const holeNum = i + 1;
            const holeData = holes.find(h => h.number === holeNum);
            let si = holeData?.handicapIndex || numHoles;

            // If the player's tee has specific handicaps defined, use those instead
            if (selectedTee && Array.isArray(selectedTee.handicaps)) {
                const teeHcp = selectedTee.handicaps.find(h => h.hole === holeNum);
                if (teeHcp && teeHcp.index) {
                    si = parseInt(teeHcp.index) || si;
                }
            }

            const base = Math.floor(ch / numHoles);
            const remainder = ch % numHoles;
            strokesPerHole[i] = base + (si <= remainder ? 1 : 0);
        }

        return strokesPerHole;
    };

    const getTeeColor = (name) => {
        if (!name) return 'transparent';
        const lower = name.toLowerCase();
        if (lower.includes('blue')) return '#3b82f6';
        if (lower.includes('white')) return '#ffffff';
        if (lower.includes('gold') || lower.includes('yellow')) return '#fbbf24';
        if (lower.includes('red')) return '#ef4444';
        if (lower.includes('black')) return '#000000';
        if (lower.includes('green')) return '#22c55e';
        if (lower.includes('silver')) return '#9ca3af';
        return '#e5e7eb';
    };

    const getTeeTextColor = (name) => {
        const lower = (name || '').toLowerCase();
        if (lower.includes('white') || lower.includes('gold') || lower.includes('yellow') || lower.includes('silver')) return '#000';
        return '#fff';
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #000', paddingBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {settings?.logoUrl && (
                                    <img src={settings.logoUrl} alt="Tournament Logo" style={{ maxHeight: '40px', maxWidth: '100px', objectFit: 'contain' }} />
                                )}
                                <div style={{ textAlign: 'left' }}>
                                    <h3 style={{ margin: '0', fontSize: '1.2rem', color: '#000', fontWeight: 'bold' }}>
                                        {settings?.tournamentName || 'Tournament'}
                                    </h3>
                                    <div style={{ fontSize: '0.85rem', color: '#555' }}>
                                        Round {selectedRound} — {currentCourse?.name}
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Tee Time: {group.time}</div>
                                <div style={{ fontSize: '0.8rem', color: '#555' }}>Group {gIdx + 1}</div>
                            </div>
                        </div>

                        {/* Holes Table */}
                        {(() => {
                            // Find all unique tees used by players in this group
                            const uniqueTees = [];
                            if (group.players && Array.isArray(currentCourse?.tees)) {
                                group.players.forEach(p => {
                                    const fp = players.find(x => x.id === p.id);
                                    if (fp?.courseData?.[currentCourse?.id]?.tee) {
                                        const tName = fp.courseData[currentCourse.id].tee;
                                        if (!uniqueTees.find(t => t.name === tName)) {
                                            const teeObj = currentCourse.tees.find(t => t.name === tName);
                                            if (teeObj) uniqueTees.push(teeObj);
                                        }
                                    }
                                });
                            }

                            // If no players have a specific tee assigned, just use a generic 'SI' row
                            if (uniqueTees.length === 0) {
                                uniqueTees.push({ name: 'SI', isGeneric: true });
                            }

                            const getHoleSI = (holeNum, teeObj) => {
                                let si = currentCourse?.holes?.find(hd => hd.number === holeNum)?.handicapIndex;
                                if (!teeObj.isGeneric && Array.isArray(teeObj.handicaps)) {
                                    const teeHcp = teeObj.handicaps.find(h => h.hole === holeNum);
                                    if (teeHcp && teeHcp.index) si = parseInt(teeHcp.index);
                                }
                                return si || '-';
                            };                            const numHoles = currentCourse?.holes?.length || 18;
                            const isNineHoles = numHoles <= 9;

                            return (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f0f0f0' }}>
                                    <th style={cellStyle}>HOLE</th>
                                    {Array.from({ length: Math.min(9, numHoles) }, (_, i) => (
                                        <th key={i + 1} style={cellStyleSmall}>{i + 1}</th>
                                    ))}
                                    {!isNineHoles && <th style={cellStyleSmall}>OUT</th>}
                                    {!isNineHoles && Array.from({ length: numHoles - 9 }, (_, i) => (
                                        <th key={i + 10} style={cellStyleSmall}>{i + 10}</th>
                                    ))}
                                    {!isNineHoles && <th style={cellStyleSmall}>IN</th>}
                                    <th style={cellStyleSmall}>TOT</th>
                                </tr>
                                {uniqueTees.map((teeObj, teeIdx) => (
                                    <tr key={`si-${teeIdx}`}>
                                        <th style={{ ...cellStyle, fontSize: uniqueTees.length > 1 ? '0.75rem' : cellStyle.fontSize }}>
                                            {teeObj.isGeneric ? 'SI' : `${teeObj.name} SI`}
                                        </th>
                                        {Array.from({ length: Math.min(9, numHoles) }, (_, i) => (
                                            <th key={i + 1} style={cellStyleSmall}>{getHoleSI(i + 1, teeObj)}</th>
                                        ))}
                                        {!isNineHoles && <th style={cellStyleSmall}>-</th>}
                                        {!isNineHoles && Array.from({ length: numHoles - 9 }, (_, i) => (
                                            <th key={i + 10} style={cellStyleSmall}>{getHoleSI(i + 10, teeObj)}</th>
                                        ))}
                                        {!isNineHoles && <th style={cellStyleSmall}>-</th>}
                                        <th style={cellStyleSmall}>-</th>
                                    </tr>
                                ))}
                                <tr style={{ borderBottom: '2px solid #000' }}>
                                    <th style={cellStyle}>PAR</th>
                                    {Array.from({ length: Math.min(9, numHoles) }, (_, i) => {
                                        const h = currentCourse?.holes?.find(hd => hd.number === (i + 1));
                                        return <th key={i + 1} style={cellStyleSmall}>{h?.par || '4'}</th>;
                                    })}
                                    {!isNineHoles && <th style={cellStyleSmall}>{currentCourse?.holes?.slice(0, 9).reduce((a, b) => a + (b.par || 0), 0) || '36'}</th>}
                                    {!isNineHoles && Array.from({ length: numHoles - 9 }, (_, i) => {
                                        const h = currentCourse?.holes?.find(hd => hd.number === (i + 10));
                                        return <th key={i + 10} style={cellStyleSmall}>{h?.par || '4'}</th>;
                                    })}
                                    {!isNineHoles && <th style={cellStyleSmall}>{currentCourse?.holes?.slice(9, 18).reduce((a, b) => a + (b.par || 0), 0) || '36'}</th>}
                                    <th style={cellStyleSmall}>{currentCourse?.holes?.reduce((a, b) => a + (b.par || 0), 0) || '72'}</th>
                                </tr>
                                {/* Closest to Pin row */}
                                {(() => {
                                    const ctpHoles = (settings?.closestToPin || []).filter(e => String(e.courseId) === String(currentCourse?.id));
                                    if (ctpHoles.length === 0) return null;
                                    return (
                                        <tr style={{ backgroundColor: '#fffbe6' }}>
                                            <th style={{ ...cellStyle, fontSize: '0.7rem', whiteSpace: 'nowrap' }}>🎯 CTP</th>
                                            {Array.from({ length: Math.min(9, numHoles) }, (_, i) => {
                                                const isCTP = ctpHoles.some(e => e.hole === i + 1);
                                                return <th key={i + 1} style={{ ...cellStyleSmall, color: isCTP ? '#b8600a' : 'transparent', fontWeight: 'bold' }}>{isCTP ? '🎯' : '·'}</th>;
                                            })}
                                            {!isNineHoles && <th style={cellStyleSmall} />}
                                            {!isNineHoles && Array.from({ length: numHoles - 9 }, (_, i) => {
                                                const isCTP = ctpHoles.some(e => e.hole === i + 10);
                                                return <th key={i + 10} style={{ ...cellStyleSmall, color: isCTP ? '#b8600a' : 'transparent', fontWeight: 'bold' }}>{isCTP ? '🎯' : '·'}</th>;
                                            })}
                                            {!isNineHoles && <th style={cellStyleSmall} />}
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
                                            {Array.from({ length: Math.min(9, numHoles) }, (_, i) => {
                                                const isLD = ldHoles.some(e => e.hole === i + 1);
                                                return <th key={i + 1} style={{ ...cellStyleSmall, color: isLD ? '#1a56a0' : 'transparent', fontWeight: 'bold' }}>{isLD ? '💨' : '·'}</th>;
                                            })}
                                            {!isNineHoles && <th style={cellStyleSmall} />}
                                            {!isNineHoles && Array.from({ length: numHoles - 9 }, (_, i) => {
                                                const isLD = ldHoles.some(e => e.hole === i + 10);
                                                return <th key={i + 10} style={{ ...cellStyleSmall, color: isLD ? '#1a56a0' : 'transparent', fontWeight: 'bold' }}>{isLD ? '💨' : '·'}</th>;
                                            })}
                                            {!isNineHoles && <th style={cellStyleSmall} />}
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
                                            <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 'bold', fontSize: '0.85rem', width: '130px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {(() => {
                                                        const teeName = fullPlayer?.courseData?.[currentCourse?.id]?.tee;
                                                        if (!teeName) return null;
                                                        return (
                                                            <div style={{
                                                                width: '14px',
                                                                height: '14px',
                                                                borderRadius: '2px',
                                                                backgroundColor: getTeeColor(teeName),
                                                                border: '1px solid #000',
                                                                flexShrink: 0,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '9px',
                                                                color: getTeeTextColor(teeName),
                                                                WebkitPrintColorAdjust: 'exact',
                                                                printColorAdjust: 'exact'
                                                             }}>
                                                                {teeName.charAt(0).toUpperCase()}
                                                            </div>
                                                        );
                                                    })()}
                                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                                                </div>
                                            </td>
                                            {strokes.slice(0, Math.min(9, numHoles)).map((s, i) => (
                                                <td key={i} style={cellStyleSmall}>
                                                    <div style={{ position: 'relative', height: '100%', width: '100%', minHeight: '30px' }}>
                                                        {s > 0 && <span style={dotStyle}>{Array(s).fill('•').join('')}</span>}
                                                    </div>
                                                </td>
                                            ))}
                                            {!isNineHoles && <td style={cellStyleSmall}></td>}
                                            {!isNineHoles && strokes.slice(9, numHoles).map((s, i) => (
                                                <td key={i + 9} style={cellStyleSmall}>
                                                    <div style={{ position: 'relative', height: '100%', width: '100%', minHeight: '30px' }}>
                                                        {s > 0 && <span style={dotStyle}>{Array(s).fill('•').join('')}</span>}
                                                    </div>
                                                </td>
                                            ))}
                                            {!isNineHoles && <td style={cellStyleSmall}></td>}
                                            <td style={cellStyleSmall}></td>
                                        </tr>
                                    );
                                })}
                                {/* Add two blank rows for markers or other purposes */}
                                <tr>
                                    <td style={{ ...cellStyle, height: '30px' }}></td>
                                    {Array.from({ length: isNineHoles ? 11 : 21 }, (_, i) => <td key={i} style={cellStyleSmall}></td>)}
                                </tr>
                            </tbody>
                        </table>
                        );
                        })()}

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: '10px', color: '#666' }}>
                            <div>• Dots indicate handicap strokes &nbsp;|&nbsp; 🎯 Closest to Pin hole &nbsp;|&nbsp; 💨 Long Drive hole</div>
                            <div>Scored via PinPlaced</div>
                        </div>

                        {settings?.isPro && Array.isArray(settings?.sponsorLogos) && settings.sponsorLogos.length > 0 && (
                            <div style={{ marginTop: '15px', borderTop: '1px solid #000', paddingTop: '10px', textAlign: 'left' }}>
                                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#555', letterSpacing: '0.5px', marginBottom: '6px', fontWeight: 'bold' }}>
                                    Special Thanks to Our Tournament Sponsors
                                </div>
                                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                    {settings.sponsorLogos.map((url, idx) => (
                                        <img key={idx} src={url} alt="Sponsor" style={{ maxHeight: '25px', maxWidth: '80px', objectFit: 'contain' }} />
                                    ))}
                                </div>
                            </div>
                        )}
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
                    @page { margin: 0; }
                    /* Hide global nav banner, sticky nav, footer, floating sign-in */
                    nav,
                    footer,
                    nav + div,
                    [class*="floating"],
                    [class*="FloatingSignIn"] {
                        display: none !important;
                    }
                    /* Hide tournament title banners */
                    body > div > div:first-child,
                    div[style*="border-bottom: 1px solid var(--accent)"] {
                        display: none !important;
                    }
                    
                    .no-print { display: none !important; }
                    body { background: #fff !important; margin: 0; padding: 0; }
                    .print-container { padding: 0 !important; width: 100% !important; }
                    .printable-scorecard { 
                        box-shadow: none !important; 
                        border: none !important;
                        margin: 0 !important;
                        padding: 1in !important; /* Add padding back since we removed page margins */
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
