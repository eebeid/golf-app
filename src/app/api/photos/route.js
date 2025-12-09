import { NextResponse } from 'next/server';
import { getData, addPhoto } from '@/lib/data';

export async function GET() {
    const photos = await getData('photos');
    return NextResponse.json(photos);
}

export async function POST(request) {
    const body = await request.json();
    const photo = {
        id: Date.now(),
        url: body.url, // In a real app, handle file upload. Here we might assume a URL or base64? 
        // For simplicity, let's assume we store the URL or a base64 string if small enough.
        caption: body.caption,
        uploadedAt: new Date().toISOString()
    };

    await addPhoto(photo);
    return NextResponse.json(photo);
}
