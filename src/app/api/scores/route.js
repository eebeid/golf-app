import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    const where = courseId ? { courseId: parseInt(courseId) } : {};
    const scores = await prisma.score.findMany({ where });

    return NextResponse.json(scores);
}

export async function POST(request) {
    const body = await request.json();

    // Body: { playerId, hole, score, courseId }
    const holeNum = parseInt(body.hole);
    const scoreVal = parseInt(body.score);
    const courseId = parseInt(body.courseId);

    if (!courseId) {
        return NextResponse.json({ error: "Course ID is required." }, { status: 400 });
    }

    // Use Upsert: Create if not exists, Update if exists (based on unique constraint)
    try {
        await prisma.score.upsert({
            where: {
                playerId_courseId_hole: {
                    playerId: String(body.playerId),
                    courseId: courseId,
                    hole: holeNum
                }
            },
            update: {
                score: scoreVal
            },
            create: {
                playerId: String(body.playerId),
                courseId: courseId,
                hole: holeNum,
                score: scoreVal
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
    }
}
