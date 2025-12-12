import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const messages = await prisma.message.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        // Reverse to show oldest first in chat, or keep desc if UI handles it.
        // Usually chat shows oldest at top if scrolling down, or newest at bottom.
        // Let's return them in chronological order for the UI to map easily.
        return NextResponse.json(messages.reverse());
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { sender, text } = body;

        if (!sender || !text) {
            return NextResponse.json({ error: 'Sender and text are required' }, { status: 400 });
        }

        const message = await prisma.message.create({
            data: {
                sender,
                text
            }
        });

        return NextResponse.json(message);
    } catch (error) {
        console.error('Error creating message:', error);
        return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }
}
