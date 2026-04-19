import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
    const { id } = await params;
    try {
        const course = await prisma.course.findUnique({ where: { id: String(id) } });
        if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        return NextResponse.json(course);
    } catch (error) {
        console.error('Error fetching course:', error);
        return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const { id } = await params;
    try {
        // Score.courseId has no onDelete cascade — delete scores first to avoid FK violation
        await prisma.score.deleteMany({ where: { courseId: String(id) } });
        await prisma.course.delete({ where: { id: String(id) } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting course:', error);
        return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
    }
}
