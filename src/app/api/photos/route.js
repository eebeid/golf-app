import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { uploadToS3 } from '@/lib/s3';

export async function GET() {
    const photos = await prisma.photo.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(photos);
}

export async function POST(request) {
    const body = await request.json();
    let { url, caption, tournamentId } = body;

    if (!url) {
        return NextResponse.json({ error: "Image data/URL is required" }, { status: 400 });
    }

    try {
        // Handle Image Upload if it's a Base64 string
        if (url.startsWith('data:image/')) {
            const base64Data = url.split(',')[1];
            const contentType = url.split(';')[0].split(':')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            const fileExtension = contentType.split('/')[1] || 'jpg';
            const fileName = `gallery/${Date.now()}.${fileExtension}`;

            url = await uploadToS3(buffer, fileName, contentType);
        }

        const newPhoto = await prisma.photo.create({
            data: {
                url,
                caption: caption || '',
                tournamentId: tournamentId || null
            }
        });

        return NextResponse.json(newPhoto);
    } catch (error) {
        console.error('Photo upload error:', error);
        return NextResponse.json({ error: "Failed to upload/save photo" }, { status: 500 });
    }
}
