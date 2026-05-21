import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { messageId, emoji } = body;

        if (!messageId || !emoji) {
            return NextResponse.json({ error: 'messageId and emoji are required' }, { status: 400 });
        }

        const message = await prisma.message.findUnique({
            where: { id: messageId },
            include: { user: true }
        });

        if (!message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        let parsed = { text: message.text, imageUrl: null, reactions: {} };
        try {
            const data = JSON.parse(message.text);
            if (data && typeof data === 'object') {
                parsed = {
                    text: data.text || '',
                    imageUrl: data.imageUrl || null,
                    reactions: data.reactions || {}
                };
            }
        } catch (e) {
            // Not JSON, text is the raw text
            parsed.text = message.text;
        }

        const userEmail = session.user.email;
        if (!parsed.reactions) {
            parsed.reactions = {};
        }
        if (!parsed.reactions[emoji]) {
            parsed.reactions[emoji] = [];
        }

        if (parsed.reactions[emoji].includes(userEmail)) {
            // Remove reaction
            parsed.reactions[emoji] = parsed.reactions[emoji].filter(email => email !== userEmail);
            if (parsed.reactions[emoji].length === 0) {
                delete parsed.reactions[emoji];
            }
        } else {
            // Add reaction
            parsed.reactions[emoji].push(userEmail);
        }

        const updatedMessage = await prisma.message.update({
            where: { id: messageId },
            data: {
                text: JSON.stringify(parsed)
            },
            include: { user: true }
        });

        return NextResponse.json(updatedMessage);
    } catch (error) {
        console.error('Error reacting to message:', error);
        return NextResponse.json({ error: 'Failed to react to message' }, { status: 500 });
    }
}
