import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const placeId = searchParams.get('placeId');
    const type = searchParams.get('type') || 'restaurant';
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 });
    }

    try {
        if (placeId) {
            // Fetch Place Details
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,website,formatted_phone_number,rating,editorial_summary,geometry&key=${apiKey}`
            );
            const data = await response.json();

            if (data.status === 'OK') {
                return NextResponse.json(data.result);
            } else {
                return NextResponse.json({ error: data.status }, { status: 400 });
            }
        } else if (query) {
            // Fetch Text Search with dynamic type
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=${type}&key=${apiKey}`
            );
            const data = await response.json();

            if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
                return NextResponse.json(data.results);
            } else {
                return NextResponse.json({ error: data.status }, { status: 400 });
            }
        } else {
            return NextResponse.json({ error: 'Missing query or placeId parameter' }, { status: 400 });
        }
    } catch (e) {
        console.error('Google Places API Error:', e);
        return NextResponse.json({ error: 'Failed to fetch places' }, { status: 500 });
    }
}
