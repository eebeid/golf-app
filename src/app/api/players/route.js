import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { uploadToS3 } from '@/lib/s3';
import { getSession, checkTournamentAdmin, unauthorized, forbidden } from '@/lib/apiAuth';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('tournamentId');

    if (!slug) {
        return NextResponse.json([]);
    }

    try {
        let t = await prisma.tournament.findUnique({ where: { slug } });
        if (!t) {
            // Fallback in case they linked using internal ID
            t = await prisma.tournament.findUnique({ where: { id: slug } });
        }

        if (!t) {
            return NextResponse.json([]);
        }

        const players = await prisma.player.findMany({
            where: { tournamentId: t.id },
            orderBy: { registeredAt: 'desc' }
        });
        return NextResponse.json(players);
    } catch (error) {
        console.error('Error fetching players:', error);
        return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
    }
}

export async function POST(request) {
    const session = await getSession();
    if (!session?.user) return unauthorized();

    const body = await request.json();
    let { imageUrl } = body;
    const {
        name,
        email,
        phone,
        ghin,
        handicapIndex,
        teeRiver,
        teePlantation,
        teeRNK,
        hcpRiver,
        hcpPlantation,
        hcpRNK,
        courseData,
        roomNumber,
        houseNumber,
        tournamentId // slug
    } = body;

    if (!name) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!tournamentId) {
        return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
    }

    let tournament = null;
    try {
        tournament = await prisma.tournament.findUnique({
            where: { slug: tournamentId },
        });
    } catch (error) {
        console.error('Error looking up tournament:', error);
        return NextResponse.json({ error: 'Failed to resolve tournament' }, { status: 500 });
    }

    if (!tournament) {
        return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Verify user has permission to add players to this tournament
    const { isAuthorized } = await checkTournamentAdmin(session, tournament);
    if (!isAuthorized) return forbidden();

    try {
        const tempId = Math.random().toString(36).substring(7);

        // Handle Image Upload if it's a Base64 string
        if (imageUrl && imageUrl.startsWith('data:image/')) {
            const base64Data = imageUrl.split(',')[1];
            const contentType = imageUrl.split(';')[0].split(':')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            const fileExtension = contentType.split('/')[1] || 'jpg';
            const fileName = `players/${tempId}-${Date.now()}.${fileExtension}`;
            imageUrl = await uploadToS3(buffer, fileName, contentType);
        }

        const player = await prisma.player.create({
            data: {
                name,
                email: email ? email.trim() : null,
                phone: phone || null,
                ghin: ghin ? String(ghin).trim() : null,
                handicapIndex: handicapIndex || 0,
                teeRiver: teeRiver || 'Gold',
                teePlantation: teePlantation || 'Gold',
                teeRNK: teeRNK || 'Gold',
                hcpRiver: hcpRiver || 0,
                hcpPlantation: hcpPlantation || 0,
                hcpRNK: hcpRNK || 0,
                courseData: courseData || {},
                roomNumber: roomNumber || null,
                houseNumber: houseNumber || null,
                imageUrl: imageUrl || null,
                tournamentId: tournament.id
            }
        });

        return NextResponse.json(player);
    } catch (error) {
        console.error('Error registering player:', error);
        return NextResponse.json({ error: 'Failed to register player' }, { status: 500 });
    }
}
