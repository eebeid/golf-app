import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    // The secret code to whitelist beta testers. 
    // You can change this or move it to your .env file
    const SECRET_BETA_CODE = process.env.BETA_INVITE_CODE || 'PINPLACED-VIP';

    if (code !== SECRET_BETA_CODE) {
        return NextResponse.json({ error: "Invalid beta code." }, { status: 403 });
    }

    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
        // If they aren't signed in yet, redirect them to sign in first, 
        // passing the callback URL so they come back to this route to finish the upgrade.
        const callbackUrl = encodeURIComponent(`/api/upgrade/secret?code=${code}`);
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/api/auth/signin?callbackUrl=${callbackUrl}`);
    }

    try {
        // Upgrade the logged-in user to Pro
        await prisma.user.update({
            where: { id: session.user.id },
            data: { isPro: true }
        });

        // Redirect them back to their dashboard with a success flag
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?upgraded=true&beta=true`);

    } catch (err) {
        console.error("Error applying beta whitelist code:", err);
        return NextResponse.json({ error: "Failed to upgrade account." }, { status: 500 });
    }
}
