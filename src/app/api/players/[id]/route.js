import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { uploadToS3, deleteFromS3 } from '@/lib/s3';

export async function DELETE(request, { params }) {
    const { id } = await params;
    try {
        const player = await prisma.player.findUnique({ where: { id: String(id) } });
        if (player?.imageUrl) {
            await deleteFromS3(player.imageUrl);
        }
        await prisma.player.delete({ where: { id: String(id) } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete player" }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const { id } = await params;
    const data = await request.json();
    const { name, email, phone, ghin, handicapIndex, hcpRiver, hcpPlantation, hcpRNK, courseData, isManager, roomNumber, houseNumber } = data;
    let { imageUrl } = data;

    try {
        const existingPlayer = await prisma.player.findUnique({ where: { id } });

        // Handle Image Upload if it's a Base64 string (starts with data:image/...)
        if (imageUrl && imageUrl.startsWith('data:image/')) {
            const base64Data = imageUrl.split(',')[1];
            const contentType = imageUrl.split(';')[0].split(':')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            const fileExtension = contentType.split('/')[1] || 'jpg';
            const fileName = `players/${id}-${Date.now()}.${fileExtension}`;

            // Delete old image if it exists on S3
            if (existingPlayer?.imageUrl) {
                await deleteFromS3(existingPlayer.imageUrl);
            }

            imageUrl = await uploadToS3(buffer, fileName, contentType);
        }

        const player = await prisma.player.update({
            where: { id },
            data: {
                name,
                email,
                phone,
                ghin,
                handicapIndex,
                hcpRiver,
                hcpPlantation,
                hcpRNK,
                roomNumber,
                houseNumber,
                imageUrl,
                isManager: isManager ?? undefined,
                ...(courseData !== undefined && { courseData })
            }
        });
        return NextResponse.json(player);
    } catch (e) {
        console.error("PRISMA UPDATE ERROR: ", e);
        return NextResponse.json({ error: "Failed to update", details: e.message }, { status: 500 });
    }
}
