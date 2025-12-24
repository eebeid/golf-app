
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const teeTimes = await prisma.teeTime.findMany({
            orderBy: { time: 'asc' }
        });
        return NextResponse.json(teeTimes);
    } catch (error) {
        console.error('Error fetching schedule:', error);
        return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const data = await request.json();
        const { round, groups } = data; // groups is array of { time, players: [] }

        // Transaction to clear old times for this round and add new ones
        await prisma.$transaction(async (tx) => {
            // Delete existing for this round
            await tx.teeTime.deleteMany({
                where: { round: parseInt(round) }
            });

            // Create new ones
            for (const group of groups) {
                await tx.teeTime.create({
                    data: {
                        round: parseInt(round),
                        time: group.time,
                        players: group.players
                    }
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving schedule:', error);
        return NextResponse.json({ error: 'Failed to save schedule' }, { status: 500 });
    }
}
