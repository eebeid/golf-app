import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request, { params }) {
    const { id } = await params;
    try {
        const signups = await prisma.dinnerSignup.findMany({
            where: { restaurantId: id },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(signups);
    } catch (error) {
        console.error("Error fetching dinner signups:", error);
        return NextResponse.json({ error: "Failed to fetch signups" }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        const data = await request.json();
        const { name, attendees } = data;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const signup = await prisma.dinnerSignup.create({
            data: {
                restaurantId: id,
                name,
                attendees: parseInt(attendees) || 1
            }
        });

        return NextResponse.json(signup);
    } catch (error) {
        console.error("Error creating dinner signup:", error);
        return NextResponse.json({ error: "Failed to create signup" }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const { id: signupId } = await params; // Wait, this route is [id]/signup. If I want to delete, I might need the signup ID.
    // Let's make it simpler: DELETE [id]/signup can delete by name/session? 
    // Or just provide a separate DELETE for the signup ID.
    // I'll stick to POST/GET for now.
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
