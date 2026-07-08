import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET /api/budget?tournamentId=xxx  - fetch line items + player contributions
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) {
        return Response.json({ error: 'tournamentId required' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify caller is owner or manager of this tournament
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
            budgetLineItems: { orderBy: { createdAt: 'asc' } },
            playerContributions: {
                include: { player: { select: { id: true, name: true, imageUrl: true } } },
                orderBy: { player: { name: 'asc' } }
            }
        }
    });

    if (!tournament) {
        return Response.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Allow owner or players with isManager=true
    const isOwner = tournament.ownerId === user?.id;
    if (!isOwner) {
        const manager = await prisma.player.findFirst({
            where: { tournamentId, email: session.user.email, isManager: true }
        });
        if (!manager) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }
    }

    return Response.json({
        lineItems: tournament.budgetLineItems,
        contributions: tournament.playerContributions
    });
}

// POST /api/budget  - create a new line item
export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tournamentId, category, label, estimatedCost, actualCost, paidAt, notes, perPlayer } = body;

    if (!tournamentId || !label) {
        return Response.json({ error: 'tournamentId and label are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });

    if (!tournament) return Response.json({ error: 'Tournament not found' }, { status: 404 });

    const isOwner = tournament.ownerId === user?.id;
    if (!isOwner) {
        const manager = await prisma.player.findFirst({
            where: { tournamentId, email: session.user.email, isManager: true }
        });
        if (!manager) return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const lineItem = await prisma.budgetLineItem.create({
        data: {
            tournamentId,
            category: category || 'Other',
            label,
            estimatedCost: estimatedCost != null ? parseFloat(estimatedCost) : null,
            actualCost: actualCost != null ? parseFloat(actualCost) : null,
            paidAt: paidAt ? new Date(paidAt) : null,
            notes: notes || null,
            perPlayer: !!perPlayer
        }
    });

    return Response.json(lineItem, { status: 201 });
}

// PUT /api/budget  - update a line item
export async function PUT(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, category, label, estimatedCost, actualCost, paidAt, notes, perPlayer } = body;

    if (!id) return Response.json({ error: 'id required' }, { status: 400 });

    const existing = await prisma.budgetLineItem.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const tournament = await prisma.tournament.findUnique({ where: { id: existing.tournamentId } });

    const isOwner = tournament?.ownerId === user?.id;
    if (!isOwner) {
        const manager = await prisma.player.findFirst({
            where: { tournamentId: existing.tournamentId, email: session.user.email, isManager: true }
        });
        if (!manager) return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.budgetLineItem.update({
        where: { id },
        data: {
            ...(category != null && { category }),
            ...(label != null && { label }),
            estimatedCost: estimatedCost != null ? parseFloat(estimatedCost) : null,
            actualCost: actualCost != null ? parseFloat(actualCost) : null,
            paidAt: paidAt ? new Date(paidAt) : null,
            ...(notes != null && { notes }),
            ...(perPlayer != null && { perPlayer: !!perPlayer })
        }
    });

    return Response.json(updated);
}

// DELETE /api/budget?id=xxx  - delete a line item
export async function DELETE(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });

    const existing = await prisma.budgetLineItem.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const tournament = await prisma.tournament.findUnique({ where: { id: existing.tournamentId } });

    const isOwner = tournament?.ownerId === user?.id;
    if (!isOwner) {
        const manager = await prisma.player.findFirst({
            where: { tournamentId: existing.tournamentId, email: session.user.email, isManager: true }
        });
        if (!manager) return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.budgetLineItem.delete({ where: { id } });

    return Response.json({ success: true });
}
