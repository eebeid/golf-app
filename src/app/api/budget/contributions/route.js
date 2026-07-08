import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

async function authorizeAdmin(session, tournamentId) {
    if (!session?.user?.email) return false;
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return false;
    if (tournament.ownerId === user?.id) return true;
    const manager = await prisma.player.findFirst({
        where: { tournamentId, email: session.user.email, isManager: true }
    });
    return !!manager;
}

// GET /api/budget/contributions?tournamentId=xxx
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) return Response.json({ error: 'tournamentId required' }, { status: 400 });

    const session = await getServerSession(authOptions);
    if (!await authorizeAdmin(session, tournamentId)) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const contributions = await prisma.playerContribution.findMany({
        where: { tournamentId },
        include: { player: { select: { id: true, name: true, imageUrl: true, email: true } } },
        orderBy: { player: { name: 'asc' } }
    });

    return Response.json(contributions);
}

// POST /api/budget/contributions  - bulk upsert contributions for all players
// Body: { tournamentId, amountDue }  -- sets uniform due for everyone
export async function POST(request) {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { tournamentId, amountDue, contributions } = body;

    if (!tournamentId) return Response.json({ error: 'tournamentId required' }, { status: 400 });
    if (!await authorizeAdmin(session, tournamentId)) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If an explicit array is passed, upsert each entry individually (manual overrides)
    if (Array.isArray(contributions)) {
        const results = await Promise.all(
            contributions.map(c =>
                prisma.playerContribution.upsert({
                    where: { tournamentId_playerId: { tournamentId, playerId: c.playerId } },
                    create: {
                        tournamentId,
                        playerId: c.playerId,
                        amountDue: parseFloat(c.amountDue) || 0,
                        amountPaid: parseFloat(c.amountPaid) || 0,
                        notes: c.notes || null
                    },
                    update: {
                        amountDue: parseFloat(c.amountDue) || 0,
                        ...(c.amountPaid != null && { amountPaid: parseFloat(c.amountPaid) }),
                        ...(c.notes != null && { notes: c.notes })
                    }
                })
            )
        );
        return Response.json(results);
    }

    // Otherwise, bulk-recalculate: distribute amountDue evenly across all players
    const players = await prisma.player.findMany({ where: { tournamentId } });
    const due = parseFloat(amountDue) || 0;

    const results = await Promise.all(
        players.map(p =>
            prisma.playerContribution.upsert({
                where: { tournamentId_playerId: { tournamentId, playerId: p.id } },
                create: { tournamentId, playerId: p.id, amountDue: due, amountPaid: 0 },
                update: { amountDue: due }
            })
        )
    );

    return Response.json(results);
}

// PUT /api/budget/contributions  - update a single player's contribution (mark paid, adjust amounts)
export async function PUT(request) {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { id, amountDue, amountPaid, paidAt, notes } = body;

    if (!id) return Response.json({ error: 'id required' }, { status: 400 });

    const existing = await prisma.playerContribution.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

    if (!await authorizeAdmin(session, existing.tournamentId)) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.playerContribution.update({
        where: { id },
        data: {
            ...(amountDue != null && { amountDue: parseFloat(amountDue) }),
            ...(amountPaid != null && { amountPaid: parseFloat(amountPaid) }),
            paidAt: paidAt ? new Date(paidAt) : (amountPaid > 0 ? new Date() : null),
            ...(notes != null && { notes })
        },
        include: { player: { select: { id: true, name: true, imageUrl: true } } }
    });

    return Response.json(updated);
}
