
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request, { params }) {
    const { id } = params;
    try {
        await prisma.lodging.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Failed to delete lodging" }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const { id } = params;
    const body = await request.json();
    const { playerIds, ...lodgingData } = body;

    try {
        // If playerIds is provided, sync the player assignments
        if (Array.isArray(playerIds)) {
            await prisma.lodgingPlayer.deleteMany({ where: { lodgingId: id } });
            if (playerIds.length > 0) {
                await prisma.lodgingPlayer.createMany({
                    data: playerIds.map(playerId => ({ lodgingId: id, playerId })),
                    skipDuplicates: true
                });
            }
        }

        // Also update any lodging fields if provided
        const updateFields = {};
        const allowed = ['name', 'address', 'unitNumber', 'url', 'notes', 'checkIn', 'checkOut', 'image'];
        for (const key of allowed) {
            if (key in lodgingData) updateFields[key] = lodgingData[key];
        }

        const updated = await prisma.lodging.update({
            where: { id },
            data: Object.keys(updateFields).length ? updateFields : {},
            include: {
                players: {
                    include: { player: { select: { id: true, name: true } } }
                }
            }
        });
        return NextResponse.json(updated);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to update lodging" }, { status: 500 });
    }
}
