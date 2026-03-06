import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const tournamentId = searchParams.get('tournamentId');

        if (!tournamentId) {
            return NextResponse.json({ error: 'tournamentId is required' }, { status: 400 });
        }

        const messages = await prisma.message.findMany({
            where: { tournamentId },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: { user: true }
        });
        return NextResponse.json(messages.reverse());
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { text, tournamentId } = body;

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        if (!tournamentId) {
            return NextResponse.json({ error: 'tournamentId is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const message = await prisma.message.create({
            data: {
                text,
                userId: user.id,
                tournamentId
            },
            include: { user: true }
        });

        return NextResponse.json(message);
    } catch (error) {
        console.error('Error creating message:', error);
        return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const tournamentId = searchParams.get('tournamentId');

        if (tournamentId) {
            await prisma.message.deleteMany({ where: { tournamentId } });
        } else {
            // Clear ALL messages (admin use)
            await prisma.message.deleteMany({});
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting messages:', error);
        return NextResponse.json({ error: 'Failed to delete messages' }, { status: 500 });
    }
}
