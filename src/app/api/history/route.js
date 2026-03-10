import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const archives = await prisma.historicalTrip.findMany({
            orderBy: { date: 'desc' }
        });
        return NextResponse.json(archives);
    } catch (error) {
        console.error('Error fetching history:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { name, tournamentId } = await request.json();

        if (!name) {
            return NextResponse.json({ error: 'Trip name is required' }, { status: 400 });
        }

        if (!tournamentId) {
            return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
        }

        // 1. Gather ALL data for this specific tournament
        // We try both slug and ID because tournamentId might be either depending on context
        const tournament = await prisma.tournament.findFirst({
            where: {
                OR: [
                    { slug: tournamentId },
                    { id: tournamentId }
                ]
            },
            include: {
                settings: true,
                players: {
                    include: {
                        scores: true
                    }
                },
                courses: true,
                lodging: {
                    include: {
                        players: true
                    }
                },
                restaurants: true,
                photos: true,
                scorecards: true,
                teeTimes: true,
                messages: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                                image: true
                            }
                        }
                    }
                }
            }
        });

        if (!tournament) {
            return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
        }

        // 2. Create Snapshot Object
        const snapshotData = {
            ...tournament,
            savedAt: new Date().toISOString(),
            archiveVersion: '2.5'
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
        return NextResponse.json({ error: 'Failed to save history: ' + error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await prisma.historicalTrip.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting archive:', error);
        return NextResponse.json({ error: 'Failed to delete archive' }, { status: 500 });
    }
}
