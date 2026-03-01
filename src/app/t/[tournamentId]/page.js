import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Utensils, Award, Users, Camera, BarChart2, Flag, Settings, MessageCircle } from 'lucide-react';
import prisma from '@/lib/prisma';
import HighlightsFeed from '@/components/highlights/HighlightsFeed';

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

  const basePath = `/t/${tournamentId}`;

  const features = [
    { title: 'Lodging', icon: <MapPin size={40} />, path: `${basePath}/lodging`, desc: 'View accommodation details', hidden: !showAccommodations },
    { title: 'Courses', icon: <Flag size={40} />, path: `${basePath}/courses`, desc: 'Course maps and hole info' },
    { title: 'Food & Menu', icon: <Utensils size={40} />, path: `${basePath}/food`, desc: 'Dining options and menus', hidden: !showFood },
    { title: 'Prizes', icon: <Award size={40} />, path: `${basePath}/prizes`, desc: 'Check out the tournament prizes' },
    { title: 'Players', icon: <Users size={40} />, path: `${basePath}/players`, desc: 'See who is playing' },
    { title: 'Photos', icon: <Camera size={40} />, path: `${basePath}/photos`, desc: 'Upload and view gallery', hidden: !showPhotos },
    { title: 'Leaderboard', icon: <BarChart2 size={40} />, path: `${basePath}/leaderboard`, desc: 'Live scoring updates' },
    { title: 'Chat', icon: <MessageCircle size={40} />, path: `${basePath}/chat`, desc: 'Message board' },
    { title: 'Settings', icon: <Settings size={40} />, path: `${basePath}/admin/settings`, desc: 'Tournament configuration' },
  ].filter(feature => !feature.hidden);

  return (
    <div className="fade-in">
      <div style={{ textAlign: 'center', margin: '4rem 0' }}>
        <div style={{ position: 'relative', width: '100%', height: '350px', margin: '0 auto 2rem auto' }}>
          <Image
            src={settings?.logoUrl || "/images/logo.png"}
            alt={settings?.tournamentName || tournament.name}
            fill
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
        <h1 className="section-title">Welcome to {settings?.tournamentName || tournament.name}</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
          Everything you need for the tournament is right here. Please take the time and click around. If you have any questions, contact the administrator.
        </p>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto 2rem auto' }}>
        <HighlightsFeed tournamentId={tournamentId} />
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto 4rem auto', textAlign: 'center' }}>
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
