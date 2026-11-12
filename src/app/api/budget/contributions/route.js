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

// GET /api/budget/contributions?tournamentId=xxx
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) return Response.json({ error: 'tournamentId required' }, { status: 400 });

    const session = await getServerSession(authOptions);

    const tournament = await resolveTournament(tournamentId);
    if (!tournament) return Response.json({ error: 'Tournament not found' }, { status: 404 });

    const { isAuthorized } = session?.user
        ? await checkTournamentAdmin(session, tournament)
        : { isAuthorized: false };

    const contributions = await prisma.playerContribution.findMany({
        where: { tournamentId: tournament.id },
        include: { player: { select: { id: true, name: true, imageUrl: true, email: !!isAuthorized } } },
        orderBy: { player: { name: 'asc' } }
    });

    return Response.json(contributions);
}

// POST /api/budget/contributions  - bulk upsert contributions for all players
// Body: { tournamentId, amountDue }  -- sets uniform due for everyone
export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return unauthorized();

    const body = await request.json();
    const { tournamentId, amountDue, contributions } = body;

    if (!tournamentId) return Response.json({ error: 'tournamentId required' }, { status: 400 });

    const tournament = await resolveTournament(tournamentId);
    if (!tournament) return Response.json({ error: 'Tournament not found' }, { status: 404 });

    const { isAuthorized } = await checkTournamentAdmin(session, tournament);
    if (!isAuthorized) return forbidden();

    // If an explicit array is passed, upsert each entry individually (manual overrides)
    if (Array.isArray(contributions)) {
        const results = await Promise.all(
            contributions.map(c =>
                prisma.playerContribution.upsert({
                    where: { tournamentId_playerId: { tournamentId: tournament.id, playerId: c.playerId } },
                    create: {
                        tournamentId: tournament.id,
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
    const players = await prisma.player.findMany({ where: { tournamentId: tournament.id } });
    const due = parseFloat(amountDue) || 0;

    const results = await Promise.all(
        players.map(p =>
            prisma.playerContribution.upsert({
                where: { tournamentId_playerId: { tournamentId: tournament.id, playerId: p.id } },
                create: { tournamentId: tournament.id, playerId: p.id, amountDue: due, amountPaid: 0 },
                update: { amountDue: due }
            })
        )
    );

    return Response.json(results);
}

// PUT /api/budget/contributions  - update a single player's contribution (mark paid, adjust amounts)
export async function PUT(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return unauthorized();

    const body = await request.json();
    const { id, amountDue, amountPaid, paidAt, notes } = body;

    if (!id) return Response.json({ error: 'id required' }, { status: 400 });

    const existing = await prisma.playerContribution.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });

    const tournament = await prisma.tournament.findUnique({ where: { id: existing.tournamentId } });
    if (!tournament) return Response.json({ error: 'Tournament not found' }, { status: 404 });

    const { isAuthorized } = await checkTournamentAdmin(session, tournament);
    if (!isAuthorized) return forbidden();

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
