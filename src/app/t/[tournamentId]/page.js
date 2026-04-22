import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Utensils, Award, Users, Camera, BarChart2, Flag, Settings, MessageCircle, Music } from 'lucide-react';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isSuperAdmin } from "@/lib/admin";
import HighlightsFeed from '@/components/highlights/HighlightsFeed';
import WeatherWidget from '@/components/WeatherWidget';
import { APP_VERSION } from '@/lib/version';

export default async function Home({ params }) {
  const { tournamentId } = await params;
  const slug = tournamentId;

  // Find tournament
  let tournament = await prisma.tournament.findUnique({
    where: { slug: tournamentId },
    include: { courses: true }
  });

  if (!tournament) {
    return <div className="container" style={{ padding: '4rem' }}>Tournament not found.</div>;
  }

  const settings = await prisma.settings.findUnique({
    where: { tournamentId: tournament.id }
  });

  const showFood = settings?.showFood ?? true;
  const showAccommodations = settings?.showAccommodations ?? true;
  const showPhotos = settings?.showPhotos ?? false;
  const showScorecards = settings?.showScorecards ?? true;
  const showChat = settings?.showChat ?? true;
  const showCourses = settings?.showCourses ?? true;
  const showLeaderboard = settings?.showLeaderboard ?? true;
  const showPlayers = settings?.showPlayers ?? true;
  const showSchedule = settings?.showSchedule ?? true;
  const showStats = settings?.showStats ?? true;

  let spotifyUrl = null;
  let showPrizes = settings?.showPrizes ?? true;
  if (settings?.roundTimeConfig && typeof settings.roundTimeConfig === 'object') {
    const config = typeof settings.roundTimeConfig === 'string' ? JSON.parse(settings.roundTimeConfig) : settings.roundTimeConfig;
    spotifyUrl = config.spotifyUrl;
    if (config.showPrizes !== undefined) showPrizes = config.showPrizes;
  }

  const basePath = `/t/${tournamentId}`;
  const session = await getServerSession(authOptions);
  let isAdmin = false;

  if (session?.user?.id === tournament.ownerId) {
    isAdmin = true;
  }

  // Also allow global admins
  if (session?.user?.email && isSuperAdmin(session.user.email)) {
    isAdmin = true;
  }

  // Check if player is a manager
  if (!isAdmin && session?.user?.email) {
    const player = await prisma.player.findFirst({
      where: {
        tournamentId: tournament.id,
        email: session.user.email,
        isManager: true
      }
    });
    if (player) {
      isAdmin = true;
    }
  }

  const features = [
    { title: 'Lodging', icon: <MapPin size={40} />, path: `${basePath}/lodging`, desc: 'View accommodation details', hidden: !showAccommodations },
    { title: 'Courses', icon: <Flag size={40} />, path: `${basePath}/courses`, desc: 'Course maps and hole info', hidden: !showCourses },
    { title: 'Food & Menu', icon: <Utensils size={40} />, path: `${basePath}/food`, desc: 'Dining options and menus', hidden: !showFood },
    { title: 'Prizes', icon: <Award size={40} />, path: `${basePath}/prizes`, desc: 'Check out the tournament prizes', hidden: !showPrizes },
    { title: 'Players', icon: <Users size={40} />, path: `${basePath}/players`, desc: 'See who is playing', hidden: !showPlayers },
    { title: 'Photos', icon: <Camera size={40} />, path: `${basePath}/photos`, desc: 'Upload and view gallery', hidden: !showPhotos },
    { title: 'Leaderboard', icon: <BarChart2 size={40} />, path: `${basePath}/leaderboard`, desc: 'Live scoring updates', hidden: !showLeaderboard },
    { title: 'Scorecards', icon: <Camera size={40} />, path: `${basePath}/admin/scorecards`, desc: 'Upload scorecard photos', hidden: !showScorecards },
    { title: 'Chat', icon: <MessageCircle size={40} />, path: `${basePath}/chat`, desc: 'Message board', hidden: !showChat },
    { title: 'Settings', icon: <Settings size={40} />, path: `${basePath}/admin/settings`, desc: 'Tournament configuration', hidden: !isAdmin },
  ].filter(feature => !feature.hidden);

  // Get coordinates for the weather widget from the first available course
  const firstCourse = tournament.courses && tournament.courses.length > 0 ? tournament.courses[0] : null;
  const weatherLat = firstCourse?.lat || null;
  const weatherLng = firstCourse?.lng || null;

  return (
    <div className="fade-in">
      <div style={{ textAlign: 'center', margin: '4rem 0' }}>
        <div style={{ position: 'relative', width: '250px', height: '250px', margin: '0 auto 2rem auto' }}>
          <img
            src={settings?.logoUrl || "/images/pinplaced_primary_logo_transparent.png"}
            alt={settings?.tournamentName || tournament.name}
            style={{ objectFit: 'contain', width: '250px', height: '250px' }}
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
              <div style={{ color: 'var(--text-muted)' }}>No payment information available. Contact the admin to setup this page in the settings.</div>
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

      {weatherLat && weatherLng && (
        <div style={{ marginBottom: '4rem' }}>
          <WeatherWidget lat={weatherLat} lng={weatherLng} timezone={settings?.timezone} />
        </div>
      )}

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
