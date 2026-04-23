import { NextResponse } from 'next/server';
import { GhinClient } from '@spicygolf/ghin';

export async function POST(request) {
    try {
        const { ghinNumber } = await request.json();

        if (!ghinNumber) {
            return NextResponse.json({ error: "GHIN Number is required" }, { status: 400 });
        }

        // Initialize the client
        const ghin = new GhinClient({
            username: process.env.GHIN_USERNAME,
            password: process.env.GHIN_PASSWORD,
        });

        // Get a golfer's handicap
        const data = await ghin.handicaps.getOne(ghinNumber);
        
        return NextResponse.json({ 
            success: true, 
            handicap_index: data.handicap_index,
            details: data
        });

    } catch (error) {
        console.error("GHIN API Error:", error);
        return NextResponse.json({ error: "Failed to retrieve GHIN data", details: error.message }, { status: 500 });
    }
}
