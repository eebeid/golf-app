import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request, { params }) {
    const id = params.id;
    try {
        await prisma.course.delete({ where: { id: String(id) } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting course:', error);
        return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
    }
}
