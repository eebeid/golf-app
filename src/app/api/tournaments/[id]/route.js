
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from '@/lib/prisma';

export async function DELETE(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Next.js 15+: params is a Promise — must be awaited
    const { id } = await params;

    try {
        // Resolve by UUID first, then fall back to slug
        let tournament = await prisma.tournament.findUnique({ where: { id } });
        if (!tournament) {
            tournament = await prisma.tournament.findUnique({ where: { slug: id } });
        }

        if (!tournament) {
            return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
        }

        // Verify ownership
        if (tournament.ownerId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Score.courseId has no onDelete cascade — delete scores first to avoid FK violation
        const courses = await prisma.course.findMany({
            where: { tournamentId: tournament.id },
            select: { id: true }
        });
        if (courses.length > 0) {
            await prisma.score.deleteMany({
                where: { courseId: { in: courses.map(c => c.id) } }
            });
        }

        await prisma.tournament.delete({ where: { id: tournament.id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete tournament error:', error);
        return NextResponse.json({ error: 'Failed to delete tournament' }, { status: 500 });
    }
}
