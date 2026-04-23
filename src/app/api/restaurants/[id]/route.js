
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function DELETE(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    try {
        // Explicitly delete related signups first (in case cascade isn't applied in DB yet)
        try {
            await prisma.dinnerSignup.deleteMany({ where: { restaurantId: id } });
        } catch (signupErr) {
            // Table may not exist yet — safe to ignore and continue
            console.warn('Could not delete signups (table may not exist yet):', signupErr.message);
        }

        await prisma.restaurant.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Restaurant DELETE error:', e);
        return NextResponse.json({ error: 'Failed to delete restaurant', details: e.message }, { status: 500 });
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
        console.error('Restaurant PUT error:', e);
        return NextResponse.json({ error: 'Failed to update restaurant', details: e.message }, { status: 500 });
    }
}
