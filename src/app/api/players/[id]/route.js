import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request, { params }) {
    const { id } = await params;
    try {
        await prisma.player.delete({ where: { id: String(id) } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete player" }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const { id } = await params;
    const { name, email, phone, ghin, handicapIndex, hcpRiver, hcpPlantation, hcpRNK, courseData, isManager, roomNumber, houseNumber, imageUrl } = await request.json();

    try {
        const player = await prisma.player.update({
            where: { id },
            data: {
                name,
                email,
                phone,
                ghin,
                handicapIndex,
                hcpRiver,
                hcpPlantation,
                hcpRNK,
                roomNumber,
                houseNumber,
                imageUrl,
                isManager: isManager ?? undefined,
                ...(courseData !== undefined && { courseData })
            }
        });
        return NextResponse.json(player);
    } catch (e) {
        console.error("PRISMA UPDATE ERROR: ", e);
        return NextResponse.json({ error: "Failed to update", details: e.message }, { status: 500 });
    }
}
