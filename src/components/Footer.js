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
                <p>&copy; {new Date().getFullYear()} Golf Tournament App. All rights reserved.</p>
            </div>
        </footer>
    );
}
