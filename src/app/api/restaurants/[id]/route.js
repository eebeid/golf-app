
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

    const { tournamentId, lat, lng, ...rest } = body;
    const updateData = {
        ...rest,
        lat: lat === '' || lat === null ? null : (lat !== undefined ? parseFloat(lat) : undefined),
        lng: lng === '' || lng === null ? null : (lng !== undefined ? parseFloat(lng) : undefined),
    };

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
