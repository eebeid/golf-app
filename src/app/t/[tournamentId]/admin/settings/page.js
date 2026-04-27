"use client";

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import PrintSettings from '@/components/settings/PrintSettings';
import HistorySettings from '@/components/settings/HistorySettings';
import PaymentSettings from '@/components/settings/PaymentSettings';
import CourseSettingsTab from '@/components/settings/CourseSettingsTab';
import PlayerSettingsTab from '@/components/settings/PlayerSettingsTab';
import LodgingSettingsTab from '@/components/settings/LodgingSettingsTab';
import RestaurantSettingsTab from '@/components/settings/RestaurantSettingsTab';
import PrizeSettingsTab from '@/components/settings/PrizeSettingsTab';
import GeneralSettingsTab from '@/components/settings/GeneralSettingsTab';
import ScheduleSettingsTab from '@/components/settings/ScheduleSettingsTab';
import BrandingSettingsTab from '@/components/settings/BrandingSettingsTab';

export default function AdminSettingsPage() {
    const params = useParams();
    const tournamentId = params?.tournamentId;

    const [activeTab, setActiveTab] = useState('general');
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState([]);
    const [availableCourses, setAvailableCourses] = useState([]); // All global courses

    const [players, setPlayers] = useState([]);
    const [loadingPlayers, setLoadingPlayers] = useState(true);
    const [allowPlayerEdits, setAllowPlayerEdits] = useState(false);

    const [isAdmin, setIsAdmin] = useState(false);



    useEffect(() => {
        if (!tournamentId) return;
        fetchSettings();
        fetchCourses();
        fetchAvailableCourses(); // Fetch global library
        fetchPlayers();
    }, [tournamentId]);

    const fetchPlayers = async () => {
        try {
            const res = await fetch(`/api/players?tournamentId=${tournamentId}`);
            if (res.ok) {
                const data = await res.json();
                setPlayers(data);
            }
        } catch (error) {
            console.error('Error fetching players:', error);
        } finally {
            setLoadingPlayers(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const res = await fetch(`/api/courses?tournamentId=${tournamentId}`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setCourses(data);
                } else {
                    console.error('Invalid courses data format:', data);
                    setCourses([]);
                }
            } else {
                console.error('Failed to fetch courses:', res.status);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const fetchAvailableCourses = async () => {
        try {
            const res = await fetch('/api/courses');
            if (res.ok) {
                const data = await res.json();
                setAvailableCourses(data);
            }
        } catch (error) {
            console.error('Error fetching available courses:', error);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch(`/api/settings?tournamentId=${tournamentId}`);
            if (res.ok) {
                const data = await res.json();
                setAllowPlayerEdits(!!data.allowPlayerEdits);
                setIsAdmin(!!data.isAdmin);
            } else {
                console.error('Failed to fetch settings:', res.status);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };



    const handleTogglePlayerEdits = async (checked) => {
        setAllowPlayerEdits(checked); // Optimistic update
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId,
                    allowPlayerEdits: checked
                })
            });
            if (!res.ok) {
                // Revert on API error
                setAllowPlayerEdits(!checked);
            }
        } catch (error) {
            console.error('Error saving player edit toggle:', error);
            setAllowPlayerEdits(!checked);
        }
    };



    if (status === 'loading') {
        return (
            <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', padding: '4rem' }}>
                <div className="card">Loading session...</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
                <h1 className="section-title">Tournament Settings</h1>
                <div className="card">Loading...</div>
            </div>
        );
    }

    if (!isAdmin && status !== 'loading' && !loading) {
        return (
            <div className="fade-in" style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
                <h1 className="section-title">Access Denied</h1>
                <div className="card">
                    <p style={{ marginBottom: '1.5rem' }}>You do not have permission to manage this tournament.</p>
                    <Link href={`/t/${tournamentId}`} className="btn" style={{ width: '100%' }}>Return to Tournament</Link>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'general', label: 'General' },
        { id: 'schedule', label: 'Schedule' },
        { id: 'players', label: 'Players' },
        { id: 'courses', label: 'Courses' },
        { id: 'accommodations', label: 'Lodging' },
        { id: 'restaurants', label: 'Food' },
        { id: 'prizes', label: 'Prizes' },
        { id: 'payment', label: 'Payment' },
        { id: 'branding', label: 'Branding' },
        { id: 'history', label: 'History' },
        { id: 'print', label: 'Print & Export' },
    ];

    return (
        <div className="container fade-in" style={{ paddingBottom: '3rem', paddingTop: '1rem' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                gap: '0.75rem'
            }}>
                <h1 className="section-title" style={{ margin: 0, fontSize: 'clamp(1.4rem, 5vw, 2rem)', textAlign: 'left' }}>Settings</h1>
                <button
                    onClick={() => signOut()}
                    className="btn-outline"
                    style={{ fontSize: '0.8rem', padding: '6px 10px', whiteSpace: 'nowrap' }}
                >
                    Sign Out
                </button>
            </div>

            <div className="settings-container">
                {/* Vertical Toolbar Sidebar */}
                <div className="glass-panel settings-sidebar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                textAlign: 'left',
                                padding: '12px 16px',
                                background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                                color: activeTab === tab.id ? '#000' : 'var(--text-main)',
                                border: 'none',
                                borderRadius: 'var(--radius)',
                                cursor: 'pointer',
                                fontWeight: activeTab === tab.id ? '600' : '400',
                                transition: 'all 0.2s',
                                fontSize: '1rem'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, minWidth: 0, width: '100%' }}>

                    {/* General / Tournament Config Tab */}
                    {activeTab === 'general' && (
                        <GeneralSettingsTab tournamentId={tournamentId} players={players} />
                    )}

                    {activeTab === 'schedule' && (
                        <ScheduleSettingsTab tournamentId={tournamentId} players={players} courses={courses} />
                    )}

                    {/* Accommodations Tab */}
                    {activeTab === 'accommodations' && (
                        <LodgingSettingsTab tournamentId={tournamentId} players={players} />
                    )}

                    {/* Restaurants Tab */}
                    {activeTab === 'restaurants' && (
                        <RestaurantSettingsTab tournamentId={tournamentId} players={players} />
                    )}

                    {/* Players Tab */}
                    {activeTab === 'players' && (
                        <PlayerSettingsTab
                            tournamentId={tournamentId}
                            players={players}
                            setPlayers={setPlayers}
                            fetchPlayers={fetchPlayers}
                            courses={courses}
                            allowPlayerEdits={allowPlayerEdits}
                            handleTogglePlayerEdits={handleTogglePlayerEdits}
                        />
                    )}

                    {/* Branding Tab */}
                    {activeTab === 'branding' && (
                        <BrandingSettingsTab tournamentId={tournamentId} />
                    )}

                    {/* History Tab */}
                    {activeTab === 'history' && (
                        <HistorySettings tournamentId={tournamentId} />
                    )}

                    {/* Prizes Tab */}
                    {
                        activeTab === 'prizes' && (
                            <PrizeSettingsTab tournamentId={tournamentId} courses={courses} />
                        )
                    }

                    {/* Payment Info Tab */}
                    {
                        activeTab === 'payment' && (
                            <PaymentSettings tournamentId={tournamentId} />
                        )
                    }

                    {/* Courses Tab */}
                    {
                        activeTab === 'courses' && (
                            <CourseSettingsTab
                                tournamentId={tournamentId}
                                courses={courses}
                                setCourses={setCourses}
                                fetchCourses={fetchCourses}
                            />
                        )
                    }

                    {
                        activeTab === 'print' && (
                            <PrintSettings tournamentId={tournamentId} />
                        )
                    }
                </div >
            </div >
        </div >
    );
}
