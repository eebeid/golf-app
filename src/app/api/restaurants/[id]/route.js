
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request, { params }) {
    const { id } = params;
    try {
        await prisma.restaurant.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Failed to delete restaurant" }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const { id } = params;
    const body = await request.json();

    // Remove tournamentId from update data since it contains the slug (from frontend) 
    // and we shouldn't be moving restaurants between tournaments anyway.
    const { tournamentId, ...updateData } = body;

    try {
        const updated = await prisma.restaurant.update({
            where: { id },
            data: updateData
        });
        return NextResponse.json(updated);
    } catch (e) {
        return NextResponse.json({ error: "Failed to update restaurant" }, { status: 500 });
    }
}
