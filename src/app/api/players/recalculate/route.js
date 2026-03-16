import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateCourseHandicap, getTeeData } from '@/lib/courseHandicap';

export async function POST(request) {
    try {
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('tournamentId');

        let tId = null;
        if (slug) {
            const tournament = await prisma.tournament.findUnique({ where: { slug } });
            if (tournament) tId = tournament.id;
        }

        // 1. Fetch all matching players and courses from DB
        const players = await prisma.player.findMany(tId ? { where: { tournamentId: tId } } : undefined);
        const courses = await prisma.course.findMany(tId ? { where: { tournamentId: tId } } : undefined);

        const updates = [];

        // 2. Iterate and calculate
        for (const player of players) {
            const index = player.handicapIndex;
            let changes = {};
            let hasChanges = false;
            let pData = typeof player.courseData === 'string' ? JSON.parse(player.courseData || '{}') : (player.courseData || {});

            // Dynamic course data calculation
            for (const course of courses) {
                let teeName = pData[course.id]?.tee;

                // If no tee is set, default to the longest tee
                if (!teeName && Array.isArray(course.tees) && course.tees.length > 0) {
                    const longestTee = [...course.tees].sort((a, b) => (b.yardage || 0) - (a.yardage || 0))[0];
                    teeName = longestTee.name;
                }

                if (teeName) {
                    const tee = getTeeData(course, teeName) || getTeeData(course, 'Gold');
                    if (tee && tee.rating && tee.slope) {
                        const newHcp = calculateCourseHandicap(index, tee.rating, tee.slope, course.par);

                        // Check if we need to update
                        if (!pData[course.id] || pData[course.id].hcp !== newHcp || pData[course.id].tee !== teeName) {
                            pData[course.id] = {
                                ...(pData[course.id] || {}),
                                tee: teeName,
                                hcp: newHcp
                            };
                            hasChanges = true;
                        }
                    }
                }
            }

            if (hasChanges) {
                changes.courseData = pData;
            }

            // Legacy mapping fallback
            const coursesDataStatic = await import('@/../../data/courses.json').catch(() => ({ default: [] }));
            const staticCourses = coursesDataStatic.default;

            const courseMappings = [
                { id: 1, teeField: 'teePlantation', hcpField: 'hcpPlantation' },
                { id: 2, teeField: 'teeRiver', hcpField: 'hcpRiver' },
                { id: 3, teeField: 'teeRNK', hcpField: 'hcpRNK' }
            ];

            for (const map of courseMappings) {
                const course = staticCourses.find(c => c.id === map.id);
                if (!course) continue;

                const teeName = player[map.teeField] || 'Gold';
                const tee = getTeeData(course, teeName) || getTeeData(course, 'Gold');

                if (tee && tee.rating && tee.slope) {
                    const newHcp = calculateCourseHandicap(index, tee.rating, tee.slope, course.par);
                    if (newHcp !== player[map.hcpField]) {
                        changes[map.hcpField] = newHcp;
                        hasChanges = true;
                    }
                }
            }

            // 3. Queue update if needed
            if (Object.keys(changes).length > 0) {
                updates.push(prisma.player.update({
                    where: { id: player.id },
                    data: changes
                }));
            }
        }

        // 4. Execute updates
        await Promise.all(updates);

        return NextResponse.json({
            success: true,
            message: `Updated ${updates.length} players`,
            updatedCount: updates.length
        });

    } catch (error) {
        console.error('Recalculate error:', error);
        return NextResponse.json({ error: 'Failed to recalculate handicaps' }, { status: 500 });
    }
}
