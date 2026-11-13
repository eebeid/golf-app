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
        const { 
            tournamentId, 
            syncPhotos = true, 
            syncGhin = false, 
            overwrite = false 
        } = body;

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
                photosUpdated: 0,
                ghinUpdated: 0,
                message: "No other past tournaments found to import data from."
            });
        }

        const candidateTournamentIds = candidateTournaments.map(t => t.id);

        // 4. Fetch past players matching the sync criteria
        const orConditions = [];
        if (syncPhotos) {
            orConditions.push({ imageUrl: { not: null } });
        }
        if (syncGhin) {
            orConditions.push({ ghin: { not: null, not: "" } });
        }

        if (orConditions.length === 0) {
            return NextResponse.json({
                error: "At least one sync option (syncPhotos or syncGhin) must be enabled"
            }, { status: 400 });
        }

        const pastPlayers = await prisma.player.findMany({
            where: {
                tournamentId: { in: candidateTournamentIds },
                OR: orConditions
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                imageUrl: true,
                ghin: true,
                handicapIndex: true,
                tournamentId: true,
                tournament: { select: { name: true, createdAt: true } }
            },
            orderBy: { tournament: { createdAt: 'desc' } }
        });

        if (pastPlayers.length === 0) {
            return NextResponse.json({
                success: true,
                updatedCount: 0,
                photosUpdated: 0,
                ghinUpdated: 0,
                message: "No matching player records found in past tournaments."
            });
        }

        // 5. Fetch current tournament players
        const currentPlayers = await prisma.player.findMany({
            where: { tournamentId: tournament.id }
        });

        let photosUpdated = 0;
        let ghinUpdated = 0;
        const updatedPlayers = [];

        // 6. Match and update
        for (const player of currentPlayers) {
            const needsPhoto = syncPhotos && (!player.imageUrl || overwrite);
            const needsGhin = syncGhin && (!player.ghin || overwrite);

            if (!needsPhoto && !needsGhin) {
                continue;
            }

            let match = null;

            // Strategy 1: Match by normalized email (if provided on both)
            if (player.email && player.email.trim()) {
                const normEmail = normalize(player.email);
                match = pastPlayers.find(p => p.email && normalize(p.email) === normEmail);
            }

            // Strategy 2: Match by exact normalized name
            if (!match && player.name && player.name.trim()) {
                const normName = normalize(player.name);
                match = pastPlayers.find(p => normalize(p.name) === normName);
            }

            // Strategy 3: Match by clean name (ignoring nicknames in parentheses)
            if (!match && player.name && player.name.trim()) {
                const cleaned = cleanName(player.name);
                if (cleaned.length > 2) {
                    match = pastPlayers.find(p => cleanName(p.name) === cleaned);
                }
            }

            if (!match) continue;

            const updateData = {};
            let didUpdatePhoto = false;
            let didUpdateGhin = false;

            if (needsPhoto && match.imageUrl) {
                updateData.imageUrl = match.imageUrl;
                didUpdatePhoto = true;
            }

            if (needsGhin && match.ghin && match.ghin.trim()) {
                updateData.ghin = match.ghin.trim();
                didUpdateGhin = true;
            }

            // Also copy phone if currently missing
            if (!player.phone && match.phone) {
                updateData.phone = match.phone;
            }

            if (Object.keys(updateData).length > 0) {
                await prisma.player.update({
                    where: { id: player.id },
                    data: updateData
                });

                if (didUpdatePhoto) photosUpdated++;
                if (didUpdateGhin) ghinUpdated++;

                updatedPlayers.push({
                    id: player.id,
                    name: player.name,
                    imageUrl: updateData.imageUrl || player.imageUrl,
                    ghin: updateData.ghin || player.ghin,
                    sourceTournament: match.tournament?.name || 'Past Tournament'
                });
            }
        }

        const messages = [];
        if (photosUpdated > 0) messages.push(`${photosUpdated} photo(s)`);
        if (ghinUpdated > 0) messages.push(`${ghinUpdated} GHIN #`);
        const summary = messages.length > 0
            ? `Successfully imported ${messages.join(' and ')} from past tournaments.`
            : 'No new player updates found.';

        return NextResponse.json({
            success: true,
            updatedCount: updatedPlayers.length,
            photosUpdated,
            ghinUpdated,
            message: summary,
            updatedPlayers
        });

    } catch (error) {
        console.error("Past Player Sync Error:", error);
        return NextResponse.json({ 
            error: "Failed to sync player data from past tournaments", 
            details: error.message 
        }, { status: 500 });
    }
}
