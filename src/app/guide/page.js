import Link from 'next/link';
import { ArrowLeft, BookOpen, Flag, Users, Edit3, BarChart2, Home, Printer, Crown, CheckCircle, HelpCircle } from 'lucide-react';

export const metadata = {
    title: 'User Guide | PinPlaced Golf',
    description: 'Official tournament organizer and player guide for PinPlaced Golf.',
};

export default function UserGuidePage() {
    return (
        <div className="container fade-in" style={{ padding: '3rem 20px', maxWidth: '900px', margin: '0 auto' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '2rem' }}>
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(212,175,55,0.1)', borderRadius: '50%', marginBottom: '1rem' }}>
                    <BookOpen size={40} color="var(--accent)" />
                </div>
                <h1 style={{ fontFamily: 'var(--font-bodoni), serif', fontSize: '2.8rem', color: 'var(--accent)', margin: '0 0 0.5rem 0' }}>
                    PinPlaced User Guide
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                    Everything you need to know about setting up tournaments, managing players, logging live scores, and printing scorecards.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* 1. Quick Setup */}
                <div className="card" style={{ padding: '2rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent)', marginTop: 0 }}>
                        <CheckCircle size={24} /> 1. Getting Started & Quick Setup
                    </h2>
                    <p style={{ color: 'var(--text-main)', lineHeight: '1.7' }}>
                        To organize an event, sign in on the main splash screen and click <strong>"Create Tournament"</strong>.
                    </p>
                    <div style={{ background: 'var(--bg-dark)', padding: '1rem 1.5rem', borderRadius: '8px', borderLeft: '4px solid var(--accent)', margin: '1rem 0' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent)' }}>The Setup Checklist</h4>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                            <li><strong>Add a Course:</strong> Configure pars, tees, slopes, and ratings.</li>
                            <li><strong>Add Players:</strong> Input names, select tees, and add handicap indexes or GHIN numbers.</li>
                            <li><strong>Create Rounds:</strong> Configure round dates, starting times, and format structures.</li>
                            <li><strong>Publish Tee Times:</strong> Generate tee pairings for each course round.</li>
                        </ul>
                    </div>
                </div>

                {/* 2. Courses & Custom Holes */}
                <div className="card" style={{ padding: '2rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent)', marginTop: 0 }}>
                        <Flag size={24} /> 2. Managing Courses & Custom Holes
                    </h2>
                    <p style={{ color: 'var(--text-main)', lineHeight: '1.7' }}>
                        PinPlaced supports standard <strong>9-hole</strong>, <strong>18-hole</strong>, and arbitrary <strong>custom hole counts</strong> (such as 12-hole or 13-hole executive layouts).
                    </p>
                    <ol style={{ paddingLeft: '1.2rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                        <li>Go to <strong>Settings &gt; Courses</strong> and click <strong>Add Course</strong>.</li>
                        <li><strong>Holes Count:</strong> Input the exact number of holes played (e.g. 9, 12, 18).</li>
                        <li><strong>Tees & Ratings:</strong> Enter tee names, slope, and rating.</li>
                        <li><strong>Hole Breakdown:</strong> Customize individual Par and Handicap Index values for every hole.</li>
                    </ol>
                </div>

                {/* 3. Managing Players & GHIN */}
                <div className="card" style={{ padding: '2rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent)', marginTop: 0 }}>
                        <Users size={24} /> 3. Managing Players & GHIN Sync
                    </h2>
                    <p style={{ color: 'var(--text-main)', lineHeight: '1.7' }}>
                        Pairing player handicaps correctly ensures fair net scores on the leaderboard.
                    </p>
                    <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                        <li><strong>GHIN Integration:</strong> Enter a player's GHIN Number. PinPlaced automatically pulls their current handicap index and calculates their course-adjusted playing handicap.</li>
                        <li><strong>Manual Handicaps:</strong> Input a manual index if a player does not use GHIN.</li>
                        <li><strong>Tee Selection:</strong> Select default tee boxes per player so the app dynamically applies slope/rating adjustments.</li>
                    </ul>
                </div>

                {/* 4. Live & Public Scoring */}
                <div className="card" style={{ padding: '2rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent)', marginTop: 0 }}>
                        <Edit3 size={24} /> 4. Live Scoring & Public Scoring
                    </h2>
                    <p style={{ color: 'var(--text-main)', lineHeight: '1.7' }}>
                        Players can log scores directly on their phones using two flexible modes:
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                        <div style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                            <h4 style={{ color: 'var(--accent)', marginTop: 0 }}>Standard Account Scoring</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                                Signed-in players access the Live Scoring page (<code>/play</code>) to key in scores hole-by-hole for their group.
                            </p>
                        </div>
                        <div style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                            <h4 style={{ color: 'var(--accent)', marginTop: 0 }}>Public Anonymous Scoring</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                                Turn on <strong>Public Scoring</strong> in <em>Settings &gt; Players</em>. Anyone with the tournament link can enter scores without registering or signing in.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 5. Leaderboard & To Par Toggle */}
                <div className="card" style={{ padding: '2rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent)', marginTop: 0 }}>
                        <BarChart2 size={24} /> 5. Leaderboards & "+/- To Par" Toggle
                    </h2>
                    <p style={{ color: 'var(--text-main)', lineHeight: '1.7' }}>
                        The <strong>Leaderboard</strong> automatically aggregates hole scores into multiple scoring formats:
                    </p>
                    <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                        <li><strong>Gross & Net:</strong> Rank players by raw strokes or handicap-adjusted net strokes.</li>
                        <li><strong>Stableford:</strong> Point system rewarding eagles, birdies, and pars.</li>
                        <li><strong>Ryder Cup & Scramble:</strong> Multi-round match play team points and group scramble totals.</li>
                    </ul>
                    <div style={{ background: 'rgba(212,175,55,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.2)', marginTop: '1rem' }}>
                        <strong style={{ color: 'var(--accent)' }}>➕ Relative to Par Toggle:</strong>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
                            Check the <strong>"Show +/- Relative to Par"</strong> box on the Leaderboard tab to instantly view standings formatted like professional broadcasts (e.g. <code>-2</code>, <code>E</code>, <code>+4</code>).
                        </p>
                    </div>
                </div>

                {/* 6. Trip Planning */}
                <div className="card" style={{ padding: '2rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent)', marginTop: 0 }}>
                        <Home size={24} /> 6. Trip Logistics: Lodging, Food, & Budgets
                    </h2>
                    <p style={{ color: 'var(--text-main)', lineHeight: '1.7' }}>
                        Manage all non-golf trip details in one place:
                    </p>
                    <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                        <li><strong>Lodging:</strong> Organize players into houses, condos, or room numbers.</li>
                        <li><strong>Restaurants:</strong> Schedule group dinners and collect RSVPs.</li>
                        <li><strong>Budget Tracker:</strong> Log trip expenses and player contributions to see transparent balances of who owes what.</li>
                    </ul>
                </div>

                {/* 7. Printable PDFs */}
                <div className="card" style={{ padding: '2rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent)', marginTop: 0 }}>
                        <Printer size={24} /> 7. Printable Cart Signs & Scorecards
                    </h2>
                    <p style={{ color: 'var(--text-main)', lineHeight: '1.7' }}>
                        Paid tournaments can generate professional, print-ready PDFs:
                    </p>
                    <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                        <li><strong>Cart Signs:</strong> Formatted with player names, tee times, starting holes, and sponsor logos.</li>
                        <li><strong>Dotted Scorecards:</strong> Custom scorecards pre-populated with visual dots indicating which holes players receive handicap strokes on.</li>
                    </ul>
                </div>

                {/* 8. Pricing & Beta Code */}
                <div className="card" style={{ padding: '2rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent)', marginTop: 0 }}>
                        <Crown size={24} /> 8. Pricing Plans & Beta Tester Access
                    </h2>
                    <p style={{ color: 'var(--text-main)', lineHeight: '1.7' }}>
                        PinPlaced offers simple, transparent tiers:
                    </p>
                    <div style={{ overflowX: 'auto', margin: '1rem 0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '8px' }}>Tier</th>
                                    <th style={{ padding: '8px' }}>Price</th>
                                    <th style={{ padding: '8px' }}>Features</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '8px', fontWeight: 'bold' }}>Free</td>
                                    <td style={{ padding: '8px' }}>$0</td>
                                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>1 event, unlimited players, scoring & budget tracking</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '8px', fontWeight: 'bold', color: '#60a5fa' }}>Event Pass</td>
                                    <td style={{ padding: '8px' }}>$19 one-time</td>
                                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>Unlocks printable PDFs & cart signs for 1 event</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '8px', fontWeight: 'bold', color: 'var(--accent)' }}>Pro Annual</td>
                                    <td style={{ padding: '8px' }}>$49 / yr</td>
                                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>Unlimited events, printable PDFs, custom branding & sponsor logos</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', marginTop: '1rem' }}>
                        <strong style={{ color: 'var(--accent)' }}>🎟️ Have a Beta Promo Code?</strong>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
                            If you were given a beta promo code (e.g. <code>GOLF-BETA-FREE</code>), sign in, scroll to the bottom of the home pricing page, enter the code in the <strong>Beta Tester</strong> input, and click <strong>Redeem</strong> to instantly activate Pro Annual for free!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
