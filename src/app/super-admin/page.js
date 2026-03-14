import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Users, Trophy, DollarSign, Crown, ArrowLeft } from "lucide-react";
import SuperAdminClient from "./SuperAdminClient";
import { isSuperAdmin } from "@/lib/admin";

export const dynamic = 'force-dynamic';

export default async function SuperAdminPage() {
    const session = await getServerSession(authOptions);

    // Ensure only authorized super admins can view this page
    if (!session || !isSuperAdmin(session.user?.email)) {
        return (
            <div className="container" style={{ padding: '6rem 20px', textAlign: 'center' }}>
                <h1 style={{ color: 'var(--accent)' }}>Access Denied</h1>
                <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>You do not have permission to view the Super Admin dashboard.</p>
                <Link href="/" className="btn" style={{ marginTop: '2rem', display: 'inline-block' }}>
                    Return Home
                </Link>
            </div>
        );
    }

    // Fetch Analytics Data
    const totalUsers = await prisma.user.count();
    const totalProUsers = await prisma.user.count({ where: { isPro: true } });
    const totalTournaments = await prisma.tournament.count();
    const totalPlayers = await prisma.player.count();

    // MRR Calculation
    const mrr = totalProUsers * 19;

    // Fetch Recent Activity
    const recentSignups = await prisma.user.findMany({
        take: 5,
        orderBy: { id: 'desc' },
        select: { id: true, name: true, email: true, isPro: true }
    });

    const recentTournaments = await prisma.tournament.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, createdAt: true, owner: { select: { name: true, email: true } } }
    });

    // Fetch All Tournaments for the Directory Tab
    const allTournaments = await prisma.tournament.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            owner: { select: { name: true, email: true } },
            _count: { select: { players: true, courses: true } }
        }
    });

    return (
        <SuperAdminClient
            totalUsers={totalUsers}
            totalProUsers={totalProUsers}
            totalTournaments={totalTournaments}
            totalPlayers={totalPlayers}
            mrr={mrr}
            recentSignups={recentSignups}
            recentTournaments={recentTournaments}
            allTournaments={allTournaments}
        />
    );
}
