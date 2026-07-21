import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isSuperAdmin } from "@/lib/admin";

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !isSuperAdmin(session.user?.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const users = await prisma.user.findMany({
            orderBy: { id: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                isPro: true,
                createdAt: true,
                _count: {
                    select: { tournaments: true }
                }
            }
        });

        return NextResponse.json({ users });
    } catch (error) {
        console.error("GET admin/users error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !isSuperAdmin(session.user?.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userId, isPro } = await req.json();
        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { isPro: !!isPro }
        });

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("POST admin/users error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
