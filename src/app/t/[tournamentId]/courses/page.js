import prisma from '@/lib/prisma';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import CoursesList from './CoursesList';

export default async function CoursesPage({ params }) {
    const { tournamentId } = await params;
    const slug = tournamentId;

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

    if (settings?.showCourses === false) {
        redirect(`/t/${slug}`);
    }

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
            let sRoundCourses = [];
            let sRoundDates = [];
            try {
                sRoundCourses = typeof settings.roundCourses === 'string' ? JSON.parse(settings.roundCourses) : (Array.isArray(settings.roundCourses) ? settings.roundCourses : []);
                sRoundDates = typeof settings.roundDates === 'string' ? JSON.parse(settings.roundDates) : (Array.isArray(settings.roundDates) ? settings.roundDates : []);
            } catch (e) {
                console.error("Error parsing settings JSON", e);
            }

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

    if (settings && settings.roundCourses && settings.roundDates) {
        let sRoundCourses = [];
        let sRoundDates = [];
        try {
            sRoundCourses = typeof settings.roundCourses === 'string' ? JSON.parse(settings.roundCourses) : (Array.isArray(settings.roundCourses) ? settings.roundCourses : []);
            sRoundDates = typeof settings.roundDates === 'string' ? JSON.parse(settings.roundDates) : (Array.isArray(settings.roundDates) ? settings.roundDates : []);
        } catch (e) {
            console.error("Error parsing settings JSON", e);
        }

        sRoundCourses.forEach((courseId, index) => {
            const courseExists = enrichedCourses.some(c => c.id === courseId);
            if (!courseExists && courseId) {
                // Dangling reference - settings point to a course that was deleted
                enrichedCourses.push({
                    id: courseId,
                    name: 'Select Course / Course Deleted',
                    rounds: [index + 1],
                    playDates: sRoundDates[index] ? [sRoundDates[index]] : [],
                    isMissing: true,
                    par: 'N/A',
                    length: 'N/A',
                    rating: 'N/A',
                    slope: 'N/A',
                    tees: [],
                    holes: []
                });
            }
        });
    }

    // Filter to only show courses that are part of the rounds
    let activeCourses = enrichedCourses.filter(c => c.rounds.length > 0);

    // Sort courses by their earliest round number
    activeCourses.sort((a, b) => {
        const minRoundA = Math.min(...a.rounds);
        const minRoundB = Math.min(...b.rounds);
        return minRoundA - minRoundB;
    });

    return (
        <div className="fade-in">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <img src="/images/courses-icon.png" alt="Courses" width={150} height={150} style={{ height: '150px', width: 'auto', borderRadius: 'var(--radius)', boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' }} />
            </div>
            <CoursesList courses={activeCourses} teeTimes={teeTimes} />
        </div>
    );
}
