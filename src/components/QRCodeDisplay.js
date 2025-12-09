"use client";

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function QRCodeDisplay() {
    const [src, setSrc] = useState('');
    const [url, setUrl] = useState('');

    useEffect(() => {
        // Construct the upload URL based on current origin
        const uploadUrl = `${window.location.origin}/photos/upload`;
        setUrl(uploadUrl);
        QRCode.toDataURL(uploadUrl)
            .then(setSrc)
            .catch(err => console.error(err));
    }, []);

    if (!src) return <div>Loading QR Code...</div>;

    return (
        <div style={{ textAlign: 'center', background: '#fff', padding: '1rem', borderRadius: 'var(--radius)', display: 'inline-block' }}>
            <img src={src} alt="Upload QR Code" style={{ width: '150px', height: '150px' }} />
            <p style={{ color: '#000', fontSize: '0.8rem', marginTop: '0.5rem' }}>Scan to Upload</p>
        </div>
    );
}
