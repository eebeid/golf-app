import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    const photos = await prisma.photo.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(photos);
}

export async function POST(request) {
    const body = await request.json();

    if (!body.url) {
        return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const newPhoto = await prisma.photo.create({
        data: {
            url: body.url,
            caption: body.caption || ''
        }
    });

    return NextResponse.json(newPhoto);
}
