import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Utensils, Award, Users, Camera, BarChart2, Flag, Settings, MessageCircle } from 'lucide-react';
import prisma from '@/lib/prisma';

export default async function Home() {
  const settings = await prisma.settings.findUnique({
    where: { id: 'tournament-settings' }
  });

  const showFood = settings?.showFood ?? true;
  const showAccommodations = settings?.showAccommodations ?? true;
  const showPhotos = settings?.showPhotos ?? false;

  const features = [
    { title: 'Lodging', icon: <MapPin size={40} />, path: '/lodging', desc: 'View accommodation details', hidden: !showAccommodations },
    { title: 'Courses', icon: <Flag size={40} />, path: '/courses', desc: 'Course maps and hole info' },
    { title: 'Food & Menu', icon: <Utensils size={40} />, path: '/food', desc: 'Dining options and menus', hidden: !showFood },
    { title: 'Prizes', icon: <Award size={40} />, path: '/prizes', desc: 'Check out the tournament prizes' },
    { title: 'Players', icon: <Users size={40} />, path: '/players', desc: 'See who is playing' },
    { title: 'Photos', icon: <Camera size={40} />, path: '/photos', desc: 'Upload and view gallery', hidden: !showPhotos },
    { title: 'Leaderboard', icon: <BarChart2 size={40} />, path: '/leaderboard', desc: 'Live scoring updates' },
    { title: 'Chat', icon: <MessageCircle size={40} />, path: 'https://groupme.com/join_group/112131184/5MyOtVkv', desc: 'Message board' },
    { title: 'Settings', icon: <Settings size={40} />, path: '/admin/settings', desc: 'Tournament configuration' },
  ].filter(feature => !feature.hidden);

  return (
    <div className="fade-in">
      <div style={{ textAlign: 'center', margin: '4rem 0' }}>
        <div style={{ position: 'relative', width: '400px', height: '400px', margin: '0 auto 2rem auto', borderRadius: '50%', overflow: 'hidden', boxShadow: '0 0 40px rgba(212, 175, 55, 0.2)' }}>
          <Image
            src="/images/williamsburg-logo.jpg"
            alt="Williamsburg Championship"
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
        <h1 className="section-title">Welcome to the Williamsburg 2026Tournament</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
          Everything you need for the tournament is right here. Please take the time and click around. If you have any questions, contact Edmond Ebeid at 703-798-9744 edebeid@gmail.com.
        </p>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto 4rem auto', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>Payment Information</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '1.1rem' }}>
          <div><strong>Venmo:</strong> @Edmond-Ebeid</div>
          <div><strong>Paypal:</strong> 703-798-9744</div>
          <div><strong>Zelle:</strong> 703-798-9744</div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem',
        marginBottom: '4rem'
      }}>
        {features.map((item) => (
          <Link href={item.path} key={item.path}>
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
