
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

export default function TournamentLayout({ children, params }) {
    // Extract tournamentId from params
    const { tournamentId } = params;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navigation tournamentId={tournamentId} />
            <main className="container" style={{ flex: 1, width: '100%', padding: '5px' }}>
                {children}
            </main>
            <Footer />
            <FloatingSignIn />
        </div>
    );
}
