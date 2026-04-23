"use client";

import React, { useState, Fragment, useMemo } from 'react';
import { ArrowUp, ArrowDown, UserPlus, Edit2, Save, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import UpgradeModal from './UpgradeModal';
import { calculateCourseHandicap } from '@/lib/courseHandicap';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

/**
 * Sub-component for rendering a player's course-specific handicap and tee selection.
 */
const PlayerCourseCard = ({ 
    course, 
    editTee, 
    editHcp, 
    displayTee, 
    displayHcp, 
    isEditing, 
    onTeeChange, 
    onHcpChange 
}) => {
    const teeInfo = useMemo(() => 
        Array.isArray(course.tees) ? course.tees.find(t => t.name === (isEditing ? editTee : displayTee)) : null
    , [course.tees, isEditing, editTee, displayTee]);

    return (
        <div style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            {isEditing ? (
                <div style={{ marginBottom: '0.8rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {course.name}
                    </div>
                    <select
                        value={editTee}
                        onChange={e => onTeeChange(course, e.target.value)}
                        style={{ width: '100%', padding: '4px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '4px', fontSize: '0.85rem' }}
                    >
                        <option value="">Select Tee...</option>
                        {Array.isArray(course.tees) && course.tees.map((tee, idx) => (
                            <option key={idx} value={tee.name}>
                                {tee.name} {tee.color ? `(${tee.color})` : ''}
                            </option>
                        ))}
                    </select>
                    {teeInfo?.yardage && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 'bold', marginTop: '0.2rem' }}>
                            {teeInfo.yardage.toLocaleString()} yds
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {course.name} - {displayTee}{teeInfo?.color ? ` (${teeInfo.color})` : ''}
                </div>
            )}
            
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>
                {isEditing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            type="number"
                            value={editHcp}
                            onChange={e => onHcpChange(course.id, parseInt(e.target.value) || 0)}
                            style={{ padding: '4px', width: '60px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '4px' }}
                        />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>HCP</span>
                    </div>
                ) : (
                    `${displayHcp} HCP`
                )}
            </div>
        </div>
    );
};

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
        houseNumber: '',
        imageUrl: '',
        ghin: ''
    });
    const [ghinLoading, setGhinLoading] = useState(false);
    const [isRecalculating, setIsRecalculating] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const startEdit = (player) => {
        setEditingId(player.id);
        const parsedCourseData = typeof player.courseData === 'string'
            ? JSON.parse(player.courseData || '{}')
            : (player.courseData || {});

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
            houseNumber: player.houseNumber || '',
            imageUrl: player.imageUrl || '',
            ghin: player.ghin || ''
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({ name: '', handicapIndex: '', courseData: {}, roomNumber: '', houseNumber: '', imageUrl: '', ghin: '' });
    };

    const handleGhinLookup = async () => {
        if (!editForm.ghin) return;
        setGhinLoading(true);
        try {
            const res = await fetch('/api/ghin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ghinNumber: editForm.ghin })
            });
            const data = await res.json();
            if (data.success) {
                const golferName = data.details.first_name && data.details.last_name 
                    ? `${data.details.first_name} ${data.details.last_name}`
                    : data.details.GolferName || '';
                
                setEditForm(prev => ({
                    ...prev,
                    name: golferName || prev.name,
                    handicapIndex: data.handicap_index !== undefined ? data.handicap_index.toString() : prev.handicapIndex
                }));
            } else {
                alert(data.error || 'Failed to retrieve GHIN data');
            }
        } catch (e) {
            alert('Error looking up GHIN data');
        } finally {
            setGhinLoading(false);
        }
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
                    houseNumber: editForm.houseNumber || null,
                    imageUrl: editForm.imageUrl || null,
                    ghin: editForm.ghin || null
                })
            });

            if (res.ok) {
                const updated = await res.json();
                setPlayers(players.map(p => p.id === id ? updated : p));
                setEditingId(null);
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(`Failed to update player: ${errData.details || res.statusText || 'Unknown error'}`);
            }
        } catch (e) {
            console.error(e);
            alert('Error updating player');
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 400;
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height = Math.round(height * (MAX_WIDTH / width));
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setEditForm(prev => ({ ...prev, imageUrl: dataUrl }));
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

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

    const registerPath = tournamentSlug ? `/t/${tournamentSlug}/players/register` : '/players/register';

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
                                        {player.imageUrl ? (
                                            <img src={player.imageUrl} alt={player.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: '0.9rem' }}>
                                                {player.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        {editingId === player.id && allowPlayerEdits ? (
                                            <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ padding: '4px', width: '100%', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '4px' }} onClick={(e) => e.stopPropagation()} />
                                        ) : player.name}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {editingId === player.id && allowPlayerEdits ? (
                                            <input type="number" step="0.1" value={editForm.handicapIndex} onChange={e => setEditForm({ ...editForm, handicapIndex: e.target.value })} style={{ padding: '4px', width: '60px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '4px' }} />
                                        ) : player.handicapIndex}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
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
                                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Profile Image</div>
                                                                {editingId === player.id ? (
                                                                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                        {editForm.imageUrl && <img src={editForm.imageUrl} alt="Preview" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />}
                                                                        <label className="btn-outline" style={{ display: 'inline-block', padding: '0.2rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer', textAlign: 'center' }}>
                                                                            Upload Photo
                                                                            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                                                                        </label>
                                                                    </div>
                                                                ) : (
                                                                    <div style={{ marginTop: '0.5rem' }}>
                                                                        {player.imageUrl ? <img src={player.imageUrl} alt={player.name} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} /> : 'No photo'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Phone Number</div>
                                                                {editingId === player.id && allowPlayerEdits ? (
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
                                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>GHIN #</div>
                                                                {editingId === player.id && allowPlayerEdits ? (
                                                                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                        <input
                                                                            type="text"
                                                                            value={editForm.ghin}
                                                                            onChange={e => setEditForm(prev => ({ ...prev, ghin: e.target.value }))}
                                                                            style={{ padding: '4px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '4px', width: '100px' }}
                                                                        />
                                                                        <button 
                                                                            onClick={handleGhinLookup} 
                                                                            disabled={ghinLoading || !editForm.ghin}
                                                                            className="btn-outline" 
                                                                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                                                        >
                                                                            {ghinLoading ? '...' : 'Auto-Fill'}
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div style={{ marginTop: '0.5rem' }}>{player.ghin || 'N/A'}</div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Room #</div>
                                                                {editingId === player.id && allowPlayerEdits ? (
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
                                                                {editingId === player.id && allowPlayerEdits ? (
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
                                                                const pDataCurrent = typeof player.courseData === 'string' ? JSON.parse(player.courseData || '{}') : (player.courseData || {});
                                                                
                                                                // Legacy mapping fallback
                                                                let displayHcp = pDataCurrent[course.id]?.hcp ?? 0;
                                                                let displayTee = pDataCurrent[course.id]?.tee ?? 'N/A';
                                                                
                                                                if (!pDataCurrent[course.id]) {
                                                                    const lowerName = course.name.toLowerCase();
                                                                    if (lowerName.includes('river')) {
                                                                        displayHcp = player.hcpRiver; displayTee = player.teeRiver || 'Default Tee';
                                                                    } else if (lowerName.includes('plantation')) {
                                                                        displayHcp = player.hcpPlantation; displayTee = player.teePlantation || 'Default Tee';
                                                                    } else if (lowerName.includes('royal') || lowerName.includes('rnk')) {
                                                                        displayHcp = player.hcpRNK; displayTee = player.teeRNK || 'Default Tee';
                                                                    }
                                                                }

                                                                const editHcp = editForm.courseData[course.id]?.hcp ?? displayHcp;
                                                                const editTee = editForm.courseData[course.id]?.tee ?? displayTee;

                                                                return (
                                                                    <PlayerCourseCard
                                                                        key={course.id}
                                                                        course={course}
                                                                        editTee={editTee}
                                                                        editHcp={editHcp}
                                                                        displayTee={displayTee}
                                                                        displayHcp={displayHcp}
                                                                        isEditing={editingId === player.id}
                                                                        onTeeChange={(c, newTeeName) => {
                                                                            let newHcp = editHcp;
                                                                            if (Array.isArray(c.tees)) {
                                                                                const teeData = c.tees.find(t => t.name === newTeeName);
                                                                                if (teeData?.rating && teeData?.slope) {
                                                                                    newHcp = calculateCourseHandicap(
                                                                                        parseFloat(editForm.handicapIndex || player.handicapIndex) || 0,
                                                                                        teeData.rating,
                                                                                        teeData.slope,
                                                                                        c.par || 72
                                                                                    );
                                                                                }
                                                                            }
                                                                            setEditForm(prev => ({
                                                                                ...prev,
                                                                                courseData: {
                                                                                    ...prev.courseData,
                                                                                    [c.id]: { ...prev.courseData[c.id], tee: newTeeName, hcp: newHcp }
                                                                                }
                                                                            }));
                                                                        }}
                                                                        onHcpChange={(courseId, val) => {
                                                                            setEditForm(prev => ({
                                                                                ...prev,
                                                                                courseData: {
                                                                                    ...prev.courseData,
                                                                                    [courseId]: { ...prev.courseData[courseId], hcp: val }
                                                                                }
                                                                            }));
                                                                        }}
                                                                    />
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

            {players.filter(p => p.imageUrl).length > 0 && (
                <div style={{ marginTop: '4rem', marginBottom: '2rem' }}>
                    <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '2rem' }}>Player Gallery</h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                        gap: '2rem',
                        justifyItems: 'center'
                    }}>
                        {players.filter(p => p.imageUrl).map(player => (
                            <div key={`gallery-${player.id}`} className="fade-in" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <img
                                    src={player.imageUrl}
                                    alt={player.name}
                                    style={{
                                        width: '130px',
                                        height: '130px',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        border: '3px solid var(--accent)',
                                        boxShadow: '0 4px 20px rgba(212, 175, 55, 0.2)',
                                        marginBottom: '1rem',
                                        transition: 'transform 0.2s ease',
                                        cursor: 'pointer'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                />
                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.2rem' }}>{player.name}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>HDCP: {player.handicapIndex}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
