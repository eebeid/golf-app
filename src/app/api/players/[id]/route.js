import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { uploadToS3, deleteFromS3 } from '@/lib/s3';
import { getSession, checkTournamentAdmin, unauthorized, forbidden } from '@/lib/apiAuth';

export async function DELETE(request, { params }) {
    const session = await getSession();
    if (!session?.user) return unauthorized();

    const { id } = await params;
    try {
        const player = await prisma.player.findUnique({ 
            where: { id: String(id) },
            include: { tournament: true }
        });

        if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

        const { isAuthorized } = await checkTournamentAdmin(session, player.tournament);
        if (!isAuthorized) return forbidden();

        if (player.imageUrl) {
            await deleteFromS3(player.imageUrl);
        }
        await prisma.player.delete({ where: { id: String(id) } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Player Delete Error:", error);
        return NextResponse.json({ error: "Failed to delete player" }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const session = await getSession();
    if (!session?.user) return unauthorized();

    const { id } = await params;
    const data = await request.json();
    const { name, email, phone, handicapIndex, hcpRiver, hcpPlantation, hcpRNK, courseData, isManager, roomNumber, houseNumber, ghin } = data;
    let { imageUrl } = data;

    try {
        const existingPlayer = await prisma.player.findUnique({ 
            where: { id },
            include: { tournament: true }
        });

        if (!existingPlayer) return NextResponse.json({ error: "Player not found" }, { status: 404 });

        const { isAuthorized, isAdmin } = await checkTournamentAdmin(session, existingPlayer.tournament);

        // Also allow the player to edit their own record
        const isSelf = session.user.email?.toLowerCase() === existingPlayer.email?.toLowerCase();
        if (!isAuthorized && !isSelf) return forbidden();

        // Only Admins or Owners can promote/demote managers
        const updatedIsManager = isAdmin ? isManager : existingPlayer.isManager;

        // Handle Image Upload if it's a Base64 string
        if (imageUrl && imageUrl.startsWith('data:image/')) {
            const base64Data = imageUrl.split(',')[1];
            const contentType = imageUrl.split(';')[0].split(':')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            const fileExtension = contentType.split('/')[1] || 'jpg';
            const fileName = `players/${id}-${Date.now()}.${fileExtension}`;

            if (existingPlayer?.imageUrl) {
                await deleteFromS3(existingPlayer.imageUrl);
            }

            imageUrl = await uploadToS3(buffer, fileName, contentType);
        }

        const player = await prisma.player.update({
            where: { id },
            data: {
                name,
                email: email ? email.trim() : null,
                phone,
                handicapIndex,
                hcpRiver,
                hcpPlantation,
                hcpRNK,
                roomNumber,
                houseNumber,
                imageUrl,
                isManager: updatedIsManager,
                ...(ghin !== undefined && { ghin: ghin ? String(ghin).trim() : null }),
                ...(courseData !== undefined && { courseData })
            }
        });
        return NextResponse.json(player);
    } catch (e) {
        console.error("PRISMA UPDATE ERROR: ", e);
        return NextResponse.json({ error: "Failed to update", details: e.message }, { status: 500 });
    }
}
