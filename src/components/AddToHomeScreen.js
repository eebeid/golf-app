"use client";

import { useState, useEffect } from 'react';
import { X, Share, PlusSquare } from 'lucide-react';

export default function AddToHomeScreen() {
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Check if already dismissed
        if (localStorage.getItem('a2hs-dismissed')) {
            return;
        }

        const userAgent = window.navigator.userAgent.toLowerCase();
        
        // Basic iOS detection (iPhone, iPad, iPod)
        const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);

        // Check if running in standalone mode (PWA)
        const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone);
        // Modern matchMedia check
        const isPwa = window.matchMedia('(display-mode: standalone)').matches || isInStandaloneMode;

        // Only show prompt if it's iOS and NOT in standalone mode
        // (Android has a native browser prompt for this automatically if manifest is valid)
        if (isIOSDevice && !isPwa) {
            // Delay showing slightly so it's not jarring on page load
            setTimeout(() => {
                setShowPrompt(true);
            }, 3000);
        }
    }, []);

    const dismissPrompt = () => {
        setShowPrompt(false);
        localStorage.setItem('a2hs-dismissed', 'true');
    };

    if (!showPrompt) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '400px',
            background: 'var(--bg-card)',
            border: '1px solid var(--accent)',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
            <button 
                onClick={dismissPrompt}
                style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                }}
            >
                <X size={18} />
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img 
                    src="/images/pinplaced_primary_logo_transparent.png" 
                    alt="PinPlaced" 
                    style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'contain', background: '#000' }} 
                />
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Install PinPlaced</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Get the full-screen app experience.</p>
                </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-main)' }}>
                Tap the <Share size={16} style={{ verticalAlign: 'middle', margin: '0 2px' }} /> <strong>Share</strong> button at the bottom of Safari, then scroll down and tap <PlusSquare size={16} style={{ verticalAlign: 'middle', margin: '0 2px' }} /> <strong>Add to Home Screen</strong>.
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes slideUp {
                    from { transform: translate(-50%, 100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
            `}} />
        </div>
    );
}
