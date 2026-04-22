import { getData } from '@/lib/data';
import prisma from '@/lib/prisma';
import Image from 'next/image';
import PlayerList from '@/components/PlayerList';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PlayersPage({ params }) {
    const { tournamentId } = await params;
    const slug = tournamentId;
    const tournament = await prisma.tournament.findUnique({
        where: { slug: tournamentId },
        include: {
            courses: true,
            settings: true,
            owner: {
                select: { isPro: true }
            }
        }
    });

    if (!tournament) return <div>Tournament not found</div>;

    if (tournament.settings?.showPlayers === false) {
        redirect(`/t/${tournamentId}`);
    }

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
                <img src="/images/players-icon.png" alt="Players" width={150} height={150} style={{ height: '150px', width: 'auto', borderRadius: 'var(--radius)', boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' }} />
            </div>
            <PlayerList
                initialPlayers={players}
                tournamentSlug={tournamentId}
                activeCourses={activeCourses}
                isPro={tournament.owner?.isPro || false}
                allowPlayerEdits={tournament.settings?.allowPlayerEdits || false}
            />
        </div>
    );
}
