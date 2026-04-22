import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { code } = await request.json();
        const betaCode = process.env.BETA_PROMO_CODE;

        if (!betaCode) {
            return NextResponse.json({ error: "Promotion system not configured" }, { status: 500 });
        }

        if (code !== betaCode) {
            return NextResponse.json({ error: "Invalid beta code" }, { status: 400 });
        }

        // Upgrade user to Pro
        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: { isPro: true }
        });

        return NextResponse.json({ success: true, message: "Welcome to PinPlaced Pro!" });
    } catch (error) {
        console.error("Redeem Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
