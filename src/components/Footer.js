import Link from 'next/link';

export default function Footer() {
    return (
        <footer style={{
            marginTop: 'auto',
            padding: '2rem 0',
            borderTop: '1px solid var(--glass-border)',
            textAlign: 'center',
            color: 'var(--text-muted)'
        }}>
            <div className="container">
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    alignItems: 'center'
                }}>
                    <div style={{
                        display: 'flex',
                        gap: '2rem',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        fontSize: '0.9rem'
                    }}>
                        <Link
                            href="/privacy"
                            style={{
                                color: 'var(--text-muted)',
                                textDecoration: 'none',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.color = 'var(--accent)'}
                            onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                        >
                            Privacy Policy
                        </Link>
                        <Link
                            href="/terms"
                            style={{
                                color: 'var(--text-muted)',
                                textDecoration: 'none',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.color = 'var(--accent)'}
                            onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                        >
                            Terms of Service
                        </Link>
                        <a
                            href="mailto:support@golftournamentmanager.com"
                            style={{
                                color: 'var(--text-muted)',
                                textDecoration: 'none',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.color = 'var(--accent)'}
                            onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                        >
                            Contact
                        </a>
                    </div>
                    <p style={{ fontSize: '0.85rem' }}>
                        &copy; {new Date().getFullYear()} Golf Tournament Manager. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
