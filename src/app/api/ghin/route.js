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

        const ghinInt = parseInt(ghinNumber, 10);
        let data;

        try {
            // Get a golfer's handicap directly
            data = await ghin.handicaps.getOne(ghinInt);
        } catch (err) {
            console.log("getOne failed, trying globalSearch instead...");
            // Fallback: search globally
            const searchResults = await ghin.golfers.globalSearch({ ghin: ghinInt });
            if (searchResults && searchResults.length > 0) {
                data = searchResults[0];
            } else {
                throw new Error("Golfer not found in GHIN database");
            }
        }
        
        return NextResponse.json({ 
            success: true, 
            handicap_index: data.handicap_index ?? data.HandicapIndex,
            details: data
        });

    } catch (error) {
        console.error("GHIN API Error:", error);
        return NextResponse.json({ error: "Failed to retrieve GHIN data", details: error.message }, { status: 500 });
    }
}
