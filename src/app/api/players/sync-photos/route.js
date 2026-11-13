import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession, checkTournamentAdmin, unauthorized, forbidden } from '@/lib/apiAuth';
import { isSuperAdmin } from '@/lib/admin';

const normalize = (str) => (str || '').toLowerCase().replace(/\s+/g, ' ').trim();
const cleanName = (str) => normalize(str).replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();

export async function POST(request) {
    try {
        const session = await getSession();
        if (!session?.user) return unauthorized();

        const body = await request.json().catch(() => ({}));
        const { tournamentId, overwrite = false } = body;

        if (!tournamentId) {
            return NextResponse.json({ error: "Tournament ID or slug is required" }, { status: 400 });
        }

        // 1. Resolve target tournament
        let tournament = await prisma.tournament.findUnique({
            where: { slug: tournamentId },
            include: { owner: true }
        });
        if (!tournament) {
            tournament = await prisma.tournament.findUnique({
                where: { id: tournamentId },
                include: { owner: true }
            });
        }

        if (!tournament) {
            return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
        }

        // 2. Authorization check
        const { isAuthorized } = await checkTournamentAdmin(session, tournament);
        if (!isAuthorized) return forbidden();

        // 3. Find candidate past tournaments
        const isSuper = session.user.email ? isSuperAdmin(session.user.email) : false;
        const candidateTournaments = await prisma.tournament.findMany({
            where: isSuper
                ? { id: { not: tournament.id } }
                : {
                    id: { not: tournament.id },
                    OR: [
                        ...(tournament.ownerId ? [{ ownerId: tournament.ownerId }] : []),
                        ...(session.user.id ? [{ ownerId: session.user.id }] : [])
                    ]
                },
            select: { id: true, name: true, createdAt: true },
            orderBy: { createdAt: 'desc' }
        });

        if (candidateTournaments.length === 0) {
            return NextResponse.json({
                success: true,
                updatedCount: 0,
                message: "No other past tournaments found to import photos from."
            });
        }

        const candidateTournamentIds = candidateTournaments.map(t => t.id);

        // 4. Fetch past players with photos
        const pastPlayersWithPhotos = await prisma.player.findMany({
            where: {
                tournamentId: { in: candidateTournamentIds },
                imageUrl: { not: null }
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                imageUrl: true,
                tournamentId: true,
                tournament: { select: { name: true, createdAt: true } }
            },
            orderBy: { tournament: { createdAt: 'desc' } }
        });

        if (pastPlayersWithPhotos.length === 0) {
            return NextResponse.json({
                success: true,
                updatedCount: 0,
                message: "No players with photos found in any past tournaments."
            });
        }

        // 5. Fetch current tournament players
        const currentPlayers = await prisma.player.findMany({
            where: { tournamentId: tournament.id }
        });

        const updatedPlayers = [];

        // 6. Match and update
        for (const player of currentPlayers) {
            if (player.imageUrl && !overwrite) {
                continue; // Already has an image and overwrite is not requested
            }

            let match = null;

            // Strategy 1: Match by normalized email (if provided on both)
            if (player.email && player.email.trim()) {
                const normEmail = normalize(player.email);
                match = pastPlayersWithPhotos.find(p => p.email && normalize(p.email) === normEmail);
            }

            // Strategy 2: Match by exact normalized name
            if (!match && player.name && player.name.trim()) {
                const normName = normalize(player.name);
                match = pastPlayersWithPhotos.find(p => normalize(p.name) === normName);
            }

            // Strategy 3: Match by clean name (ignoring nicknames in parentheses)
            if (!match && player.name && player.name.trim()) {
                const cleaned = cleanName(player.name);
                if (cleaned.length > 2) {
                    match = pastPlayersWithPhotos.find(p => cleanName(p.name) === cleaned);
                }
            }

            if (match && match.imageUrl) {
                const updateData = { imageUrl: match.imageUrl };
                // Also copy phone if currently missing
                if (!player.phone && match.phone) {
                    updateData.phone = match.phone;
                }

                await prisma.player.update({
                    where: { id: player.id },
                    data: updateData
                });

                updatedPlayers.push({
                    name: player.name,
                    matchedName: match.name,
                    tournament: match.tournament?.name || 'Past Tournament',
                    imageUrl: match.imageUrl
                });
            }
        }

        return NextResponse.json({
            success: true,
            updatedCount: updatedPlayers.length,
            updatedPlayers,
            totalCurrentPlayers: currentPlayers.length,
            message: `Successfully loaded photos for ${updatedPlayers.length} player(s) from past tournaments!`
        });

    } catch (error) {
        console.error("Error syncing player photos:", error);
        return NextResponse.json({ error: "Failed to sync player photos" }, { status: 500 });
    }
}
