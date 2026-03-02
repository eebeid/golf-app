import { getData } from '@/lib/data';
import prisma from '@/lib/prisma';
import Image from 'next/image';
import PlayerList from '@/components/PlayerList';

export const dynamic = 'force-dynamic';

export default async function PlayersPage({ params }) {
    const { tournamentId } = params;
    const tournament = await prisma.tournament.findUnique({
        where: { slug: tournamentId },
        include: { courses: true, settings: true }
    });

    if (!tournament) return <div>Tournament not found</div>;

    const players = await getData('players', tournament.id);

    // Determine the active courses for this tournament
    const roundCourseIds = typeof tournament.settings?.roundCourses === 'string'
        ? JSON.parse(tournament.settings.roundCourses)
        : (tournament.settings?.roundCourses || []);

    const uniqueCourseIds = [...new Set(roundCourseIds)];
    const activeCourses = uniqueCourseIds.map(id => tournament.courses.find(c => c.id === id)).filter(Boolean);

    return (
        <div className="fade-in">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <Image src="/images/players-icon.png" alt="Players" width={150} height={150} style={{ height: 'auto', borderRadius: 'var(--radius)', boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' }} />
            </div>
            <PlayerList initialPlayers={players} tournamentSlug={tournamentId} activeCourses={activeCourses} />
        </div>
    );
}

