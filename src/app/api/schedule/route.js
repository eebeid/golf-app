
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    // If no tournament specified, return empty to be safe
    if (!tournamentId) return NextResponse.json([]);

    try {
        const teeTimes = await prisma.teeTime.findMany({
            where: {
                tournament: {
                    slug: tournamentId
                }
            },
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
        const { round, groups, tournamentId } = data; // groups is array of { time, players: [] }

        if (!tournamentId) {
            return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
        }

        const tournament = await prisma.tournament.findUnique({ where: { slug: tournamentId } });
        if (!tournament) {
            return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
        }

        // Transaction to clear old times for this round and add new ones
        await prisma.$transaction(async (tx) => {
            // Delete existing for this round AND tournament
            await tx.teeTime.deleteMany({
                where: {
                    round: parseInt(round),
                    tournamentId: tournament.id
                }
            });

            // Create new ones
            for (const group of groups) {
                await tx.teeTime.create({
                    data: {
                        round: parseInt(round),
                        time: group.time,
                        players: group.players,
                        tournamentId: tournament.id
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
