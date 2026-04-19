import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { uploadToS3 } from '@/lib/s3';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('tournamentId');

    if (!slug) {
        return NextResponse.json([]);
    }

    let t = await prisma.tournament.findUnique({ where: { slug } });
    if (!t) {
        // Fallback in case they linked using internal ID
        t = await prisma.tournament.findUnique({ where: { id: slug } });
    }

    if (!t) {
        return NextResponse.json([]); // Prevent returning ALL players if not found
    }

    const where = { tournamentId: t.id };
    const players = await prisma.player.findMany({ where, orderBy: { registeredAt: 'desc' } });
    return NextResponse.json(players);
}

export async function POST(request) {
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
        courseData, // Dynamic courses
        roomNumber,
        houseNumber,
        tournamentId // slug
    } = body;

    if (!name) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    let tId = null;
    if (tournamentId) {
        const t = await prisma.tournament.findUnique({
            where: { slug: tournamentId },
            include: { owner: true, players: true }
        });

        if (t) {
            tId = t.id;

            // Pro Enforcement: Free limit is 4 players
            if (!t.owner?.isPro && t.players.length >= 4) {
                return NextResponse.json({
                    error: "Free tier is limited to 4 players. Please upgrade to Pro."
                }, { status: 403 });
            }
        }
    }

    try {
        // Generate a temporary ID or use a UUID for the file name
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
                email: email || null,
                phone: phone || null,
                ghin: ghin || null,
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
                tournamentId: tId
            }
        });

        return NextResponse.json(player);
    } catch (error) {
        console.error('Error registering player:', error);
        return NextResponse.json({ error: 'Failed to register player' }, { status: 500 });
    }
}
