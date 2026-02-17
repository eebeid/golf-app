
import prisma from '@/lib/prisma';
import CoursesList from './CoursesList';

export default async function CoursesPage({ params }) {
    const slug = params.tournamentId;

    // Fetch tournament with all necessary relations
    const tournament = await prisma.tournament.findUnique({
        where: { slug },
        include: {
            courses: true,
            settings: true,
            teeTimes: {
                orderBy: { time: 'asc' }
            }
        }
    });

    if (!tournament) {
        return <div className="fade-in">Tournament not found</div>;
    }

    const { courses, settings, teeTimes } = tournament;

    // Calculate derived fields (playDates, rounds) based on Settings
    const enrichedCourses = courses.map(course => {
        const c = {
            ...course,
            playDates: [],
            rounds: [],
            // Default fields to match expected prop shape if missing in DB
            length: course.length || 'N/A',
            rating: course.rating || 'N/A',
            slope: course.slope || 'N/A',
            description: course.description || '', // Schema doesn't have this yet
            image: course.image || null,           // Schema doesn't have this yet
            tees: course.tees || [],
            holes: course.holes || []
        };

        if (settings && settings.roundCourses && settings.roundDates) {
            // Arrays in JSON from Prisma might be objects if not cast, but usually plain arrays
            const sRoundCourses = Array.isArray(settings.roundCourses) ? settings.roundCourses : [];
            const sRoundDates = Array.isArray(settings.roundDates) ? settings.roundDates : [];

            sRoundCourses.forEach((courseId, index) => {
                // courseId might be string vs number issue. DB uses UUID string now.
                if (courseId === course.id) {
                    const date = sRoundDates[index];
                    if (date) {
                        c.playDates.push(date);
                    }
                    c.rounds.push(index + 1);
                }
            });
        }
        return c;
    });

    // Filter to only show courses that are part of the rounds
    const activeCourses = enrichedCourses.filter(c => c.rounds.length > 0);

    return <CoursesList courses={activeCourses} teeTimes={teeTimes} />;
}
