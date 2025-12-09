import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request, { params }) {
    const id = params.id;
    try {
        await prisma.player.delete({ where: { id: String(id) } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete player" }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const id = params.id;
    const body = await request.json();

    try {
        const updated = await prisma.player.update({
            where: { id: String(id) },
            data: {
                name: body.name,
                handicap: body.handicap !== undefined ? parseInt(body.handicap) : undefined
            }
        });
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update player" }, { status: 500 });
    }
}
