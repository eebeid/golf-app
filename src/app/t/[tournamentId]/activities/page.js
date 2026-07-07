import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import SignupWizard from '@/components/SignupWizard';
import ActivityList from '@/components/ActivityList';

export const dynamic = 'force-dynamic';

export default async function ActivitiesPage({ params }) {
    const { tournamentId } = await params;
    const slug = tournamentId;

    // Fetch tournament
    const tournament = await prisma.tournament.findFirst({
        where: { OR: [{ slug }, { id: slug }] }
    });

    if (!tournament) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '1.1rem' }}>Tournament not found.</p>
            </div>
        );
    }

    // Fetch user session
    const session = await getServerSession(authOptions);
    
    // Find player record for this user session
    let player = null;
    if (session?.user?.email) {
        player = await prisma.player.findFirst({
            where: {
                tournamentId: tournament.id,
                email: {
                    equals: session.user.email,
                    mode: 'insensitive'
                }
            }
        });
    }

    // Fetch activities with signups
    const activities = await prisma.activity.findMany({
        where: { tournamentId: tournament.id },
        include: {
            signups: {
                include: {
                    player: true
                }
            }
        },
        orderBy: { date: 'asc' }
    });

    // Determine future activities for the quick signup wizard
    const now = new Date();
    const futureActivities = activities.filter(a => new Date(a.date) > now);
    const unsignedActivities = player
        ? futureActivities.filter(a => !a.signups.some(s => s.playerId === player.id))
        : [];

    return (
        <div className="fade-in">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <img src="/images/schedule-icon.png" alt="Activities" width={150} height={150} style={{ height: '150px', width: 'auto', borderRadius: 'var(--radius)', boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' }} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 className="section-title" style={{ margin: 0 }}>Trip Activities</h1>
            </div>

            {player && unsignedActivities.length > 0 && (
                <SignupWizard 
                    playerId={player.id} 
                    activities={unsignedActivities} 
                    onSignupSuccess={null} // ActivityList will fetch or update locally as needed
                />
            )}

            <ActivityList 
                activities={activities} 
                player={player} 
                tournamentId={tournament.id}
                onSignupChange={null}
            />
        </div>
    );
}
