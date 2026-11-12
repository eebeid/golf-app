import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { checkTournamentAdmin, unauthorized, forbidden } from '@/lib/apiAuth';

async function resolveTournament(identifier) {
    if (!identifier) return null;
    let tournament = await prisma.tournament.findUnique({
        where: { id: identifier }
    });
    if (!tournament) {
        tournament = await prisma.tournament.findUnique({
            where: { slug: identifier }
        });
    }
    return tournament;
}

// GET /api/budget?tournamentId=xxx  - fetch line items + player contributions
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) {
        return Response.json({ error: 'tournamentId required' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);

    const tournament = await prisma.tournament.findFirst({
        where: { OR: [{ id: tournamentId }, { slug: tournamentId }] },
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

    const { isAuthorized } = session?.user
        ? await checkTournamentAdmin(session, tournament)
        : { isAuthorized: false };

    return Response.json({
        lineItems: tournament.budgetLineItems,
        contributions: tournament.playerContributions,
        tournamentId: tournament.id,
        isAdmin: !!isAuthorized
    });
}

// POST /api/budget  - create a new line item
export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return unauthorized();
    }

    const body = await request.json();
    const { tournamentId, category, label, estimatedCost, actualCost, paidAt, notes, perPlayer } = body;

    if (!tournamentId || !label) {
        return Response.json({ error: 'tournamentId and label are required' }, { status: 400 });
    }

    const tournament = await resolveTournament(tournamentId);
    if (!tournament) {
        return Response.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const { isAuthorized } = await checkTournamentAdmin(session, tournament);
    if (!isAuthorized) {
        return forbidden();
    }

    const lineItem = await prisma.budgetLineItem.create({
        data: {
            tournamentId: tournament.id,
            category: category || 'Other',
            label: label.trim(),
            estimatedCost: estimatedCost != null && estimatedCost !== '' ? parseFloat(estimatedCost) : null,
            actualCost: actualCost != null && actualCost !== '' ? parseFloat(actualCost) : null,
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
        return unauthorized();
    }

    const body = await request.json();
    const { id, category, label, estimatedCost, actualCost, paidAt, notes, perPlayer } = body;

    if (!id) return Response.json({ error: 'id required' }, { status: 400 });

    const existing = await prisma.budgetLineItem.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

    const tournament = await prisma.tournament.findUnique({ where: { id: existing.tournamentId } });
    if (!tournament) return Response.json({ error: 'Tournament not found' }, { status: 404 });

    const { isAuthorized } = await checkTournamentAdmin(session, tournament);
    if (!isAuthorized) {
        return forbidden();
    }

    const updated = await prisma.budgetLineItem.update({
        where: { id },
        data: {
            ...(category != null && { category }),
            ...(label != null && { label: label.trim() }),
            estimatedCost: estimatedCost != null && estimatedCost !== '' ? parseFloat(estimatedCost) : null,
            actualCost: actualCost != null && actualCost !== '' ? parseFloat(actualCost) : null,
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
        return unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });

    const existing = await prisma.budgetLineItem.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

    const tournament = await prisma.tournament.findUnique({ where: { id: existing.tournamentId } });
    if (!tournament) return Response.json({ error: 'Tournament not found' }, { status: 404 });

    const { isAuthorized } = await checkTournamentAdmin(session, tournament);
    if (!isAuthorized) {
        return forbidden();
    }

    await prisma.budgetLineItem.delete({ where: { id } });

    return Response.json({ success: true });
}
