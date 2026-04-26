import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isSuperAdmin } from "@/lib/admin";

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
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('tournamentId');

        let settings = null;
        let ownerId = null;
        let isAdmin = false;

        if (slug) {
            // Find tournament by slug
            const tournament = await prisma.tournament.findUnique({ where: { slug } });
            if (tournament) {
                ownerId = tournament.ownerId;
                settings = await prisma.settings.findUnique({
                    where: { tournamentId: tournament.id }
                });

                // Check Admin Privileges
                if (session?.user) {
                    // 1. Check Owner
                    if (session.user.id === tournament.ownerId) {
                        isAdmin = true;
                    }

                    // 2. Check Global Admin
                    if (session.user.email && isSuperAdmin(session.user.email)) {
                        isAdmin = true;
                    }

                    // 3. Check Tournament Managers (Player list)
                    if (!isAdmin && session.user.email) {
                        const playerManager = await prisma.player.findFirst({
                            where: {
                                tournamentId: tournament.id,
                                email: session.user.email,
                                isManager: true
                            }
                        });
                        if (playerManager) {
                            isAdmin = true;
                        }
                    }
                }
            }
        }

        // Fallback or legacy global settings
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

        let isSetupComplete = true;
        if (slug) {
            const t = await prisma.tournament.findUnique({ where: { slug } });
            if (t) {
                const pCount = await prisma.player.count({ where: { tournamentId: t.id } });
                const tCount = await prisma.teeTime.count({ where: { tournamentId: t.id } });
                const hasCourses = settings?.roundCourses && settings.roundCourses.length > 0;
                isSetupComplete = pCount > 0 && tCount > 0 && hasCourses;
            }
        }

        let spotifyUrl = '';
        let maxHandicap = null;
        if (settings && settings.roundTimeConfig) {
            if (settings.roundTimeConfig.spotifyUrl) spotifyUrl = settings.roundTimeConfig.spotifyUrl;
            if (settings.roundTimeConfig.maxHandicap !== undefined) maxHandicap = settings.roundTimeConfig.maxHandicap;
        }

        // When no settings row exists yet, surface the defaults so the nav renders correctly
        const base = settings ? settings : DEFAULT_VISIBILITY;
        return NextResponse.json({ ...DEFAULT_VISIBILITY, ...base, spotifyUrl, maxHandicap, isSetupComplete, ownerId, isAdmin });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}


