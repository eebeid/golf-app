"use client";

import { useEffect } from 'react';
import Pusher from 'pusher-js';
import toast, { Toaster } from 'react-hot-toast';

export default function RealTimeNotifications({ tournamentId }) {
    useEffect(() => {
        if (!tournamentId) return;

        // Initialize Pusher Client
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        });

        // Subscribe to the tournament-specific channel
        const channel = pusher.subscribe(`tournament-${tournamentId}`);

        // Listen for 'score-update' events
        channel.bind('highlight', (data) => {
            const { playerName, achievement, hole, scoreTitle } = data;
            
            // Custom styling for the toast based on the score
            const isEagle = scoreTitle?.toLowerCase().includes('eagle');
            const isBirdie = scoreTitle?.toLowerCase().includes('birdie');

            toast(
                (t) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '1.5rem' }}>
                            {isEagle ? '🦅' : isBirdie ? '🐦' : '🔥'}
                        </div>
                        <div>
                            <div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>
                                {playerName} just carded a {scoreTitle}!
                            </div>
                            <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                                Hole {hole} • {achievement}
                            </div>
                        </div>
                    </div>
                ),
                {
                    duration: 6000,
                    position: 'top-right',
                    style: {
                        background: 'rgba(10, 26, 15, 0.95)',
                        color: '#fff',
                        border: '1px solid var(--accent)',
                        backdropFilter: 'blur(10px)',
                        padding: '16px',
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(212, 175, 55, 0.2)',
                    },
                }
            );
        });

        return () => {
            pusher.unsubscribe(`tournament-${tournamentId}`);
            pusher.disconnect();
        };
    }, [tournamentId]);

    return <Toaster />;
}
