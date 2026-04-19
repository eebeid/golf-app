
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import FloatingSignIn from '@/components/FloatingSignIn';
import RealTimeNotifications from '@/components/RealTimeNotifications';
import prisma from '@/lib/prisma';

export async function generateMetadata({ params }) {
    const { tournamentId } = await params;
    try {
        const settings = await prisma.settings.findFirst({
            where: {
                tournament: {
                    OR: [
                        { id: tournamentId },
                        { slug: tournamentId }
                    ]
                }
            }
        });

        return {
            title: settings?.tournamentName || 'Golf Tournament App',
            description: 'Official application for the Golf Tournament',
        };
    } catch (e) {
        return {
            title: 'Golf Tournament App',
            description: 'Official application for the Golf Tournament',
        };
    }
}

export default async function TournamentLayout({ children, params }) {
    // In Next.js 15+, params is a Promise and must be awaited
    const { tournamentId } = await params;

    const tournament = await prisma.tournament.findUnique({
        where: { slug: tournamentId }
    });

    const settings = tournament ? await prisma.settings.findUnique({
        where: { tournamentId: tournament.id }
    }) : null;

    const bgColor = settings?.backgroundColor || '#0a1a0f';
    const bgCard = settings?.backgroundColor ? `${settings.backgroundColor}e6` : '#142a1b';

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            transition: 'background-color 0.5s ease'
        }}>
            <style dangerouslySetInnerHTML={{
                __html: `
                :root {
                    --bg-dark: ${bgColor};
                    --bg-card: ${bgCard};
                    --glass: ${bgColor}b3;
                }
                body {
                    background-color: ${bgColor} !important;
                }
            ` }} />
            <Navigation tournamentId={tournamentId} />
            <main className="container" style={{ flex: 1, width: '100%', padding: '5px' }}>
                {children}
            </main>
            <Footer />
            <FloatingSignIn />
            {tournament && <RealTimeNotifications tournamentId={tournament.id} />}
        </div>
    );
}
