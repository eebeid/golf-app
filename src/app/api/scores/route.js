import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    const where = courseId ? { courseId: parseInt(courseId) } : {};
    const scores = await prisma.score.findMany({ where });

    return NextResponse.json(scores);
}

export async function DELETE() {
    try {
        await prisma.score.deleteMany({});
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to clear scores" }, { status: 500 });
    }
}

export async function POST(request) {
    const body = await request.json();
    console.log("Score POST:", body);

    // Body: { playerId, hole, score, courseId }
    const holeNum = parseInt(body.hole);
    const scoreVal = parseInt(body.score);
    const courseId = parseInt(body.courseId);

    if (!courseId) {
        return NextResponse.json({ error: "Course ID is required." }, { status: 400 });
    }

    try {
        // Import course data to get par and calculate Stableford points
        const coursesData = await import('@/../../data/courses.json');
        const courses = coursesData.default;
        const course = courses.find(c => c.id === courseId);

        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        // Get the hole data
        const hole = course.holes?.find(h => h.number === holeNum);
        if (!hole) {
            return NextResponse.json({ error: "Hole not found" }, { status: 404 });
        }

        // Get player's course handicap
        const player = await prisma.player.findUnique({
            where: { id: String(body.playerId) }
        });

        if (!player) {
            return NextResponse.json({ error: "Player not found" }, { status: 404 });
        }

        // Determine course handicap based on courseId
        let courseHandicap = 0;
        if (courseId === 1) courseHandicap = player.hcpPlantation || 0;
        if (courseId === 2) courseHandicap = player.hcpRiver || 0;
        if (courseId === 3) courseHandicap = player.hcpRNK || 0;

        // Calculate handicap strokes distribution
        const { distributeHandicapStrokes, calculateStablefordPoints } = await import('@/lib/stableford');
        const strokesMap = distributeHandicapStrokes(courseHandicap, course.holes);
        const strokesReceived = strokesMap[holeNum] || 0;

        // Calculate Stableford points
        const stablefordPoints = calculateStablefordPoints(scoreVal, hole.par, strokesReceived);

        // Use Upsert: Create if not exists, Update if exists (based on unique constraint)
        await prisma.score.upsert({
            where: {
                playerId_courseId_hole: {
                    playerId: String(body.playerId),
                    courseId: courseId,
                    hole: holeNum
                }
            },
            update: {
                score: scoreVal,
                stablefordPoints: stablefordPoints,
                strokesReceived: strokesReceived
            },
            create: {
                playerId: String(body.playerId),
                courseId: courseId,
                hole: holeNum,
                score: scoreVal,
                stablefordPoints: stablefordPoints,
                strokesReceived: strokesReceived
            }
        });

        return NextResponse.json({
            success: true,
            stablefordPoints,
            strokesReceived
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
    }
}
