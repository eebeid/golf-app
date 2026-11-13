import { getData } from '@/lib/data';
import prisma from '@/lib/prisma';
import Image from 'next/image';
import PlayerList from '@/components/PlayerList';
import { redirect } from 'next/navigation';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isSuperAdmin } from "@/lib/admin";

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

    const session = await getServerSession(authOptions);
    let isAdmin = false;
    let currentUserEmail = session?.user?.email || null;

    if (session?.user) {
        if (session.user.id === tournament.ownerId) isAdmin = true;
        else if (isSuperAdmin(session.user.email)) isAdmin = true;
        else {
            const playerManager = await prisma.player.findFirst({
                where: { tournamentId: tournament.id, email: session.user.email, isManager: true }
            });
            if (playerManager) isAdmin = true;
        }
    }

    const players = await getData('players', tournament.id);

    // Determine the active courses for this tournament
    const roundCourseIds = typeof tournament.settings?.roundCourses === 'string'
        ? JSON.parse(tournament.settings.roundCourses)
        : (tournament.settings?.roundCourses || []);

    const uniqueCourseIds = [...new Set(roundCourseIds)];
    let activeCourses = uniqueCourseIds.map(id => tournament.courses.find(c => c.id === id)).filter(Boolean);
    if (activeCourses.length === 0 && tournament.courses?.length > 0) {
        activeCourses = tournament.courses;
    }

    const settings = tournament.settings || {};
    const tournamentDisplayName = settings.tournamentName || tournament.name || 'Golf Tournament';
    const hasCustomLogo = settings.logoUrl && settings.logoUrl !== '/images/pinplaced_primary_logo_transparent.png';
    const logoSrc = hasCustomLogo ? settings.logoUrl : (settings.logoUrl || '/images/players-icon.png');

    return (
        <div className="fade-in">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <img 
                    src={logoSrc} 
                    alt={tournamentDisplayName} 
                    width={150} 
                    height={150} 
                    style={{ 
                        height: '150px', 
                        width: 'auto', 
                        maxWidth: '220px',
                        objectFit: hasCustomLogo ? 'contain' : 'cover',
                        borderRadius: 'var(--radius)', 
                        boxShadow: hasCustomLogo ? 'none' : '0 0 20px rgba(212, 175, 55, 0.3)' 
                    }} 
                />
                {tournamentDisplayName && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {tournamentDisplayName}
                    </div>
                )}
            </div>
            <PlayerList
                initialPlayers={players}
                tournamentSlug={tournamentId}
                tournamentDisplayName={tournamentDisplayName}
                activeCourses={activeCourses}
                isPro={tournament.owner?.isPro || false}
                allowPlayerEdits={tournament.settings?.allowPlayerEdits || false}
                isAdmin={isAdmin}
                currentUserEmail={currentUserEmail}
            />
        </div>
    );
}
