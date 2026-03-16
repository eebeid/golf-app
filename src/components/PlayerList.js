"use client";

import React, { useState, Fragment } from 'react';
import { Trash2, ArrowUp, ArrowDown, UserPlus, Edit2, Save, X, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UpgradeModal from './UpgradeModal';
import { calculateCourseHandicap } from '@/lib/courseHandicap';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

export default function PlayerList({ initialPlayers, tournamentSlug, activeCourses = [], isPro = false, allowPlayerEdits = true }) {
    const router = useRouter();
    const [players, setPlayers] = useState(initialPlayers);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({
        name: '',
        handicapIndex: '',
        courseData: {},
        roomNumber: '',
        houseNumber: ''
    });
    const [isRecalculating, setIsRecalculating] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    const chartData = [...players]
        .map(p => ({
            name: p.name,
            handicap: parseFloat(p.handicapIndex) || 0
        }))
        .sort((a, b) => a.handicap - b.handicap);

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const startEdit = (player) => {
        setEditingId(player.id);
        const parsedCourseData = typeof player.courseData === 'string'
            ? JSON.parse(player.courseData || '{}')
            : (player.courseData || {});

        // For each active course, if no tee is set, default to the longest tee
        const defaultedCourseData = { ...parsedCourseData };
        activeCourses.forEach(course => {
            if (!defaultedCourseData[course.id]?.tee && Array.isArray(course.tees) && course.tees.length > 0) {
                const longestTee = [...course.tees].sort((a, b) => (b.yardage || 0) - (a.yardage || 0))[0];
                const hcp = (longestTee.rating && longestTee.slope)
                    ? calculateCourseHandicap(
                        parseFloat(player.handicapIndex) || 0,
                        longestTee.rating,
                        longestTee.slope,
                        course.par || 72
                    )
                    : (defaultedCourseData[course.id]?.hcp || 0);
                defaultedCourseData[course.id] = {
                    ...defaultedCourseData[course.id],
                    tee: longestTee.name,
                    hcp
                };
            }
        });

        setEditForm({
            name: player.name,
            handicapIndex: player.handicapIndex,
            courseData: defaultedCourseData,
            roomNumber: player.roomNumber || '',
            houseNumber: player.houseNumber || ''
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({ name: '', handicapIndex: '', courseData: {}, roomNumber: '', houseNumber: '' });
    };

    const saveEdit = async (id) => {
        try {
            const res = await fetch(`/api/players/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editForm.name,
                    handicapIndex: parseFloat(editForm.handicapIndex) || 0,
                    courseData: editForm.courseData,
                    roomNumber: editForm.roomNumber || null,
                    houseNumber: editForm.houseNumber || null
                })
            });

            if (res.ok) {
                const updated = await res.json();
                setPlayers(players.map(p => p.id === id ? updated : p));
                setEditingId(null);
            } else {
                alert('Failed to update player');
            }
        } catch (e) {
            console.error(e);
            alert('Error updating player');
        }
    };

    // ... sort logic ...
    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });

        const sorted = [...players].sort((a, b) => {
            if (a[key] < b[key]) return direction === 'ascending' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'ascending' ? 1 : -1;
            return 0;
        });

        setPlayers(sorted);
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
    };

    const handleRecalculate = async () => {
        if (!confirm('This will recalculate all course handicaps based on each player\'s Handicap Index and their selected Tees. Continue?')) {
            return;
        }

        setIsRecalculating(true);
        try {
            const res = await fetch('/api/players/recalculate?tournamentId=' + (tournamentSlug || ''), { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                alert(`Success! Updated ${data.updatedCount} players.`);
                // Refresh list
                window.location.reload();
            } else {
                alert('Failed to recalculate.');
            }
        } catch (error) {
            console.error(error);
            alert('Error connecting to server.');
        } finally {
            setIsRecalculating(false);
        }
    };

    // Construct register path
    const registerPath = tournamentSlug
        ? `/t/${tournamentSlug}/players/register` // Note: this page needs to exist relative to tournament
        : '/players/register';

    const handleRegisterClick = (e) => {
        if (!isPro && players.length >= 4) {
            e.preventDefault();
            setShowUpgradeModal(true);
        } else {
            router.push(registerPath);
        }
    };

    return (
        <div>
            <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
            {/* Header ... */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <h1 className="section-title" style={{ marginBottom: 0 }}>Players</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={handleRecalculate}
                        className="btn"
                        disabled={isRecalculating}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        {isRecalculating ? 'Calculating...' : 'Calculate'}
                    </button>
                    <button onClick={handleRegisterClick} className="btn">
                        <UserPlus size={20} style={{ marginRight: '8px' }} />
                        Register
                    </button>
                </div>
            </div>

            <div className="card" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '1rem', cursor: 'pointer', width: '40%' }} onClick={() => handleSort('name')}>Name {getSortIcon('name')}</th>
                            <th style={{ padding: '1rem', cursor: 'pointer', width: '30%' }} onClick={() => handleSort('handicapIndex')}>Index {getSortIcon('handicapIndex')}</th>
                            <th style={{ padding: '1rem', textAlign: 'right', width: '30%' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {players.map((player) => (
                            <Fragment key={player.id}>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td
                                        style={{ padding: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        onClick={() => toggleExpand(player.id)}
                                    >
                                        {expandedId === player.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        {editingId === player.id ? (
                                            <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ padding: '4px', width: '100%' }} onClick={(e) => e.stopPropagation()} />
                                        ) : player.name}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {editingId === player.id ? (
                                            <input type="number" step="0.1" value={editForm.handicapIndex} onChange={e => setEditForm({ ...editForm, handicapIndex: e.target.value })} style={{ padding: '4px', width: '60px' }} />
                                        ) : player.handicapIndex}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        {allowPlayerEdits && (
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                {editingId === player.id ? (
                                                    <>
                                                        <button onClick={() => saveEdit(player.id)} className="btn" style={{ padding: '6px' }}><Save size={16} /></button>
                                                        <button onClick={cancelEdit} className="btn-outline" style={{ padding: '6px' }}><X size={16} /></button>
                                                    </>
                                                ) : (
                                                    <button onClick={() => startEdit(player)} className="btn-outline" style={{ padding: '6px' }}><Edit2 size={16} /></button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                                {expandedId === player.id && (
                                    <tr style={{ background: 'rgba(212, 175, 55, 0.03)', borderBottom: '1px solid var(--glass-border)' }}>
                                        <td colSpan="3" style={{ padding: '1rem 2rem' }}>
                                            {(() => {
                                                const pData = typeof player.courseData === 'string' ? JSON.parse(player.courseData || '{}') : (player.courseData || {});
                                                const phone = pData.phone || 'N/A';

                                                return (
                                                    <>
                                                        <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '1rem', display: 'flex', gap: '2rem' }}>
                                                            <div>
                                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Phone Number</div>
                                                                {editingId === player.id ? (
                                                                    <input
                                                                        type="tel"
                                                                        value={editForm.courseData?.phone || ''}
                                                                        onChange={e => setEditForm(prev => ({
                                                                            ...prev,
                                                                            courseData: { ...prev.courseData, phone: e.target.value }
                                                                        }))}
                                                                        style={{ padding: '4px', marginTop: '0.5rem', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '4px' }}
                                                                    />
                                                                ) : (
                                                                    <div style={{ marginTop: '0.5rem' }}>
                                                                        {phone !== 'N/A' ? <a href={`tel:${phone}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{phone}</a> : 'N/A'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Room #</div>
                                                                {editingId === player.id ? (
                                                                    <input
                                                                        type="text"
                                                                        value={editForm.roomNumber}
                                                                        onChange={e => setEditForm(prev => ({ ...prev, roomNumber: e.target.value }))}
                                                                        style={{ padding: '4px', marginTop: '0.5rem', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '4px', width: '100px' }}
                                                                    />
                                                                ) : (
                                                                    <div style={{ marginTop: '0.5rem' }}>{player.roomNumber || 'N/A'}</div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>House #</div>
                                                                {editingId === player.id ? (
                                                                    <input
                                                                        type="text"
                                                                        value={editForm.houseNumber}
                                                                        onChange={e => setEditForm(prev => ({ ...prev, houseNumber: e.target.value }))}
                                                                        style={{ padding: '4px', marginTop: '0.5rem', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '4px', width: '100px' }}
                                                                    />
                                                                ) : (
                                                                    <div style={{ marginTop: '0.5rem' }}>{player.houseNumber || 'N/A'}</div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                                            {activeCourses.length > 0 ? activeCourses.map(course => {

                                                                // Map legacy logic if courseData is empty (fallback)
                                                                let displayHcp = 0;
                                                                let displayTee = 'N/A';
                                                                if (pData[course.id]) {
                                                                    displayHcp = pData[course.id].hcp;
                                                                    displayTee = pData[course.id].tee;
                                                                } else {
                                                                    if (course.name.toLowerCase().includes('river')) {
                                                                        displayHcp = player.hcpRiver; displayTee = player.teeRiver || 'Default Tee';
                                                                    } else if (course.name.toLowerCase().includes('plantation')) {
                                                                        displayHcp = player.hcpPlantation; displayTee = player.teePlantation || 'Default Tee';
                                                                    } else if (course.name.toLowerCase().includes('royal') || course.name.toLowerCase().includes('rnk')) {
                                                                        displayHcp = player.hcpRNK; displayTee = player.teeRNK || 'Default Tee';
                                                                    }
                                                                }

                                                                const editHcp = editForm.courseData[course.id]?.hcp ?? displayHcp;
                                                                const editTee = editForm.courseData[course.id]?.tee ?? displayTee;

                                                                return (
                                                                    <div key={course.id} style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                                                        {editingId === player.id ? (
                                                                            <div style={{ marginBottom: '0.8rem' }}>
                                                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.name}</div>
                                                                                <select
                                                                                    value={editTee}
                                                                                    onChange={e => {
                                                                                        const newTeeName = e.target.value;
                                                                                        let newHcp = editHcp;
                                                                                        if (course.tees && Array.isArray(course.tees)) {
                                                                                            const newTeeData = course.tees.find(t => t.name === newTeeName);
                                                                                            if (newTeeData && newTeeData.rating && newTeeData.slope) {
                                                                                                newHcp = calculateCourseHandicap(
                                                                                                    parseFloat(editForm.handicapIndex || player.handicapIndex) || 0,
                                                                                                    newTeeData.rating,
                                                                                                    newTeeData.slope,
                                                                                                    course.par || 72
                                                                                                );
                                                                                            }
                                                                                        }
                                                                                        setEditForm(prev => ({
                                                                                            ...prev,
                                                                                            courseData: {
                                                                                                ...prev.courseData,
                                                                                                [course.id]: {
                                                                                                    ...prev.courseData[course.id],
                                                                                                    tee: newTeeName,
                                                                                                    hcp: newHcp
                                                                                                }
                                                                                            }
                                                                                        }));
                                                                                    }}
                                                                                    style={{ width: '100%', padding: '4px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '0.85rem' }}
                                                                                >
                                                                                    <option value="">Select Tee...</option>
                                                                                    {course.tees && Array.isArray(course.tees) && course.tees.map((tee, idx) => (
                                                                                        <option key={idx} value={tee.name}>
                                                                                            {tee.name} {tee.color ? `(${tee.color})` : ''}
                                                                                        </option>
                                                                                    ))}
                                                                                    {editTee !== 'N/A' && (!course.tees || !course.tees.find(t => t.name === editTee)) && (
                                                                                        <option value={editTee}>{editTee}</option>
                                                                                    )}
                                                                                </select>
                                                                                {(() => {
                                                                                    const teeInfo = Array.isArray(course.tees) ? course.tees.find(t => t.name === editTee) : null;
                                                                                    return teeInfo?.yardage ? (
                                                                                        <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 'bold', marginTop: '0.2rem' }}>
                                                                                            {teeInfo.yardage.toLocaleString()} yds
                                                                                        </div>
                                                                                    ) : null;
                                                                                })()}
                                                                            </div>
                                                                        ) : (
                                                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                                {(() => {
                                                                                    const teeInfo = Array.isArray(course.tees) ? course.tees.find(t => t.name === displayTee) : null;
                                                                                    const colorDisplay = teeInfo?.color ? ` (${teeInfo.color})` : '';
                                                                                    return `${course.name} - ${displayTee}${colorDisplay}`;
                                                                                })()}
                                                                            </div>
                                                                        )}
                                                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>
                                                                            {editingId === player.id ? (
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                    <input
                                                                                        type="number"
                                                                                        value={editHcp}
                                                                                        onChange={e => setEditForm(prev => ({
                                                                                            ...prev,
                                                                                            courseData: {
                                                                                                ...prev.courseData,
                                                                                                [course.id]: {
                                                                                                    ...prev.courseData[course.id],
                                                                                                    tee: editTee,
                                                                                                    hcp: parseInt(e.target.value) || 0
                                                                                                }
                                                                                            }
                                                                                        }))}
                                                                                        style={{ padding: '4px', width: '60px' }}
                                                                                    />
                                                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>HCP</span>
                                                                                </div>
                                                                            ) : (
                                                                                `${displayHcp} HCP`
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }) : (
                                                                <div style={{ color: 'var(--text-muted)' }}>No courses assigned to tournament yet.</div>
                                                            )}
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        ))}
                        {players.length === 0 && (
                            <tr>
                                <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No players registered yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {players.length > 0 && (
                <div className="card" style={{ marginTop: '2rem', padding: '1.5rem', overflowX: 'auto' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', textAlign: 'center' }}>Player Handicaps</h3>
                    <div style={{ width: '100%', minWidth: '600px', height: 350 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={[...players].map(p => ({
                                    name: p.name,
                                    handicap: parseFloat(p.handicapIndex) || 0
                                })).sort((a, b) => a.handicap - b.handicap)}
                                margin={{ top: 20, right: 30, left: 0, bottom: 70 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="var(--text-muted)"
                                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                                    angle={-45}
                                    textAnchor="end"
                                    interval={0}
                                />
                                <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--bg-dark)', borderColor: 'var(--glass-border)', color: 'white', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--accent)' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    formatter={(value) => [`${value} Index`, 'Handicap']}
                                />
                                <Bar dataKey="handicap" fill="var(--accent)" radius={[4, 4, 0, 0]}>
                                    {[...players].map(p => ({ handicap: parseFloat(p.handicapIndex) || 0 })).sort((a, b) => a.handicap - b.handicap).map((entry, index) => {
                                        return <Cell key={`cell-${index}`} fill={entry.handicap < 0 ? '#ff6b6b' : 'var(--accent)'} />;
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div >
    );
}
