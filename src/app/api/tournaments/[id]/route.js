
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from '@/lib/prisma';

export async function DELETE(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params; // This is the tournament slug or ID?
    // Route file is [...]/api/tournaments/[id]/route.js
    // Params header says 'id'.
    // NOTE: The param name depends on folder name. Folder is [id].
    // So 'id' is correct. BUT is it slug or uuid?
    // Frontend usually deals with Slugs in URLs `/t/[slug]`.
    // But for deletion, ID is safer. However, we might pass slug.
    // Let's resolve.

    try {
        // Try to find by ID first
        let tournament = await prisma.tournament.findUnique({
            where: { id }
        });

        if (!tournament) {
            // Try slug
            tournament = await prisma.tournament.findUnique({
                where: { slug: id }
            });
        }

        if (!tournament) {
            return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
        }

        // Verify ownership
        if (tournament.ownerId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Delete
        // Cascade should handle related records
        await prisma.tournament.delete({
            where: { id: tournament.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete tournament error:', error);
        return NextResponse.json({ error: 'Failed to delete tournament' }, { status: 500 });
    }
}
