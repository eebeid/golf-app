import { getData } from '@/lib/data';
import PlayerList from '@/components/PlayerList';

export const dynamic = 'force-dynamic';

export default async function PlayersPage() {
    const players = await getData('players');

    return (
        <div className="fade-in">
            <PlayerList initialPlayers={players} />
        </div>
    );
}
