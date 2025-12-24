import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getData } from '@/lib/data';

export async function POST(request) {
    try {
        const { name } = await request.json();

        if (!name) {
            return NextResponse.json({ error: 'Trip name is required' }, { status: 400 });
        }

        // 1. Gather all data
        const players = await prisma.player.findMany({
            include: { scores: true },
            orderBy: { registeredAt: 'desc' }
        });

        const settings = await prisma.settings.findUnique({
            where: { id: 'tournament-settings' }
        });

        // Courses are stored in JSON file, accessed via lib/data helper
        const courses = await getData('courses');

        // 2. Create Snapshot Object
        const snapshotData = {
            players,
            settings,
            courses,
            savedAt: new Date().toISOString()
        };

        // 3. Save to HistoricalTrip
        const history = await prisma.historicalTrip.create({
            data: {
                name,
                data: snapshotData
            }
        });

        return NextResponse.json({ success: true, id: history.id });

    } catch (error) {
        console.error('Error saving history:', error);
        return NextResponse.json({ error: 'Failed to save history' }, { status: 500 });
    }
}
