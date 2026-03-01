import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Utensils, Award, Users, Camera, BarChart2, Flag, Settings, MessageCircle, Music } from 'lucide-react';
import prisma from '@/lib/prisma';
import HighlightsFeed from '@/components/highlights/HighlightsFeed';
import { APP_VERSION } from '@/lib/version';

export default async function Home({ params }) {
  const { tournamentId } = params;

  // Find tournament
  let tournament = await prisma.tournament.findUnique({ where: { slug: tournamentId } });

  if (!tournament) {
    return <div className="container" style={{ padding: '4rem' }}>Tournament not found.</div>;
  }

  const settings = await prisma.settings.findUnique({
    where: { tournamentId: tournament.id }
  });

  const showFood = settings?.showFood ?? true;
  const showAccommodations = settings?.showAccommodations ?? true;
  const showPhotos = settings?.showPhotos ?? false;

  let spotifyUrl = null;
  let showPrizes = true;
  if (settings?.roundTimeConfig && typeof settings.roundTimeConfig === 'object') {
    const config = typeof settings.roundTimeConfig === 'string' ? JSON.parse(settings.roundTimeConfig) : settings.roundTimeConfig;
    spotifyUrl = config.spotifyUrl;
    if (config.showPrizes !== undefined) showPrizes = config.showPrizes;
  }

  const basePath = `/t/${tournamentId}`;

  const features = [
    { title: 'Lodging', icon: <MapPin size={40} />, path: `${basePath}/lodging`, desc: 'View accommodation details', hidden: !showAccommodations },
    { title: 'Courses', icon: <Flag size={40} />, path: `${basePath}/courses`, desc: 'Course maps and hole info' },
    { title: 'Food & Menu', icon: <Utensils size={40} />, path: `${basePath}/food`, desc: 'Dining options and menus', hidden: !showFood },
    { title: 'Prizes', icon: <Award size={40} />, path: `${basePath}/prizes`, desc: 'Check out the tournament prizes', hidden: !showPrizes },
    { title: 'Players', icon: <Users size={40} />, path: `${basePath}/players`, desc: 'See who is playing' },
    { title: 'Photos', icon: <Camera size={40} />, path: `${basePath}/photos`, desc: 'Upload and view gallery', hidden: !showPhotos },
    { title: 'Leaderboard', icon: <BarChart2 size={40} />, path: `${basePath}/leaderboard`, desc: 'Live scoring updates' },
    { title: 'Chat', icon: <MessageCircle size={40} />, path: `${basePath}/chat`, desc: 'Message board' },
    { title: 'Settings', icon: <Settings size={40} />, path: `${basePath}/admin/settings`, desc: 'Tournament configuration' },
  ].filter(feature => !feature.hidden);

  return (
    <div className="fade-in">
      <div style={{ textAlign: 'center', margin: '4rem 0' }}>
        <div style={{ position: 'relative', width: '250px', height: '250px', margin: '0 auto 2rem auto' }}>
          <Image
            src={settings?.logoUrl || "/images/logo.png"}
            alt={settings?.tournamentName || tournament.name}
            fill
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
        <h1 className="section-title">Welcome to {settings?.tournamentName || tournament.name}</h1>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.75rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)',
            borderRadius: '20px', padding: '0.25rem 0.85rem',
            fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.04em'
          }}>
            ⛳ PinPlaced v{APP_VERSION}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto 2rem auto' }}>
        <HighlightsFeed tournamentId={tournamentId} />
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '4rem' }}>

        {/* Payment Info Card */}
        <div className="card" style={{ flex: '1 1 400px', maxWidth: '600px', textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>Payment Information</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '1.1rem' }}>
            {settings?.venmo && (
              <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'block', marginBottom: '0.2rem' }}>VENMO</span>
                <strong style={{ fontSize: '1.2rem' }}>{settings.venmo}</strong>
              </div>
            )}
            {settings?.paypal && (
              <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'block', marginBottom: '0.2rem' }}>PAYPAL</span>
                <strong style={{ fontSize: '1.2rem' }}>{settings.paypal}</strong>
              </div>
            )}
            {settings?.zelle && (
              <div style={{ padding: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'block', marginBottom: '0.2rem' }}>ZELLE</span>
                <strong style={{ fontSize: '1.2rem' }}>{settings.zelle}</strong>
              </div>
            )}

            {!settings?.venmo && !settings?.paypal && !settings?.zelle && (
              <div style={{ color: 'var(--text-muted)' }}>No payment information available.</div>
            )}
          </div>
        </div>

        {/* Spotify Jam Card */}
        {spotifyUrl && (
          <div className="card" style={{ flex: '1 1 400px', maxWidth: '600px', textAlign: 'center', padding: '2rem' }}>
            <h2 style={{ color: '#1DB954', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
              <Music size={28} /> Spotify Jam
            </h2>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', display: 'inline-block', marginBottom: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
              {/* Using standard img to avoid next/image layout warnings with external URLs without config */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(spotifyUrl)}`}
                width={250}
                height={250}
                alt="Spotify QR Code"
                style={{ display: 'block' }}
              />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Scan to join the playlist and queue some tracks!</p>
            <a href={spotifyUrl} target="_blank" rel="noopener noreferrer" className="btn" style={{ background: '#1DB954', color: 'black', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', fontWeight: 'bold' }}>
              <Music size={18} /> Open in Spotify
            </a>
          </div>
        )}

      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem',
        marginBottom: '4rem'
      }}>
        {features.map((item) => (
          <Link href={item.path} key={item.path} target={item.target} rel={item.target === '_blank' ? "noopener noreferrer" : undefined}>
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
              <div style={{ color: 'var(--accent)' }}>{item.icon}</div>
              <h2 style={{ fontSize: '1.5rem' }}>{item.title}</h2>
              <p style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
