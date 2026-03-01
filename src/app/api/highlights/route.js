import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { formatDistanceToNow } from 'date-fns';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) return NextResponse.json([]);

    try {
        let tId = tournamentId;
        const t = await prisma.tournament.findUnique({
            where: { slug: tournamentId },
            include: { courses: true }
        });
        if (t) tId = t.id;

        const courses = t?.courses || [];

        const recentScores = await prisma.score.findMany({
            where: { player: { tournamentId: tId } },
            orderBy: { updatedAt: 'desc' },
            take: 100,
            include: { player: true }
        });

        if (recentScores.length === 0) return NextResponse.json([]);

        const getPar = (scoreObj) => {
            if (!scoreObj) return 4;
            const c = courses.find(x => x.id === scoreObj.courseId);
            const holes = Array.isArray(c?.holes) ? c.holes : (c?.holes ? JSON.parse(c.holes) : []);
            const h = holes.find(x => x.number === scoreObj.hole);
            return h ? h.par : 4;
        };

        const playerHistory = {};
        recentScores.forEach(score => {
            if (!playerHistory[score.playerId]) playerHistory[score.playerId] = [];
            playerHistory[score.playerId].push(score);
        });

        const highlights = [];
        const processedIds = new Set();
        const feedCandidates = recentScores.slice(0, 20);

        for (const score of feedCandidates) {
            if (processedIds.has(score.id)) continue;
            processedIds.add(score.id);

            const course = courses.find(c => c.id === score.courseId);
            const courseHoles = Array.isArray(course?.holes) ? course.holes : (course?.holes ? JSON.parse(course.holes) : []);
            const hole = courseHoles.find(h => h.number === score.hole);
            if (!hole || !score.score) continue;

            const par = hole.par;
            const diff = score.score - par;

            let type = 'standard';
            let message = '';

            const pHistory = playerHistory[score.playerId] || [];
            const currentIndex = pHistory.findIndex(s => s.id === score.id);

            if (currentIndex !== -1) {
                const prev1 = pHistory[currentIndex + 1];
                const prev2 = pHistory[currentIndex + 2];

                if (diff <= -1) {
                    const prev1Diff = prev1 ? (prev1.score - getPar(prev1)) : 99;
                    const prev2Diff = prev2 ? (prev2.score - getPar(prev2)) : 99;

                    if (prev1Diff <= -1 && prev2Diff <= -1) {
                        type = 'streak';
                        message = `${score.player.name} is heating up! 3 Birdies in a row! 🔥`;
                    } else if (prev1Diff <= -1) {
                        type = 'streak';
                        message = `Back-to-back Birdies for ${score.player.name}! 🐦🐦`;
                    }
                }

                if (diff <= -1 && type !== 'streak') {
                    const prev1Diff = prev1 ? (prev1.score - getPar(prev1)) : -99;
                    if (prev1Diff >= 2) {
                        type = 'streak';
                        message = `Great bounce back! ${score.player.name} recovers with a Birdie. 💪`;
                    }
                }
            }

            if (!message) {
                if (diff <= -2) {
                    type = 'eagle';
                    message = `EAGLE!! ${score.player.name} crushed Hole ${hole.number} (-${Math.abs(diff)})! 🦅`;
                } else if (diff === -1) {
                    type = 'birdie';
                    message = `${score.player.name} birdied Hole ${hole.number}.`;
                } else if (diff >= 3) {
                    type = 'blowup';
                    message = `${score.player.name} had a "strategic stumble" on Hole ${hole.number}. (+${diff})`;
                }
            }

            if (message) {
                highlights.push({
                    type,
                    player: score.player.name,
                    message,
                    timeAgo: formatDistanceToNow(new Date(score.updatedAt), { addSuffix: true }),
                    timestamp: score.updatedAt
                });
            }
        }

        return NextResponse.json(highlights);

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to fetch highlights" }, { status: 500 });
    }
}
