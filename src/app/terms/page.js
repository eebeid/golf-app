export default function TermsOfServicePage() {
    return (
        <div className="container fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 20px' }}>
            <h1 className="section-title" style={{ marginBottom: '2rem' }}>Terms of Service</h1>

            <div style={{ lineHeight: '1.8', color: 'var(--text-main)' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>1. Acceptance of Terms</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        Welcome to PinPlaced. By accessing or using our application, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our application.
                    </p>
                    <p>
                        These Terms constitute a legally binding agreement between you and PinPlaced. We reserve the right to modify these Terms at any time, and your continued use of the application constitutes acceptance of any changes.
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>2. Description of Service</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        PinPlaced provides a web-based platform for organizing and managing golf tournaments. Our services include:
                    </p>
                    <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
                        <li>Tournament creation and management</li>
                        <li>Player registration and handicap tracking</li>
                        <li>Score entry and leaderboard calculation</li>
                        <li>Tee time scheduling</li>
                        <li>Course information management</li>
                        <li>Communication tools for tournament participants</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>3. User Accounts and Authentication</h2>

                    <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>3.1 Account Creation</h3>
                    <p style={{ marginBottom: '1rem' }}>
                        To access certain features, you must authenticate using Google or Facebook OAuth. By creating an account, you represent that:
                    </p>
                    <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
                        <li>You are at least 13 years of age</li>
                        <li>All information you provide is accurate and current</li>
                        <li>You will maintain the security of your account credentials</li>
                    </ul>

                    <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>3.2 Admin Access</h3>
                    <p>
                        Admin access is restricted to authorized tournament organizers. Unauthorized access attempts may result in account termination and legal action.
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>4. User Responsibilities</h2>
                    <p style={{ marginBottom: '1rem' }}>You agree to:</p>
                    <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
                        <li>Provide accurate information when registering for tournaments</li>
                        <li>Report scores honestly and accurately</li>
                        <li>Respect other users and maintain appropriate conduct</li>
                        <li>Not use the application for any unlawful purpose</li>
                        <li>Not attempt to gain unauthorized access to any part of the application</li>
                        <li>Not interfere with or disrupt the application's functionality</li>
                        <li>Not upload malicious code, viruses, or harmful content</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>5. Intellectual Property Rights</h2>

                    <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>5.1 Our Rights</h3>
                    <p style={{ marginBottom: '1rem' }}>
                        All content, features, and functionality of the application, including but not limited to text, graphics, logos, icons, images, and software, are the exclusive property of PinPlaced and are protected by copyright, trademark, and other intellectual property laws.
                    </p>

                    <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>5.2 Your Rights</h3>
                    <p>
                        You retain ownership of any content you submit to the application (e.g., photos, scores, messages). By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and display such content for the purpose of operating and improving the application.
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>6. Prohibited Activities</h2>
                    <p style={{ marginBottom: '1rem' }}>You may not:</p>
                    <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
                        <li>Use the application for any illegal or unauthorized purpose</li>
                        <li>Violate any laws in your jurisdiction</li>
                        <li>Infringe upon the rights of others</li>
                        <li>Transmit spam, chain letters, or unsolicited communications</li>
                        <li>Impersonate any person or entity</li>
                        <li>Collect or harvest information about other users</li>
                        <li>Reverse engineer, decompile, or disassemble the application</li>
                        <li>Use automated systems (bots, scrapers) without permission</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>7. Tournament Rules and Scoring</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        Tournament organizers are responsible for establishing and enforcing tournament rules. PinPlaced provides tools for score tracking and leaderboard calculation, but we are not responsible for:
                    </p>
                    <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
                        <li>Verifying the accuracy of submitted scores</li>
                        <li>Resolving disputes between participants</li>
                        <li>Enforcing golf rules or handicap regulations</li>
                        <li>Prize distribution or tournament outcomes</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>8. Privacy and Data Protection</h2>
                    <p>
                        Your use of the application is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our <a href="/privacy" style={{ color: 'var(--accent)' }}>Privacy Policy</a> to understand how we collect, use, and protect your information.
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>9. Disclaimers and Limitations of Liability</h2>

                    <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>9.1 "As Is" Basis</h3>
                    <p style={{ marginBottom: '1rem' }}>
                        THE APPLICATION IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
                    </p>

                    <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>9.2 Limitation of Liability</h3>
                    <p style={{ marginBottom: '1rem' }}>
                        TO THE MAXIMUM EXTENT PERMITTED BY LAW, GOLF TOURNAMENT MANAGER SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
                    </p>

                    <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>9.3 No Warranty</h3>
                    <p>
                        We do not warrant that the application will be uninterrupted, secure, or error-free. We do not warrant the accuracy or completeness of any information provided through the application.
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>10. Indemnification</h2>
                    <p>
                        You agree to indemnify, defend, and hold harmless PinPlaced and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or related to your use of the application, violation of these Terms, or violation of any rights of another party.
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>11. Termination</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        We reserve the right to suspend or terminate your access to the application at any time, with or without cause, and with or without notice. Reasons for termination may include:
                    </p>
                    <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
                        <li>Violation of these Terms</li>
                        <li>Fraudulent or illegal activity</li>
                        <li>Requests by law enforcement or government agencies</li>
                        <li>Discontinuation or material modification of the application</li>
                    </ul>
                    <p>
                        Upon termination, your right to use the application will immediately cease. Sections of these Terms that by their nature should survive termination shall survive.
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>12. Third-Party Services</h2>
                    <p>
                        Our application may contain links to third-party websites or services (e.g., Google Maps, OAuth providers, golf course websites). We are not responsible for the content, privacy policies, or practices of any third-party services. Your use of third-party services is at your own risk.
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>13. Modifications to the Service</h2>
                    <p>
                        We reserve the right to modify, suspend, or discontinue the application (or any part thereof) at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuation of the application.
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>14. Governing Law and Dispute Resolution</h2>

                    <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>14.1 Governing Law</h3>
                    <p style={{ marginBottom: '1rem' }}>
                        These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
                    </p>

                    <h3 style={{ fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.75rem' }}>14.2 Dispute Resolution</h3>
                    <p>
                        Any disputes arising out of or relating to these Terms or the application shall be resolved through binding arbitration, except that either party may seek injunctive relief in court to prevent infringement of intellectual property rights.
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>15. Severability</h2>
                    <p>
                        If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect. The invalid or unenforceable provision shall be replaced with a valid provision that most closely matches the intent of the original provision.
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>16. Entire Agreement</h2>
                    <p>
                        These Terms, together with our Privacy Policy, constitute the entire agreement between you and PinPlaced regarding the use of the application and supersede all prior agreements and understandings.
                    </p>
                </section>

                <section style={{ marginBottom: '3rem' }}>
                    <h2 style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '1rem' }}>17. Contact Information</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        If you have any questions about these Terms, please contact us:
                    </p>
                    <div style={{ padding: '1.5rem', background: 'var(--bg-card)', borderRadius: 'var(--radius)', borderLeft: '4px solid var(--accent)' }}>
                        <p style={{ marginBottom: '0.5rem' }}><strong>PinPlaced</strong></p>
                        <p style={{ marginBottom: '0.5rem' }}>Email: legal@golftournamentmanager.com</p>
                        <p>Support: support@golftournamentmanager.com</p>
                    </div>
                </section>

                <div style={{ marginTop: '4rem', padding: '2rem', background: 'rgba(212, 175, 55, 0.1)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        By using PinPlaced, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                    </p>
                </div>
            </div>
        </div>
    );
}
