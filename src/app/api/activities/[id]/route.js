import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isSuperAdmin } from "@/lib/admin";

export async function DELETE(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const activity = await prisma.activity.findUnique({
            where: { id },
            include: { tournament: true }
        });

        if (!activity) {
            return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
        }

        // AUTHORIZATION CHECK
        let isAuthorized = isSuperAdmin(session.user.email) || activity.tournament.ownerId === session.user.id;
        if (!isAuthorized) {
            const manager = await prisma.player.findFirst({
                where: { tournamentId: activity.tournamentId, email: session.user.email, isManager: true }
            });
            if (manager) isAuthorized = true;
        }

        if (!isAuthorized) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Delete cascade is set up in Prisma schema, but we can delete signups explicitly too
        await prisma.activitySignup.deleteMany({ where: { activityId: id } });
        await prisma.activity.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Activity DELETE error:', e);
        return NextResponse.json({ error: 'Failed to delete activity', details: e.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const {
        title,
        description,
        date,
        endTime,
        location,
        cost,
        maxPeople,
        minPeople,
        reservationsRequired,
        venmoLink,
        category,
        icon,
        tournamentId
    } = body;

    try {
        const activity = await prisma.activity.findUnique({
            where: { id },
            include: { tournament: true }
        });

        if (!activity) {
            return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
        }

        // AUTHORIZATION CHECK
        let isAuthorized = isSuperAdmin(session.user.email) || activity.tournament.ownerId === session.user.id;
        if (!isAuthorized) {
            const manager = await prisma.player.findFirst({
                where: { tournamentId: activity.tournamentId, email: session.user.email, isManager: true }
            });
            if (manager) isAuthorized = true;
        }

        if (!isAuthorized) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const parsedCost = (cost !== undefined && cost !== null && cost !== "") ? parseFloat(cost) : null;
        const parsedMaxPeople = (maxPeople !== undefined && maxPeople !== null && maxPeople !== "") ? parseInt(maxPeople) : null;
        const parsedMinPeople = (minPeople !== undefined && minPeople !== null && minPeople !== "") ? parseInt(minPeople) : 0;

        const updated = await prisma.activity.update({
            where: { id },
            data: {
                title: title !== undefined ? title : undefined,
                description: description !== undefined ? description : undefined,
                date: date !== undefined ? new Date(date) : undefined,
                endTime: endTime !== undefined ? (endTime ? new Date(endTime) : null) : undefined,
                location: location !== undefined ? location : undefined,
                cost: cost !== undefined ? (isNaN(parsedCost) ? null : parsedCost) : undefined,
                maxPeople: maxPeople !== undefined ? (isNaN(parsedMaxPeople) ? null : parsedMaxPeople) : undefined,
                minPeople: minPeople !== undefined ? (isNaN(parsedMinPeople) ? 0 : parsedMinPeople) : undefined,
                reservationsRequired: reservationsRequired !== undefined ? !!reservationsRequired : undefined,
                venmoLink: venmoLink !== undefined ? venmoLink : undefined,
                category: category !== undefined ? category : undefined,
                icon: icon !== undefined ? icon : undefined,
            },
            include: {
                signups: {
                    include: {
                        player: true
                    }
                }
            }
        });
        return NextResponse.json(updated);
    } catch (e) {
        console.error('Activity PUT error:', e);
        return NextResponse.json({ error: 'Failed to update activity', details: e.message }, { status: 500 });
    }
}
