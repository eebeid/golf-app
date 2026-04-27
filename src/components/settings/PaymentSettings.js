import React, { useState, useEffect } from 'react';

export default function PaymentSettings({ tournamentId }) {
    const [venmo, setVenmo] = useState('');
    const [paypal, setPaypal] = useState('');
    const [zelle, setZelle] = useState('');
    const [savingPayment, setSavingPayment] = useState(false);
    const [paymentMessage, setPaymentMessage] = useState('');

    useEffect(() => {
        if (tournamentId) {
            fetchPaymentSettings();
        }
    }, [tournamentId]);

    const fetchPaymentSettings = async () => {
        try {
            const res = await fetch(`/api/settings?tournamentId=${tournamentId}`);
            if (res.ok) {
                const data = await res.json();
                setVenmo(data.venmo || '');
                setPaypal(data.paypal || '');
                setZelle(data.zelle || '');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSavePayment = async () => {
        setSavingPayment(true);
        setPaymentMessage('');

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId,
                    venmo,
                    paypal,
                    zelle
                })
            });

            if (res.ok) {
                setPaymentMessage('Payment info saved!');
                setTimeout(() => setPaymentMessage(''), 3000);
            } else {
                setPaymentMessage('Error saving payment info');
            }
        } finally {
            setSavingPayment(false);
        }
    };

    return (
        <div className="card">
            <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Payment Info</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Venmo Username</label>
                    <input
                        value={venmo}
                        onChange={(e) => setVenmo(e.target.value)}
                        placeholder="@username"
                        style={{ width: '100%', padding: '12px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius)' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>PayPal Email/Link</label>
                    <input
                        value={paypal}
                        onChange={(e) => setPaypal(e.target.value)}
                        placeholder="email@example.com or paypal.me/link"
                        style={{ width: '100%', padding: '12px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius)' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Zelle Info (Phone/Email)</label>
                    <input
                        value={zelle}
                        onChange={(e) => setZelle(e.target.value)}
                        placeholder="555-555-5555"
                        style={{ width: '100%', padding: '12px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius)' }}
                    />
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={handleSavePayment}
                    className="btn"
                    disabled={savingPayment}
                    style={{ minWidth: '150px' }}
                >
                    {savingPayment ? 'Saving...' : 'Save Payment Info'}
                </button>
                {paymentMessage && (
                    <span style={{
                        color: paymentMessage.includes('Error') ? '#ff6b6b' : 'var(--accent)',
                        fontWeight: 'bold'
                    }}>
                        {paymentMessage}
                    </span>
                )}
            </div>
        </div>
    );
}