import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('tournamentId');

        let settings = null;

        if (slug) {
            // Find tournament by slug
            const tournament = await prisma.tournament.findUnique({ where: { slug } });
            if (tournament) {
                settings = await prisma.settings.findUnique({
                    where: { tournamentId: tournament.id }
                });
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
                        roundTimeConfig: {},
                        totalPlayers: 0,
                        showAccommodations: true,
                        showFood: true,
                        showPhotos: false,
                        tournamentName: 'Golf Tournament',
                        logoUrl: null
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
        if (settings && settings.roundTimeConfig && settings.roundTimeConfig.spotifyUrl) {
            spotifyUrl = settings.roundTimeConfig.spotifyUrl;
        }

        return NextResponse.json({ ...(settings || {}), spotifyUrl, isSetupComplete });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}


export async function POST(request) {
    try {
        const data = await request.json();
        // Check for tournamentId (slug) in the body
        const slug = data.tournamentId;

        let whereClause = { id: 'tournament-settings' };
        let roundTimeConfigWithSpotify = typeof data.roundTimeConfig === 'object' && data.roundTimeConfig !== null ? { ...data.roundTimeConfig } : {};
        if (data.spotifyUrl !== undefined) {
            roundTimeConfigWithSpotify.spotifyUrl = data.spotifyUrl;
        }

        let createData = {
            id: 'tournament-settings',
            numberOfRounds: data.numberOfRounds,
            roundDates: data.roundDates,
            roundCourses: data.roundCourses,
            roundTimeConfig: roundTimeConfigWithSpotify,
            totalPlayers: data.totalPlayers,
            showAccommodations: data.showAccommodations,
            showFood: data.showFood,
            showPhotos: data.showPhotos,
            tournamentName: data.tournamentName,
            logoUrl: data.logoUrl,
            prizesTitle: data.prizesTitle,
            prizes: data.prizes,
            venmo: data.venmo,
            paypal: data.paypal,
            zelle: data.zelle
        };

        if (slug) {
            const tournament = await prisma.tournament.findUnique({ where: { slug } });
            if (tournament) {
                // If tournament exists, we upsert based on the unique tournamentId relation
                whereClause = { tournamentId: tournament.id };
                createData = {
                    ...createData,
                    id: `settings-${tournament.id}`, // Unique ID for this tournament's settings
                    tournamentId: tournament.id
                };
            }
        }

        const settings = await prisma.settings.upsert({
            where: whereClause,
            update: {
                numberOfRounds: data.numberOfRounds,
                roundDates: data.roundDates,
                roundCourses: data.roundCourses,
                roundTimeConfig: roundTimeConfigWithSpotify,
                totalPlayers: data.totalPlayers,
                showAccommodations: data.showAccommodations,
                showFood: data.showFood,
                showPhotos: data.showPhotos,
                tournamentName: data.tournamentName,
                logoUrl: data.logoUrl,
                prizesTitle: data.prizesTitle,
                prizes: data.prizes,
                venmo: data.venmo,
                paypal: data.paypal,
                zelle: data.zelle
            },
            create: createData
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}

