import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isSuperAdmin } from "@/lib/admin";
import prisma from '@/lib/prisma';

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session || !isSuperAdmin(session.user?.email)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 29); // 30 days inclusive
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        // Build a map of the last 30 dates (YYYY-MM-DD → MM/DD label)
        const dateMap = {}; // "YYYY-MM-DD" → { label, tournaments, users, scores }
        for (let i = 0; i < 30; i++) {
            const d = new Date(thirtyDaysAgo);
            d.setDate(thirtyDaysAgo.getDate() + i);
            const key = d.toISOString().slice(0, 10);
            const label = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
            dateMap[key] = { rawDate: key, date: label, tournaments: 0, players: 0, scores: 0 };
        }

        // New tournaments per day
        const tournaments = await prisma.tournament.findMany({
            where: { createdAt: { gte: thirtyDaysAgo } },
            select: { createdAt: true }
        });
        tournaments.forEach(t => {
            const key = t.createdAt.toISOString().slice(0, 10);
            if (dateMap[key]) dateMap[key].tournaments++;
        });

        // New players added per day (Player uses registeredAt, not createdAt)
        const players = await prisma.player.findMany({
            where: { registeredAt: { gte: thirtyDaysAgo } },
            select: { registeredAt: true }
        });
        players.forEach(p => {
            const key = p.registeredAt.toISOString().slice(0, 10);
            if (dateMap[key]) dateMap[key].players++;
        });

        // Scores submitted per day
        const scores = await prisma.score.findMany({
            where: { createdAt: { gte: thirtyDaysAgo } },
            select: { createdAt: true }
        });
        scores.forEach(s => {
            const key = s.createdAt.toISOString().slice(0, 10);
            if (dateMap[key]) dateMap[key].scores++;
        });

        const data = Object.values(dateMap).sort((a, b) => a.rawDate.localeCompare(b.rawDate));

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Internal analytics error:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics', details: error.message }, { status: 500 });
    }
}
