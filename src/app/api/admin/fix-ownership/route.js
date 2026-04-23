import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isSuperAdmin } from "@/lib/admin";

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true },
        orderBy: { email: 'asc' }
    });

    const tournaments = await prisma.tournament.findMany({
        select: { id: true, name: true, slug: true, ownerId: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ users, tournaments, currentUserId: session.user.id });
}

// PATCH /api/admin/fix-ownership?tournamentId=xxx&userId=yyy
export async function PATCH(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const userId = searchParams.get('userId');

    if (!tournamentId || !userId) {
        return NextResponse.json({ error: 'tournamentId and userId required' }, { status: 400 });
    }

    const updated = await prisma.tournament.update({
        where: { id: tournamentId },
        data: { ownerId: userId }
    });

    return NextResponse.json({ success: true, tournament: updated });
}
