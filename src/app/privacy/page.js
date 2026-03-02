export default function PrivacyPolicyPage() {
    return (
        <div className="container fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 20px' }}>
            <h1 className="section-title" style={{ marginBottom: '2rem' }}>Privacy Policy</h1>

            <div style={{ lineHeight: '1.8', color: 'var(--text-main)' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>1. Introduction</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        Welcome to PinPlaced ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our golf tournament management application.
                    </p>
                    <p>
                        By using our application, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our application.
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>2. Information We Collect</h2>

                    <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>2.1 Personal Information</h3>
                    <p style={{ marginBottom: '1rem' }}>We may collect the following personal information:</p>
                    <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
                        <li>Name and email address (via Google or Facebook OAuth)</li>
                        <li>Profile picture (from your OAuth provider)</li>
                        <li>Golf handicap information</li>
                        <li>Tournament registration details</li>
                        <li>Scores and performance data</li>
                    </ul>

                    <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>2.2 Automatically Collected Information</h3>
                    <p style={{ marginBottom: '1rem' }}>When you access our application, we may automatically collect:</p>
                    <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
                        <li>Device information (browser type, operating system)</li>
                        <li>Usage data (pages visited, time spent on pages)</li>
                        <li>IP address and location data</li>
                        <li>Cookies and similar tracking technologies</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>3. How We Use Your Information</h2>
                    <p style={{ marginBottom: '1rem' }}>We use the collected information for the following purposes:</p>
                    <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
                        <li><strong>Tournament Management:</strong> To organize and manage golf tournaments, track scores, and calculate leaderboards</li>
                        <li><strong>Authentication:</strong> To verify your identity and provide secure access to admin features</li>
                        <li><strong>Communication:</strong> To send tournament updates, notifications, and important information</li>
                        <li><strong>Improvement:</strong> To analyze usage patterns and improve our application's functionality</li>
                        <li><strong>Compliance:</strong> To comply with legal obligations and protect our rights</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>4. Information Sharing and Disclosure</h2>
                    <p style={{ marginBottom: '1rem' }}>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
                    <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
                        <li><strong>Tournament Participants:</strong> Your name, scores, and handicap may be visible to other tournament participants</li>
                        <li><strong>Service Providers:</strong> We may share data with trusted third-party service providers (e.g., hosting, authentication) who assist in operating our application</li>
                        <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights and safety</li>
                        <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>5. Third-Party Authentication</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        We use Google and Facebook OAuth for authentication. When you sign in using these services, we receive limited information from your account (name, email, profile picture) as permitted by your privacy settings with those providers. Please review the privacy policies of Google and Facebook for information about their data practices:
                    </p>
                    <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
                        <li><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Google Privacy Policy</a></li>
                        <li><a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Facebook Privacy Policy</a></li>
                    </ul>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>6. Data Security</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
                    </p>
                    <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
                        <li>Encrypted data transmission (HTTPS/SSL)</li>
                        <li>Secure database storage with access controls</li>
                        <li>Regular security audits and updates</li>
                        <li>Limited access to personal information by authorized personnel only</li>
                    </ul>
                    <p>
                        However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>7. Data Retention</h2>
                    <p>
                        We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. Tournament data may be retained for historical record-keeping purposes.
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>8. Your Rights and Choices</h2>
                    <p style={{ marginBottom: '1rem' }}>You have the following rights regarding your personal information:</p>
                    <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
                        <li><strong>Access:</strong> Request access to the personal information we hold about you</li>
                        <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                        <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal obligations)</li>
                        <li><strong>Opt-Out:</strong> Opt out of certain data collection and communications</li>
                        <li><strong>Data Portability:</strong> Request a copy of your data in a portable format</li>
                    </ul>

                    <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>Account Deletion</h3>
                    <p style={{ marginBottom: '1rem' }}>
                        You can permanently delete your account and all associated data at any time through your <a href="/account" style={{ color: 'var(--accent)' }}>Account Settings</a>. When you delete your account:
                    </p>
                    <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
                        <li>Your user profile and authentication data will be permanently removed</li>
                        <li>All tournaments you created will be deleted</li>
                        <li>All associated data (scores, players, photos, messages) will be permanently erased</li>
                        <li>This action is irreversible and cannot be undone</li>
                    </ul>

                    <p>
                        To exercise other rights, please contact the tournament administrator or reach out through our support channels.
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>9. Cookies and Tracking Technologies</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        We use cookies and similar tracking technologies to enhance your experience. Cookies are small data files stored on your device. We use:
                    </p>
                    <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
                        <li><strong>Essential Cookies:</strong> Required for authentication and basic functionality</li>
                        <li><strong>Performance Cookies:</strong> Help us understand how users interact with our application</li>
                        <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                    </ul>
                    <p>
                        You can control cookie settings through your browser preferences, but disabling cookies may limit certain features of our application.
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>10. Children's Privacy</h2>
                    <p>
                        Our application is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected information from a child under 13, please contact us immediately so we can delete such information.
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>11. International Data Transfers</h2>
                    <p>
                        Your information may be transferred to and maintained on servers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ. By using our application, you consent to such transfers.
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>12. Changes to This Privacy Policy</h2>
                    <p>
                        We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of the application after such changes constitutes acceptance of the updated policy.
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>13. Contact Us</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                    </p>
                    <div style={{ padding: '1.5rem', background: 'var(--bg-card)', borderRadius: 'var(--radius)', borderLeft: '4px solid var(--accent)' }}>
                        <p style={{ marginBottom: '0.5rem' }}><strong>PinPlaced</strong></p>
                        <p style={{ marginBottom: '0.5rem' }}>Email: privacy@golftournamentmanager.com</p>
                        <p>For tournament-specific inquiries, please contact your tournament administrator.</p>
                    </div>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>14. California Privacy Rights</h2>
                    <p>
                        If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information we collect, the right to delete your information, and the right to opt-out of the sale of your information (note: we do not sell personal information).
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>15. GDPR Compliance (European Users)</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        If you are located in the European Economic Area (EEA), you have rights under the General Data Protection Regulation (GDPR), including:
                    </p>
                    <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
                        <li>Right to access your personal data</li>
                        <li>Right to rectification of inaccurate data</li>
                        <li>Right to erasure ("right to be forgotten")</li>
                        <li>Right to restrict processing</li>
                        <li>Right to data portability</li>
                        <li>Right to object to processing</li>
                        <li>Right to withdraw consent</li>
                    </ul>
                    <p>
                        Our legal basis for processing your data includes consent, contractual necessity, and legitimate interests. You have the right to lodge a complaint with a supervisory authority in your jurisdiction.
                    </p>
                </section>

                <div style={{ marginTop: '4rem', padding: '2rem', background: 'rgba(212, 175, 55, 0.1)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        By using PinPlaced, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.
                    </p>
                </div>
            </div>
        </div>
    );
}
