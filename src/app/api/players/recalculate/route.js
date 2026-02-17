import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateCourseHandicap, getTeeData } from '@/lib/courseHandicap';

export async function POST() {
    try {
        // 1. Fetch all players and courses
        const players = await prisma.player.findMany();
        const coursesData = await import('@/../../data/courses.json');
        const courses = coursesData.default;

        const updates = [];

        // 2. Iterate and calculate
        for (const player of players) {
            const index = player.handicapIndex;
            let changes = {};
            let hasChanges = false;

            // Mapping course IDs to player fields
            const courseMappings = [
                { id: 1, teeField: 'teePlantation', hcpField: 'hcpPlantation' },
                { id: 2, teeField: 'teeRiver', hcpField: 'hcpRiver' },
                { id: 3, teeField: 'teeRNK', hcpField: 'hcpRNK' }
            ];

            for (const map of courseMappings) {
                const course = courses.find(c => c.id === map.id);
                if (!course) continue;

                const teeName = player[map.teeField] || 'Gold'; // Default to Gold if missing
                const tee = getTeeData(course, teeName) || getTeeData(course, 'Gold'); // Fallback to Gold if tee not found

                if (tee) {
                    const newHcp = calculateCourseHandicap(index, tee.rating, tee.slope, course.par);
                    if (newHcp !== player[map.hcpField]) {
                        changes[map.hcpField] = newHcp;
                        hasChanges = true;
                    }
                }
            }

            // 3. Queue update if needed
            if (hasChanges) {
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
