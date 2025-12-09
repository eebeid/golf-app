import { NextResponse } from 'next/server';
import { getData, saveData } from '@/lib/data';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const scores = await getData('scores');

    if (courseId) {
        return NextResponse.json(scores.filter(s => s.courseId == courseId));
    }

    return NextResponse.json(scores);
}

export async function POST(request) {
    const body = await request.json();
    const scores = await getData('scores');

    // Body: { playerId, hole, score, courseId }

    const holeNum = parseInt(body.hole);
    if (holeNum < 1 || holeNum > 18) {
        return NextResponse.json({ error: "Invalid hole number. Must be 1-18." }, { status: 400 });
    }

    // Optional: Validate courseId if strictness required, but for now assuming valid input
    const courseId = parseInt(body.courseId);
    if (!courseId) {
        return NextResponse.json({ error: "Course ID is required." }, { status: 400 });
    }

    const existingIndex = scores.findIndex(s => s.playerId == body.playerId && s.hole == body.hole && s.courseId == courseId);

    if (existingIndex >= 0) {
        scores[existingIndex].score = parseInt(body.score);
    } else {
        scores.push({
            playerId: body.playerId, // ID might be string or number depending on generation
            hole: holeNum,
            score: parseInt(body.score),
            courseId: courseId
        });
    }

    await saveData('scores', scores);
    return NextResponse.json({ success: true });
}
