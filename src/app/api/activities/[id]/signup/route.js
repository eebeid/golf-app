import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isSuperAdmin } from "@/lib/admin";

export async function GET(request, { params }) {
    const { id } = await params;
    try {
        const signups = await prisma.activitySignup.findMany({
            where: { activityId: id },
            include: { player: true },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(signups);
    } catch (error) {
        console.error("Error fetching activity signups:", error);
        return NextResponse.json({ error: "Failed to fetch signups" }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    const { id: activityId } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const activity = await prisma.activity.findUnique({
            where: { id: activityId },
            include: { tournament: true }
        });

        if (!activity) {
            return NextResponse.json({ error: "Activity not found" }, { status: 404 });
        }

        const body = await request.json().catch(() => ({}));
        let { playerId } = body;

        // Find session player
        const sessionPlayer = await prisma.player.findFirst({
            where: {
                tournamentId: activity.tournamentId,
                email: {
                    equals: session.user.email,
                    mode: 'insensitive'
                }
            }
        });

        // Determine if authorized as admin/manager
        let isAdmin = isSuperAdmin(session.user.email) || activity.tournament.ownerId === session.user.id;
        if (!isAdmin) {
            const manager = await prisma.player.findFirst({
                where: { tournamentId: activity.tournamentId, email: session.user.email, isManager: true }
            });
            if (manager) isAdmin = true;
        }

        // If no playerId was specified, default to the session player
        if (!playerId) {
            if (!sessionPlayer) {
                return NextResponse.json({ error: "You must be registered as a player in this tournament to join activities." }, { status: 400 });
            }
            playerId = sessionPlayer.id;
        } else {
            // If playerId was specified, verify permission: must be own ID or admin/manager
            if (playerId !== sessionPlayer?.id && !isAdmin) {
                return NextResponse.json({ error: "Forbidden: Cannot register other players" }, { status: 403 });
            }
        }

        // Check registration limits
        if (activity.maxPeople) {
            const currentSignupsCount = await prisma.activitySignup.count({
                where: { activityId, status: "CONFIRMED" }
            });
            if (currentSignupsCount >= activity.maxPeople) {
                // Check if this player is already registered (upsert would just modify)
                const existing = await prisma.activitySignup.findUnique({
                    where: { playerId_activityId: { playerId, activityId } }
                });
                if (!existing || existing.status !== "CONFIRMED") {
                    return NextResponse.json({ error: "This activity is full." }, { status: 400 });
                }
            }
        }

        const signup = await prisma.activitySignup.upsert({
            where: {
                playerId_activityId: {
                    playerId,
                    activityId
                }
            },
            create: {
                playerId,
                activityId,
                status: "CONFIRMED"
            },
            update: {
                status: "CONFIRMED"
            },
            include: {
                player: true,
                activity: true
            }
        });

        return NextResponse.json(signup);
    } catch (error) {
        console.error("Error creating activity signup:", error);
        return NextResponse.json({ error: "Failed to sign up", details: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const { id: activityId } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const activity = await prisma.activity.findUnique({
            where: { id: activityId },
            include: { tournament: true }
        });

        if (!activity) {
            return NextResponse.json({ error: "Activity not found" }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        let playerId = searchParams.get('playerId');

        // Find session player
        const sessionPlayer = await prisma.player.findFirst({
            where: {
                tournamentId: activity.tournamentId,
                email: {
                    equals: session.user.email,
                    mode: 'insensitive'
                }
            }
        });

        // Determine if authorized as admin/manager
        let isAdmin = isSuperAdmin(session.user.email) || activity.tournament.ownerId === session.user.id;
        if (!isAdmin) {
            const manager = await prisma.player.findFirst({
                where: { tournamentId: activity.tournamentId, email: session.user.email, isManager: true }
            });
            if (manager) isAdmin = true;
        }

        // If no playerId was specified, default to the session player
        if (!playerId) {
            if (!sessionPlayer) {
                return NextResponse.json({ error: "Player not found." }, { status: 400 });
            }
            playerId = sessionPlayer.id;
        } else {
            // If playerId was specified, verify permission: must be own ID or admin/manager
            if (playerId !== sessionPlayer?.id && !isAdmin) {
                return NextResponse.json({ error: "Forbidden: Cannot remove other players' signups" }, { status: 403 });
            }
        }

        await prisma.activitySignup.delete({
            where: {
                playerId_activityId: {
                    playerId,
                    activityId
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting activity signup:", error);
        return NextResponse.json({ error: "Failed to cancel signup", details: error.message }, { status: 500 });
    }
}
