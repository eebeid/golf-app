import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getSession, checkTournamentAdmin } from '@/lib/apiAuth';
import { ensureTournamentPPID, normalizePPID, isValidPPID } from '@/lib/ppid';

// Default page visibility for brand-new tournaments.
// Only the 5 core pages are on by default; everything else starts hidden.
const DEFAULT_VISIBILITY = {
    showCourses:        true,
    showPlayers:        true,
    showSchedule:       true,
    showPlay:           true,
    showLeaderboard:    true,
    showAccommodations: false,
    showFood:           false,
    showPhotos:         false,
    showPrizes:         false,
    showChat:           false,
    showStats:          false,
    showScorecards:     false,
};

export async function GET(request) {
    try {
        const session = await getSession();
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('tournamentId');

        let settings = null;
        let ownerId = null;
        let isAdmin = false;
        let isPro = false;
        let hasEventPass = false;
        let canPrint = false;
        let isSetupComplete = true;
        let tournament = null;

        if (slug) {
            tournament = await prisma.tournament.findUnique({
                where: { slug },
                include: { owner: true }
            });

            if (tournament) {
                ownerId = tournament.ownerId;
                // Public Beta: Unlock all Pro features for all users
                isPro = true;
                hasEventPass = true;
                canPrint = true;

                settings = await prisma.settings.findUnique({
                    where: { tournamentId: tournament.id }
                });

                // Admin privilege check using shared helper
                if (session?.user) {
                    const { isAuthorized } = await checkTournamentAdmin(session, tournament);
                    isAdmin = isAuthorized;
                }

                // Setup completeness check (reuse already-fetched tournament.id)
                const [pCount, tCount] = await Promise.all([
                    prisma.player.count({ where: { tournamentId: tournament.id } }),
                    prisma.teeTime.count({ where: { tournamentId: tournament.id } }),
                ]);
                const hasCourses = settings?.roundCourses && settings.roundCourses.length > 0;
                isSetupComplete = pCount > 0 && tCount > 0 && hasCourses;
            }
        }

        if (!settings && !slug) {
            settings = await prisma.settings.findUnique({
                where: { id: 'tournament-settings' }
            });

            // Create default if completely missing (legacy)
            if (!settings) {
                settings = await prisma.settings.create({
                    data: {
                        id: 'tournament-settings',
                        numberOfRounds: 0,
                        roundDates: [],
                        roundCourses: [],
                        roundHandicaps: [],
                        roundTimeConfig: {},
                        totalPlayers: 0,
                        showAccommodations: true,
                        showFood: true,
                        showPhotos: false,
                        tournamentName: 'Golf Tournament',
                        logoUrl: '/images/pinplaced_primary_logo_transparent.png'
                    }
                });
            }
        }

        if (settings) {
            const jsonFields = ['roundDates', 'roundCourses', 'roundHandicaps', 'ryderCupConfig', 'prizes', 'closestToPin', 'longDrive', 'sponsorLogos', 'roundTimeConfig'];
            jsonFields.forEach(key => {
                if (typeof settings[key] === 'string') {
                    try { settings[key] = JSON.parse(settings[key]); } catch(e) {}
                }
            });
        }

        let spotifyUrl = '';
        let maxHandicap = null;
        if (settings?.roundTimeConfig) {
            if (settings.roundTimeConfig.spotifyUrl) spotifyUrl = settings.roundTimeConfig.spotifyUrl;
            if (settings.roundTimeConfig.maxHandicap !== undefined) maxHandicap = settings.roundTimeConfig.maxHandicap;
        }

        let ppid = null;
        if (tournament) {
            ppid = await ensureTournamentPPID(tournament);
        }

        const base = settings ?? DEFAULT_VISIBILITY;
        return NextResponse.json({ ...DEFAULT_VISIBILITY, ...base, ppid, spotifyUrl, maxHandicap, isSetupComplete, ownerId, isAdmin, isPro, hasEventPass, canPrint });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}


export async function POST(request) {
    try {
        const session = await getSession();
        const data = await request.json();
        const slug = data.tournamentId;

        if (!slug) {
            return NextResponse.json({ error: 'Tournament slug is required' }, { status: 400 });
        }

        // Try slug first, then fallback to id (legacy support)
        let tournament = await prisma.tournament.findUnique({
            where: { slug },
            include: { owner: true }
        });
        if (!tournament) {
            tournament = await prisma.tournament.findUnique({
                where: { id: slug },
                include: { owner: true }
            });
        }

        if (!tournament) {
            return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
        }

        // Public Beta: Unlock branding features for all users
        const isPro = true;

        // Verify Admin Privileges using shared helper
        const { isAuthorized } = await checkTournamentAdmin(session, tournament);
        if (!isAuthorized) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch existing settings to safely perform non-destructive updates
        const existingSettings = await prisma.settings.findUnique({
            where: { tournamentId: tournament.id }
        });

        let existingRoundTimeConfig = {};
        if (existingSettings?.roundTimeConfig) {
            if (typeof existingSettings.roundTimeConfig === 'string') {
                try { existingRoundTimeConfig = JSON.parse(existingSettings.roundTimeConfig); } catch(e) {}
            } else if (typeof existingSettings.roundTimeConfig === 'object' && existingSettings.roundTimeConfig !== null) {
                existingRoundTimeConfig = { ...existingSettings.roundTimeConfig };
            }
        }

        const hasRoundTimeConfigChanges = data.roundTimeConfig !== undefined ||
            data.spotifyUrl !== undefined ||
            data.maxHandicap !== undefined ||
            data.events !== undefined;

        let mergedRoundTimeConfig = undefined;
        if (hasRoundTimeConfigChanges) {
            mergedRoundTimeConfig = {
                ...existingRoundTimeConfig,
                ...(data.roundTimeConfig && typeof data.roundTimeConfig === 'object' ? data.roundTimeConfig : {})
            };
            if (data.spotifyUrl !== undefined) mergedRoundTimeConfig.spotifyUrl = data.spotifyUrl;
            if (data.maxHandicap !== undefined) {
                mergedRoundTimeConfig.maxHandicap = (data.maxHandicap !== '' && data.maxHandicap !== null)
                    ? parseInt(data.maxHandicap)
                    : null;
            }
            if (data.events !== undefined) mergedRoundTimeConfig.events = data.events;
        }

        // Build partial update payload — non-destructive, only touches provided fields
        const updateData = {};
        if (data.numberOfRounds !== undefined) updateData.numberOfRounds = parseInt(data.numberOfRounds) || 0;
        if (data.roundDates !== undefined) updateData.roundDates = data.roundDates;
        if (data.roundCourses !== undefined) {
            if (Array.isArray(data.roundCourses)) {
                const dbCourses = await prisma.course.findMany({
                    where: { tournamentId: tournament.id }
                });
                updateData.roundCourses = data.roundCourses.map(ref => {
                    const match = dbCourses.find(c => c.id === ref || (c.name && String(ref).trim().toLowerCase() === c.name.trim().toLowerCase()));
                    return match ? match.id : ref;
                });
            } else {
                updateData.roundCourses = data.roundCourses;
            }
        }
        if (data.roundHandicaps !== undefined) updateData.roundHandicaps = data.roundHandicaps;
        if (data.ryderCupConfig !== undefined) updateData.ryderCupConfig = data.ryderCupConfig;
        if (mergedRoundTimeConfig !== undefined) updateData.roundTimeConfig = mergedRoundTimeConfig;
        if (data.totalPlayers !== undefined) updateData.totalPlayers = parseInt(data.totalPlayers) || 0;

        if (data.showCourses !== undefined) updateData.showCourses = data.showCourses;
        if (data.showPlayers !== undefined) updateData.showPlayers = data.showPlayers;
        if (data.showSchedule !== undefined) updateData.showSchedule = data.showSchedule;
        if (data.showPlay !== undefined) updateData.showPlay = data.showPlay;
        if (data.showLeaderboard !== undefined) updateData.showLeaderboard = data.showLeaderboard;
        if (data.showAccommodations !== undefined) updateData.showAccommodations = data.showAccommodations;
        if (data.showFood !== undefined) updateData.showFood = data.showFood;
        if (data.showPhotos !== undefined) updateData.showPhotos = data.showPhotos;
        if (data.showPrizes !== undefined) updateData.showPrizes = data.showPrizes;
        if (data.showChat !== undefined) updateData.showChat = data.showChat;
        if (data.showStats !== undefined) updateData.showStats = data.showStats;
        if (data.showScorecards !== undefined) updateData.showScorecards = data.showScorecards;

        if (data.tournamentName !== undefined) {
            const trimmedName = typeof data.tournamentName === 'string' ? data.tournamentName.trim() : data.tournamentName;
            updateData.tournamentName = trimmedName;

            // Keep Tournament.name in sync with Settings.tournamentName
            if (trimmedName && tournament.name !== trimmedName) {
                await prisma.tournament.update({
                    where: { id: tournament.id },
                    data: { name: trimmedName }
                });
            }
        }

        if (data.ppid !== undefined) {
            const normalizedPpid = normalizePPID(data.ppid);
            if (!isValidPPID(normalizedPpid)) {
                return NextResponse.json({ error: 'PPID must be 3 to 16 letters/numbers (e.g. PEBBLE26).' }, { status: 400 });
            }
            const existing = await prisma.tournament.findUnique({
                where: { ppid: normalizedPpid }
            });
            if (existing && existing.id !== tournament.id) {
                return NextResponse.json({ error: `PPID "${normalizedPpid}" is already in use. Please pick another code.` }, { status: 400 });
            }
            await prisma.tournament.update({
                where: { id: tournament.id },
                data: { ppid: normalizedPpid }
            });
            tournament.ppid = normalizedPpid;
        }
        if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
        if (data.prizesTitle !== undefined) updateData.prizesTitle = data.prizesTitle;
        if (data.prizes !== undefined) updateData.prizes = data.prizes;
        if (data.venmo !== undefined) updateData.venmo = data.venmo;
        if (data.paypal !== undefined) updateData.paypal = data.paypal;
        if (data.zelle !== undefined) updateData.zelle = data.zelle;
        if (data.closestToPin !== undefined) updateData.closestToPin = data.closestToPin;
        if (data.longDrive !== undefined) updateData.longDrive = data.longDrive;
        if (data.allowPlayerEdits !== undefined) updateData.allowPlayerEdits = data.allowPlayerEdits;
        if (data.publicScoring !== undefined) updateData.publicScoring = data.publicScoring;
        if (data.timezone !== undefined) updateData.timezone = data.timezone;
        if (data.backgroundColor !== undefined) updateData.backgroundColor = data.backgroundColor;
        if (data.sponsorLogos !== undefined) updateData.sponsorLogos = data.sponsorLogos;

        // Build create fallback payload if record doesn't exist yet
        const createData = {
            id: `set-${tournament.id.slice(0, 24)}`,
            tournamentId: tournament.id,
            numberOfRounds: data.numberOfRounds !== undefined ? (parseInt(data.numberOfRounds) || 0) : 0,
            roundDates: data.roundDates ?? [],
            roundCourses: data.roundCourses ?? [],
            roundHandicaps: data.roundHandicaps ?? [],
            ryderCupConfig: data.ryderCupConfig ?? { enabled: false, team1: [], team2: [] },
            roundTimeConfig: mergedRoundTimeConfig ?? {},
            totalPlayers: data.totalPlayers !== undefined ? (parseInt(data.totalPlayers) || 0) : 0,
            ...DEFAULT_VISIBILITY,
            tournamentName: data.tournamentName ?? 'Golf Tournament',
            logoUrl: data.logoUrl ?? '/images/pinplaced_primary_logo_transparent.png',
            prizesTitle: data.prizesTitle ?? 'Tournament Prizes',
            prizes: data.prizes ?? [],
            venmo: data.venmo ?? null,
            paypal: data.paypal ?? null,
            zelle: data.zelle ?? null,
            closestToPin: data.closestToPin ?? [],
            longDrive: data.longDrive ?? [],
            allowPlayerEdits: data.allowPlayerEdits ?? false,
            publicScoring: data.publicScoring ?? false,
            timezone: data.timezone ?? 'America/New_York',
            backgroundColor: data.backgroundColor ?? '#0a1a0f',
            sponsorLogos: data.sponsorLogos ?? [],
            ...updateData,
        };

        const settings = await prisma.settings.upsert({
            where: { tournamentId: tournament.id },
            update: updateData,
            create: createData,
        });

        if (settings) {
            const jsonFields = ['roundDates', 'roundCourses', 'roundHandicaps', 'ryderCupConfig', 'prizes', 'closestToPin', 'longDrive', 'sponsorLogos', 'roundTimeConfig'];
            jsonFields.forEach(key => {
                if (typeof settings[key] === 'string') {
                    try { settings[key] = JSON.parse(settings[key]); } catch(e) {}
                }
            });
        }

        try {
            revalidatePath(`/t/${tournament.slug}`);
            revalidatePath(`/t/${tournament.slug}/courses`);
            revalidatePath(`/t/${tournament.slug}/schedule`);
            if (tournament.id !== tournament.slug) {
                revalidatePath(`/t/${tournament.id}`);
                revalidatePath(`/t/${tournament.id}/courses`);
                revalidatePath(`/t/${tournament.id}/schedule`);
            }
            revalidatePath('/');
        } catch (e) {
            console.warn('Revalidation warning:', e);
        }

        return NextResponse.json({ ...settings, ppid: tournament.ppid });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}