export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        const data = await request.json();
        const slug = data.tournamentId;

        if (!slug) {
            return NextResponse.json({ error: 'Tournament slug is required' }, { status: 400 });
        }

        let tournament = await prisma.tournament.findUnique({ where: { slug } });
        if (!tournament) {
            tournament = await prisma.tournament.findUnique({ where: { id: slug } });
        }

        if (!tournament) {
            return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
        }

        // Verify Admin Privileges
        let isAdmin = false;
        if (session?.user) {
            if (session.user.id === tournament.ownerId) isAdmin = true;
            if (session.user.email && isSuperAdmin(session.user.email)) isAdmin = true;

            if (!isAdmin && session.user.email) {
                const playerManager = await prisma.player.findFirst({
                    where: { tournamentId: tournament.id, email: session.user.email, isManager: true }
                });
                if (playerManager) isAdmin = true;
            }
        }

        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        let whereClause = { tournamentId: tournament.id };
        let roundTimeConfigWithSpotify = typeof data.roundTimeConfig === 'object' && data.roundTimeConfig !== null ? { ...data.roundTimeConfig } : {};
        if (data.spotifyUrl !== undefined) {
            roundTimeConfigWithSpotify.spotifyUrl = data.spotifyUrl;
        }
        if (data.maxHandicap !== undefined) {
            roundTimeConfigWithSpotify.maxHandicap = data.maxHandicap !== '' && data.maxHandicap !== null ? parseInt(data.maxHandicap) : null;
        }

        const createData = {
            id: `set-${tournament.id.slice(0, 24)}`,
            tournamentId: tournament.id,
            numberOfRounds: parseInt(data.numberOfRounds) || 0,
            roundDates: data.roundDates || [],
            roundCourses: data.roundCourses || [],
            roundHandicaps: data.roundHandicaps || [],
            ryderCupConfig: data.ryderCupConfig ?? { enabled: false, team1: [], team2: [] },
            roundTimeConfig: roundTimeConfigWithSpotify,
            totalPlayers: parseInt(data.totalPlayers) || 0,
            // Start from canonical defaults, then override with anything explicitly sent by caller
            ...DEFAULT_VISIBILITY,
            ...(data.showCourses        !== undefined && { showCourses:        data.showCourses }),
            ...(data.showPlayers        !== undefined && { showPlayers:        data.showPlayers }),
            ...(data.showSchedule       !== undefined && { showSchedule:       data.showSchedule }),
            ...(data.showPlay           !== undefined && { showPlay:           data.showPlay }),
            ...(data.showLeaderboard    !== undefined && { showLeaderboard:    data.showLeaderboard }),
            ...(data.showAccommodations !== undefined && { showAccommodations: data.showAccommodations }),
            ...(data.showFood           !== undefined && { showFood:           data.showFood }),
            ...(data.showPhotos         !== undefined && { showPhotos:         data.showPhotos }),
            ...(data.showPrizes         !== undefined && { showPrizes:         data.showPrizes }),
            ...(data.showChat           !== undefined && { showChat:           data.showChat }),
            ...(data.showStats          !== undefined && { showStats:          data.showStats }),
            ...(data.showScorecards     !== undefined && { showScorecards:     data.showScorecards }),
            tournamentName: data.tournamentName,
            logoUrl: data.logoUrl,
            prizesTitle: data.prizesTitle,
            prizes: data.prizes,
            venmo: data.venmo,
            paypal: data.paypal,
            zelle: data.zelle,
            closestToPin: data.closestToPin ?? [],
            longDrive: data.longDrive ?? [],
            allowPlayerEdits: data.allowPlayerEdits ?? false,
            timezone: data.timezone ?? "America/New_York",
            backgroundColor: data.backgroundColor ?? "#0a1a0f"
        };

        const settings = await prisma.settings.upsert({
            where: whereClause,
            update: {
                numberOfRounds: data.numberOfRounds !== undefined ? (parseInt(data.numberOfRounds) || 0) : undefined,
                roundDates: data.roundDates !== undefined ? data.roundDates : undefined,
                roundCourses: data.roundCourses !== undefined ? data.roundCourses : undefined,
                roundHandicaps: data.roundHandicaps !== undefined ? data.roundHandicaps : undefined,
                ryderCupConfig: data.ryderCupConfig !== undefined ? data.ryderCupConfig : undefined,
                roundTimeConfig: data.roundTimeConfig !== undefined ? roundTimeConfigWithSpotify : undefined,
                totalPlayers: data.totalPlayers !== undefined ? (parseInt(data.totalPlayers) || 0) : undefined,
                showAccommodations: data.showAccommodations !== undefined ? data.showAccommodations : undefined,
                showFood: data.showFood !== undefined ? data.showFood : undefined,
                showPhotos: data.showPhotos !== undefined ? data.showPhotos : undefined,
                showCourses: data.showCourses !== undefined ? data.showCourses : undefined,
                showPlayers: data.showPlayers !== undefined ? data.showPlayers : undefined,
                showSchedule: data.showSchedule !== undefined ? data.showSchedule : undefined,
                showLeaderboard: data.showLeaderboard !== undefined ? data.showLeaderboard : undefined,
                showPrizes: data.showPrizes !== undefined ? data.showPrizes : undefined,
                showChat: data.showChat !== undefined ? data.showChat : undefined,
                showPlay: data.showPlay !== undefined ? data.showPlay : undefined,
                showStats: data.showStats !== undefined ? data.showStats : undefined,
                showScorecards: data.showScorecards !== undefined ? data.showScorecards : undefined,
                tournamentName: data.tournamentName !== undefined ? data.tournamentName : undefined,
                logoUrl: data.logoUrl !== undefined ? data.logoUrl : undefined,
                prizesTitle: data.prizesTitle !== undefined ? data.prizesTitle : undefined,
                prizes: data.prizes !== undefined ? data.prizes : undefined,
                venmo: data.venmo !== undefined ? data.venmo : undefined,
                paypal: data.paypal !== undefined ? data.paypal : undefined,
                zelle: data.zelle !== undefined ? data.zelle : undefined,
                closestToPin: data.closestToPin !== undefined ? data.closestToPin : undefined,
                longDrive: data.longDrive !== undefined ? data.longDrive : undefined,
                allowPlayerEdits: data.allowPlayerEdits !== undefined ? data.allowPlayerEdits : undefined,
                timezone: data.timezone !== undefined ? data.timezone : undefined,
                backgroundColor: data.backgroundColor !== undefined ? data.backgroundColor : undefined
            },
            create: createData
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}

