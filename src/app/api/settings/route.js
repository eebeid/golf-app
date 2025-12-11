import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // Get or create default settings
        let settings = await prisma.settings.findUnique({
            where: { id: 'tournament-settings' }
        });

        if (!settings) {
            // Create default settings
            settings = await prisma.settings.create({
                data: {
                    id: 'tournament-settings',
                    numberOfRounds: 3,
                    roundDates: [],
                    roundCourses: [],
                    totalPlayers: 0,
                    showAccommodations: true,
                    showFood: true,
                    showPhotos: false
                }
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const data = await request.json();

        const settings = await prisma.settings.upsert({
            where: { id: 'tournament-settings' },
            update: {
                numberOfRounds: data.numberOfRounds,
                roundDates: data.roundDates,
                roundCourses: data.roundCourses,
                totalPlayers: data.totalPlayers,
                showAccommodations: data.showAccommodations,
                showFood: data.showFood,
                showPhotos: data.showPhotos
            },
            create: {
                id: 'tournament-settings',
                numberOfRounds: data.numberOfRounds,
                roundDates: data.roundDates,
                roundCourses: data.roundCourses,
                totalPlayers: data.totalPlayers,
                showAccommodations: data.showAccommodations,
                showFood: data.showFood,
                showPhotos: data.showPhotos
            }
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}

