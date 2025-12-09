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
    const { name, handicapIndex, hcpRiver, hcpPlantation, hcpRNK } = await request.json();

    try {
        const player = await prisma.player.update({
            where: { id },
            data: {
                name,
                handicapIndex,
                hcpRiver,
                hcpPlantation,
                hcpRNK
            }
        });
        return NextResponse.json(player);
    } catch (e) {
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
