"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
    const router = useRouter();

    useEffect(() => {
        // Build the GroupMe URL
        const groupMeUrl = 'https://groupme.com/join_group/112131184/5MyOtVkv';

        // Redirect to GroupMe
        window.location.href = groupMeUrl;
    }, [router]);

    return (
        <div className="fade-in" style={{
            height: 'calc(100vh - 100px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '1rem'
        }}>
            <div className="card" style={{ textAlign: 'center' }}>
                <h2 style={{ marginBottom: '1rem' }}>Redirecting to Group Chat...</h2>
                <p>If you are not redirected automatically, <a href="https://groupme.com/join_group/112131184/5MyOtVkv" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>click here</a>.</p>
            </div>
        </div>
    );
}
