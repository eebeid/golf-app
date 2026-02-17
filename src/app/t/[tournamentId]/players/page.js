import { getData } from '@/lib/data';
import prisma from '@/lib/prisma';
import PlayerList from '@/components/PlayerList';

export const dynamic = 'force-dynamic';

export default async function PlayersPage({ params }) {
    const { tournamentId } = params;
    const tournament = await prisma.tournament.findUnique({ where: { slug: tournamentId } });

    if (!tournament) return <div>Tournament not found</div>;

    const players = await getData('players', tournament.id);

    return (
        <div className="fade-in">
            <PlayerList initialPlayers={players} tournamentSlug={tournamentId} />
        </div>
    );
}

