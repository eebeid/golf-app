
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
    try {
        const updated = await prisma.lodging.update({
            where: { id },
            data: body
        });
        return NextResponse.json(updated);
    } catch (e) {
        return NextResponse.json({ error: "Failed to update lodging" }, { status: 500 });
    }
}
