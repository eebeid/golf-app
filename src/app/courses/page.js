import { getData } from '@/lib/data';
import CoursesList from './CoursesList';
import prisma from '@/lib/prisma';

export default async function CoursesPage() {
    // Server-side fetch
    const courses = await getData('courses');

    // Fetch settings for dates
    const settings = await prisma.settings.findUnique({
        where: { id: 'tournament-settings' }
    });

    if (settings && settings.roundCourses && settings.roundDates) {
        // Map dates to courses
        // roundCourses is array of course IDs, roundDates is array of date strings
        courses.forEach(course => {
            course.playDates = [];
            course.rounds = [];
            settings.roundCourses.forEach((courseId, index) => {
                // Use loose equality to handle potential string/number mismatches (e.g. from JSON or Select inputs)
                if (courseId == course.id) {
                    const date = settings.roundDates[index];
                    if (date) {
                        course.playDates.push(date);
                    }
                    // Add round number (1-based index)
                    course.rounds.push(index + 1);
                }
            });
        });
    }

    // Fetch tee times
    const teeTimes = await prisma.teeTime.findMany({
        orderBy: { time: 'asc' }
    });

    // Pass data to Client Component
    return <CoursesList courses={courses} teeTimes={teeTimes} />;
}
