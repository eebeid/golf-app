import Link from 'next/link';
import { MapPin, Utensils, Award, Users, Camera, BarChart2, Flag } from 'lucide-react';

export default function Home() {
  const features = [
    { title: 'Lodging', icon: <MapPin size={40} />, path: '/lodging', desc: 'View accommodation details' },
    { title: 'Courses', icon: <Flag size={40} />, path: '/courses', desc: 'Course maps and hole info' },
    { title: 'Food & Menu', icon: <Utensils size={40} />, path: '/food', desc: 'Dining options and menus' },
    { title: 'Prizes', icon: <Award size={40} />, path: '/prizes', desc: 'Check out the tournament prizes' },
    { title: 'Players', icon: <Users size={40} />, path: '/players', desc: 'See who is playing' },
    { title: 'Photos', icon: <Camera size={40} />, path: '/photos', desc: 'Upload and view gallery' },
    { title: 'Leaderboard', icon: <BarChart2 size={40} />, path: '/leaderboard', desc: 'Live scoring updates' },
  ];

  return (
    <div className="fade-in">
      <div style={{ textAlign: 'center', margin: '4rem 0' }}>
        <h1 className="section-title">Welcome to the Tournament</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
          Your companion for the ultimate golf experience.
          Access everything you need right here.
        </p>
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
