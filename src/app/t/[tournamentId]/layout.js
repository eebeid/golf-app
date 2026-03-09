
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import FloatingSignIn from '@/components/FloatingSignIn';
import prisma from '@/lib/prisma';

export async function generateMetadata({ params }) {
    const { tournamentId } = params;
    try {
        // Try to find tournament by slug or ID
        // For now we assume tournamentId might be the ID or Slug.
        // Let's fetch settings.
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
    // Extract tournamentId from params
    const { tournamentId } = params;

    const tournament = await prisma.tournament.findUnique({
        where: { slug: tournamentId }
    });

    const settings = tournament ? await prisma.settings.findUnique({
        where: { tournamentId: tournament.id }
    }) : null;

    const bgColor = settings?.backgroundColor || '#0a1a0f';

    // Calculate a slightly lighter color for cards based on the background
    // For simplicity, we'll just use the same color for now or a semi-transparent overlay
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
        </div>
    );
}
